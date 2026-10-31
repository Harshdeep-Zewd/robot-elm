import fs from 'fs';
import path from 'path';
import { store } from './store';

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://choice-caribou-245421.upstash.io';
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAA76tAQIgcDIyNGFkYzM3NGE3MzA0Y2VkOGYwNzY4ZGQzMGQxNTM4Ng';

const LOCAL_TMP_DIR = path.join('/tmp', 'roboserv_cache');
try {
  if (!fs.existsSync(LOCAL_TMP_DIR)) {
    fs.mkdirSync(LOCAL_TMP_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem errors in restricted environments
}

export interface WorkspaceSyncState {
  projects: any[];
  deletedProjectIds: number[];
  activeProjectId?: number;
  allTrackers: any[];
  selectedTrackerId?: number | null;
  allFolders: any[];
  allObjects: any[];
  relationships: any[];
  testSteps: any[];
  artifacts: any[];
  testRuns: any[];
  testRunDetailsMap: Record<number, any>;
  lastUpdated: string;
  updatedBy: string;
}

/**
 * Fetch authoritative global workspace state across all browsers and PCs.
 */
export async function getCloudState(account: string = 'zewd'): Promise<WorkspaceSyncState | null> {
  const cacheKey = `roboserv_global_state_${account.toLowerCase().trim()}`;

  // 1. Try reading from Upstash Redis (Global Cloud Store)
  try {
    const res = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', cacheKey])
    });

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.result && typeof data.result === 'string') {
        const parsed: WorkspaceSyncState = JSON.parse(data.result);
        if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          // Write local copy to /tmp for fast failover
          try {
            fs.writeFileSync(path.join(LOCAL_TMP_DIR, `${cacheKey}.json`), data.result, 'utf8');
          } catch (e) {}

          // Synchronize in-memory store
          syncMemoryStore(parsed);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[PersistentStorage] Redis GET failed, checking local /tmp cache:', err);
  }

  // 2. Fallback to /tmp disk cache
  try {
    const filePath = path.join(LOCAL_TMP_DIR, `${cacheKey}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed: WorkspaceSyncState = JSON.parse(content);
      if (parsed && Array.isArray(parsed.projects)) {
        syncMemoryStore(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PersistentStorage] /tmp cache read failed:', err);
  }

  return null;
}

/**
 * Save authoritative global workspace state to Redis and local /tmp cache.
 */
export async function saveCloudState(account: string = 'zewd', state: WorkspaceSyncState): Promise<boolean> {
  const cacheKey = `roboserv_global_state_${account.toLowerCase().trim()}`;
  const serialized = JSON.stringify(state);

  // Synchronize in-memory store first
  syncMemoryStore(state);

  // 1. Write to local /tmp cache
  try {
    fs.writeFileSync(path.join(LOCAL_TMP_DIR, `${cacheKey}.json`), serialized, 'utf8');
  } catch (e) {
    console.warn('[PersistentStorage] Could not write to /tmp cache:', e);
  }

  // 2. Persist to Upstash Redis
  try {
    const res = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', cacheKey, serialized])
    });

    if (res.ok) {
      const data: any = await res.json();
      return data?.result === 'OK';
    } else {
      console.error('[PersistentStorage] Redis SET failed with status:', res.status, await res.text());
      return false;
    }
  } catch (err) {
    console.error('[PersistentStorage] Redis SET network error:', err);
    return false;
  }
}

/**
 * Keeps in-memory store in sync with the global state bundle
 */
function syncMemoryStore(state: WorkspaceSyncState) {
  try {
    if (Array.isArray(state.projects) && state.projects.length > 0) {
      store.projects = state.projects;
    }
    if (Array.isArray(state.allTrackers) && state.allTrackers.length > 0) {
      store.trackers = state.allTrackers;
    }
    if (Array.isArray(state.allFolders)) {
      store.folders = state.allFolders;
    }
    if (Array.isArray(state.allObjects)) {
      store.objects = state.allObjects;
    }
    if (Array.isArray(state.relationships)) {
      store.relationships = state.relationships;
    }
    if (Array.isArray(state.testSteps)) {
      store.testSteps = state.testSteps;
    }
    if (Array.isArray(state.artifacts)) {
      store.artifacts = state.artifacts;
    }
    if (Array.isArray(state.testRuns)) {
      store.testRuns = state.testRuns;
    }
  } catch (e) {
    console.warn('[PersistentStorage] syncMemoryStore error:', e);
  }
}
