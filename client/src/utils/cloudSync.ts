import { Project, Tracker, Folder, EngineeringObject, Relationship, TestStep, Artifact, TestRun } from '../types/elm';

export interface WorkspaceSyncState {
  projects: Project[];
  deletedProjectIds: number[];
  activeProjectId?: number;
  allTrackers: Tracker[];
  selectedTrackerId?: number | null;
  allFolders: Folder[];
  allObjects: EngineeringObject[];
  relationships: Relationship[];
  testSteps: TestStep[];
  artifacts: Artifact[];
  testRuns: TestRun[];
  testRunDetailsMap: Record<number, any>;
  lastUpdated?: string;
  updatedBy?: string;
}

const UPSTASH_REDIS_REST_URL = 'https://choice-caribou-245421.upstash.io';
const UPSTASH_REDIS_REST_TOKEN = 'gQAAAAAAA76tAQIgcDIyNGFkYzM3NGE3MzA0Y2VkOGYwNzY4ZGQzMGQxNTM4Ng';

/**
 * Fetch authoritative global workspace state from the serverless API (with Upstash direct fallback).
 */
export async function fetchGlobalStateFromCloud(account: string = 'zewd'): Promise<WorkspaceSyncState | null> {
  const cleanAccount = account.toLowerCase().trim();

  // 1. Try serverless API endpoint
  try {
    const res = await fetch(`/api/sync/state?account=${encodeURIComponent(cleanAccount)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.state && Array.isArray(data.state.projects) && data.state.projects.length > 0) {
        return data.state as WorkspaceSyncState;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] /api/sync/state unreachable, attempting direct Upstash Redis connection...', err);
  }

  // 2. Direct fallback to Upstash Redis REST
  try {
    const cacheKey = `roboserv_global_state_${cleanAccount}`;
    const res = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', cacheKey])
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.result && typeof data.result === 'string') {
        const parsed = JSON.parse(data.result);
        if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          return parsed as WorkspaceSyncState;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Direct Upstash fallback failed:', err);
  }

  return null;
}

/**
 * Push current workspace state to serverless API and Upstash Redis.
 */
export async function pushGlobalStateToCloud(state: WorkspaceSyncState, account: string = 'zewd'): Promise<boolean> {
  const cleanAccount = account.toLowerCase().trim();
  const fullPayload: WorkspaceSyncState = {
    ...state,
    lastUpdated: new Date().toISOString(),
    updatedBy: cleanAccount
  };

  let serverSuccess = false;

  // 1. Send to serverless API
  try {
    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: cleanAccount,
        state: fullPayload
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        serverSuccess = true;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] POST /api/sync/state failed, trying direct Upstash:', err);
  }

  // 2. Also write directly to Upstash Redis for guaranteed cross-browser availability
  try {
    const cacheKey = `roboserv_global_state_${cleanAccount}`;
    const serialized = JSON.stringify(fullPayload);
    const res = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', cacheKey, serialized])
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.result === 'OK') {
        return true;
      }
    }
  } catch (err) {
    console.error('[CloudSync] Direct Upstash push error:', err);
  }

  return serverSuccess;
}

/**
 * Merges local browser state with cloud state intelligently.
 * Ensures items created in one browser (e.g. Chrome) are retained and propagated to cloud,
 * while deletions and updates from other browsers are honored.
 */
export function mergeLocalAndCloudState(
  localState: WorkspaceSyncState,
  cloudState: WorkspaceSyncState | null
): { merged: WorkspaceSyncState; hasLocalAdditions: boolean } {
  if (!cloudState) {
    return { merged: localState, hasLocalAdditions: true };
  }

  let hasLocalAdditions = false;

  // 1. Deleted Project IDs (union)
  const mergedDeletedProjectIds = Array.from(new Set([
    ...(localState.deletedProjectIds || []),
    ...(cloudState.deletedProjectIds || [])
  ]));

  // 2. Projects
  const cloudProjects = (cloudState.projects || []).filter(p => p && !mergedDeletedProjectIds.includes(p.id));
  const localProjects = (localState.projects || []).filter(p => p && !mergedDeletedProjectIds.includes(p.id));

  const projectMap = new Map<number, Project>();
  cloudProjects.forEach(p => projectMap.set(p.id, p));

  for (const lp of localProjects) {
    const existing = projectMap.get(lp.id) || Array.from(projectMap.values()).find(p => p.key.toUpperCase() === lp.key.toUpperCase());
    if (!existing) {
      projectMap.set(lp.id, lp);
      hasLocalAdditions = true;
    }
  }
  const mergedProjects = Array.from(projectMap.values());

  // 3. Trackers
  const validProjectIds = mergedProjects.map(p => p.id);
  const trackerMap = new Map<number, Tracker>();
  (cloudState.allTrackers || []).filter(t => t && validProjectIds.includes(t.project_id)).forEach(t => trackerMap.set(t.id, t));

  for (const lt of (localState.allTrackers || [])) {
    if (lt && validProjectIds.includes(lt.project_id)) {
      if (!trackerMap.has(lt.id)) {
        trackerMap.set(lt.id, lt);
        hasLocalAdditions = true;
      }
    }
  }
  const mergedTrackers = Array.from(trackerMap.values());

  // 4. Folders
  const folderMap = new Map<number, Folder>();
  (cloudState.allFolders || []).forEach(f => folderMap.set(f.id, f));
  for (const lf of (localState.allFolders || [])) {
    if (!folderMap.has(lf.id)) {
      folderMap.set(lf.id, lf);
      hasLocalAdditions = true;
    }
  }
  const mergedFolders = Array.from(folderMap.values());

  // 5. Engineering Objects
  const objectMap = new Map<number, EngineeringObject>();
  (cloudState.allObjects || []).forEach(o => objectMap.set(o.id, o));

  for (const lo of (localState.allObjects || [])) {
    if (!lo) continue;
    const existing = objectMap.get(lo.id);
    if (!existing) {
      objectMap.set(lo.id, lo);
      hasLocalAdditions = true;
    } else {
      // Pick the object with higher version or newer updated_at
      if ((lo.version || 1) > (existing.version || 1)) {
        objectMap.set(lo.id, lo);
        hasLocalAdditions = true;
      }
    }
  }
  const mergedObjects = Array.from(objectMap.values());

  // 6. Test Runs
  const runMap = new Map<number, TestRun>();
  (cloudState.testRuns || []).filter(r => r && validProjectIds.includes(r.project_id)).forEach(r => runMap.set(r.id, r));

  for (const lr of (localState.testRuns || [])) {
    if (lr && validProjectIds.includes(lr.project_id)) {
      if (!runMap.has(lr.id)) {
        runMap.set(lr.id, lr);
        hasLocalAdditions = true;
      }
    }
  }
  const mergedTestRuns = Array.from(runMap.values());

  // 7. Test Run Details Map
  const mergedRunDetails = {
    ...(cloudState.testRunDetailsMap || {}),
    ...(localState.testRunDetailsMap || {})
  };

  // 8. Relationships
  const relMap = new Map<number, Relationship>();
  (cloudState.relationships || []).forEach(r => relMap.set(r.id, r));
  for (const lr of (localState.relationships || [])) {
    if (!relMap.has(lr.id)) {
      relMap.set(lr.id, lr);
      hasLocalAdditions = true;
    }
  }
  const mergedRelationships = Array.from(relMap.values());

  // 9. Test Steps
  const stepMap = new Map<number, TestStep>();
  (cloudState.testSteps || []).forEach(s => stepMap.set(s.id, s));
  for (const ls of (localState.testSteps || [])) {
    if (!stepMap.has(ls.id)) {
      stepMap.set(ls.id, ls);
      hasLocalAdditions = true;
    }
  }
  const mergedTestSteps = Array.from(stepMap.values());

  // 10. Artifacts
  const artMap = new Map<number, Artifact>();
  (cloudState.artifacts || []).forEach(a => artMap.set(a.id, a));
  for (const la of (localState.artifacts || [])) {
    if (!artMap.has(la.id)) {
      artMap.set(la.id, la);
      hasLocalAdditions = true;
    }
  }
  const mergedArtifacts = Array.from(artMap.values());

  const merged: WorkspaceSyncState = {
    projects: mergedProjects,
    deletedProjectIds: mergedDeletedProjectIds,
    activeProjectId: cloudState.activeProjectId || localState.activeProjectId || mergedProjects[0]?.id || 1,
    allTrackers: mergedTrackers,
    selectedTrackerId: cloudState.selectedTrackerId ?? localState.selectedTrackerId,
    allFolders: mergedFolders,
    allObjects: mergedObjects,
    relationships: mergedRelationships,
    testSteps: mergedTestSteps,
    artifacts: mergedArtifacts,
    testRuns: mergedTestRuns,
    testRunDetailsMap: mergedRunDetails,
    lastUpdated: cloudState.lastUpdated || new Date().toISOString(),
    updatedBy: cloudState.updatedBy || 'zewd'
  };

  return { merged, hasLocalAdditions };
}
