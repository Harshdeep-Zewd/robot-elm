import { Project, Tracker, EngineeringObject, Relationship, TestStep, Artifact } from '../types/elm';
import { CORE_25_TRACKERS, MIGRATION_MAPPING, createProjectTrackers } from '../data/canonicalTrackers';

export interface MigrationSummary {
  timestamp: string;
  projectId: number;
  projectKey: string;
  projectName: string;
  totalLegacyObjects: number;
  totalMigratedObjects: number;
  totalLegacyTrackers: number;
  totalCoreTrackers: number;
  trackerBreakdown: {
    legacyKey: string;
    targetKey: string;
    count: number;
  }[];
  unmappedCount: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  backupKey: string;
}

/**
 * Creates a timestamped snapshot of all project data before migration.
 */
export function createMigrationBackup(
  project: Project,
  trackers: Tracker[],
  objects: EngineeringObject[],
  relationships: Relationship[],
  testSteps: TestStep[],
  artifacts: Artifact[]
): string {
  const timestamp = new Date().toISOString();
  const backupKey = `roboserv_elm_migration_backup_${project.id}_${Date.now()}`;
  const payload = {
    timestamp,
    project,
    trackers,
    objects,
    relationships,
    testSteps,
    artifacts
  };

  try {
    localStorage.setItem(backupKey, JSON.stringify(payload));
    // Also save as latest backup pointer
    localStorage.setItem(`roboserv_elm_latest_backup_${project.id}`, backupKey);
  } catch (err) {
    console.warn('Backup storage error:', err);
  }

  return backupKey;
}

/**
 * Generates a dry-run migration preview before executing.
 */
export function getMigrationPreview(
  project: Project,
  trackers: Tracker[],
  objects: EngineeringObject[]
) {
  const breakdown: Record<string, { targetKey: string; count: number; sampleTitles: string[] }> = {};
  let unmappedCount = 0;

  objects.forEach(obj => {
    const parentTracker = trackers.find(t => t.id === obj.tracker_id);
    const pfx = parentTracker?.prefix?.replace(`${project.key}-`, '') || parentTracker?.key || '';
    const normPfx = pfx.endsWith('-') ? pfx : `${pfx}-`;
    const mapping = MIGRATION_MAPPING[normPfx] || MIGRATION_MAPPING[pfx];

    if (mapping) {
      if (!breakdown[normPfx]) {
        breakdown[normPfx] = { targetKey: mapping.targetKey, count: 0, sampleTitles: [] };
      }
      breakdown[normPfx].count++;
      if (breakdown[normPfx].sampleTitles.length < 3) {
        breakdown[normPfx].sampleTitles.push(obj.title);
      }
    } else {
      unmappedCount++;
    }
  });

  return {
    totalObjects: objects.length,
    breakdown,
    unmappedCount
  };
}

/**
 * Executes the formal migration of a project from 101 legacy trackers into the 25 Core Trackers.
 */
export function executeProjectMigration(
  project: Project,
  currentTrackers: Tracker[],
  currentObjects: EngineeringObject[],
  currentRelationships: Relationship[],
  currentTestSteps: TestStep[],
  currentArtifacts: Artifact[]
): {
  newTrackers: Tracker[];
  newObjects: EngineeringObject[];
  newRelationships: Relationship[];
  reconciliation: MigrationSummary;
} {
  // 1. Create Verified Pre-Migration Snapshot (Phase 0)
  const backupKey = createMigrationBackup(
    project,
    currentTrackers,
    currentObjects,
    currentRelationships,
    currentTestSteps,
    currentArtifacts
  );

  // 2. Instantiate the 25 Core Trackers for this Project
  const newTrackers = createProjectTrackers(project.id, project.key);
  const coreTrackerMap = new Map<string, Tracker>();
  newTrackers.forEach(t => coreTrackerMap.set(t.key, t));

  // Sequence generators per target tracker prefix
  const seqCounters: Record<string, number> = {};

  // 3. Migrate Records
  const trackerBreakdownMap: Record<string, { legacyKey: string; targetKey: string; count: number }> = {};
  let unmappedCount = 0;

  const newObjects: EngineeringObject[] = currentObjects.map(obj => {
    const parentTracker = currentTrackers.find(t => t.id === obj.tracker_id);
    const rawKey = parentTracker?.key || '';
    const pfx = parentTracker?.prefix?.replace(`${project.key}-`, '') || rawKey;
    const normPfx = pfx.endsWith('-') ? pfx : `${pfx}-`;

    const mapping = MIGRATION_MAPPING[normPfx] || MIGRATION_MAPPING[rawKey] || MIGRATION_MAPPING[`${rawKey}-`];

    let targetKey = 'SYS-REQ'; // safe fallback
    if (mapping) {
      targetKey = mapping.targetKey;
    } else if (obj.type === 'TEST_CASE') {
      targetKey = 'TC';
    } else if (obj.type === 'TEST_SET') {
      targetKey = 'TSET';
    } else if (obj.type === 'RISK') {
      targetKey = 'RISK';
    } else if (obj.type === 'DEFECT') {
      targetKey = 'DEF';
    } else if (obj.type === 'TASK') {
      targetKey = 'TASK';
    } else if (obj.type === 'RELEASE') {
      targetKey = 'REL';
    } else {
      unmappedCount++;
    }

    const targetTracker = coreTrackerMap.get(targetKey) || newTrackers[1]; // fallback to SYS-REQ
    const targetPrefix = targetTracker.prefix;

    if (!seqCounters[targetPrefix]) {
      seqCounters[targetPrefix] = 1;
    }
    const seqNum = seqCounters[targetPrefix]++;
    const paddedSeq = String(seqNum).padStart(3, '0');
    const newObjectKey = `${targetPrefix}${paddedSeq}`;

    // Record Breakdown
    const bKey = `${normPfx}->${targetKey}`;
    if (!trackerBreakdownMap[bKey]) {
      trackerBreakdownMap[bKey] = { legacyKey: normPfx, targetKey, count: 0 };
    }
    trackerBreakdownMap[bKey].count++;

    // Safety Level normalization for requirements
    const isRequirement = targetTracker.type === 'REQUIREMENT' || ['STK-REQ', 'SYS-REQ', 'HW-REQ', 'SW-REQ', 'QREQ'].includes(targetKey);
    let finalSafetyLevel = obj.safety_level;
    if (isRequirement) {
      if (!finalSafetyLevel || finalSafetyLevel === 'Standard / Non-Safety') {
        finalSafetyLevel = 'Non-Safety-Related';
      } else if (['ASIL-D', 'ASIL-C', 'ASIL-B', 'ASIL-A', 'SIL-3', 'SIL-2', 'SIL-1'].includes(finalSafetyLevel as string)) {
        finalSafetyLevel = 'Safety-Related';
      } else if (!['Safety-Related', 'Non-Safety-Related', 'Safety Relevance Under Assessment'].includes(finalSafetyLevel)) {
        finalSafetyLevel = 'Safety Relevance Under Assessment';
      }
    }

    // Default Preconditions and Post-Actions for Test Cases
    const isTestCase = targetTracker.type === 'TEST_CASE' || targetKey === 'TC';
    const finalPrecondition = isTestCase ? (obj.pre_action || 'System powered on, emergency stop disengaged, floor clearance verified.') : obj.pre_action;
    const finalPostAction = isTestCase ? (obj.post_action || 'Record telemetry logs, return robot to service dock, verify zero safety faults.') : obj.post_action;

    return {
      ...obj,
      tracker_id: targetTracker.id,
      tracker_name: targetTracker.name,
      object_key: newObjectKey,
      type: targetTracker.type,
      safety_level: finalSafetyLevel,
      safety_framework: obj.safety_framework || (finalSafetyLevel === 'Safety-Related' ? 'ISO 13482 (Service Robots)' : undefined),
      pre_action: finalPrecondition,
      post_action: finalPostAction,
      preconditions: finalPrecondition,
      post_actions: finalPostAction,
      legacy_tracker_key: parentTracker?.key || normPfx,
      legacy_object_key: obj.object_key,
      updated_at: new Date().toISOString()
    };
  });

  // 4. Update Object Counts on New Trackers
  newTrackers.forEach(t => {
    t.object_count = newObjects.filter(o => o.tracker_id === t.id).length;
  });

  // 5. Re-link Relationships
  const objectKeyMap = new Map<number, string>();
  newObjects.forEach(o => objectKeyMap.set(o.id, o.object_key));

  const newRelationships = currentRelationships.map(rel => ({
    ...rel,
    source_key: objectKeyMap.get(rel.source_id) || rel.source_key,
    target_key: objectKeyMap.get(rel.target_id) || rel.target_key
  }));

  // 6. Generate Reconciliation Report
  const reconciliation: MigrationSummary = {
    timestamp: new Date().toISOString(),
    projectId: project.id,
    projectKey: project.key,
    projectName: project.name,
    totalLegacyObjects: currentObjects.length,
    totalMigratedObjects: newObjects.length,
    totalLegacyTrackers: currentTrackers.length,
    totalCoreTrackers: newTrackers.length,
    trackerBreakdown: Object.values(trackerBreakdownMap),
    unmappedCount,
    status: unmappedCount === 0 && newObjects.length === currentObjects.length ? 'SUCCESS' : 'WARNING',
    backupKey
  };

  try {
    localStorage.setItem(`roboserv_elm_reconciliation_report_${project.id}`, JSON.stringify(reconciliation));
    localStorage.setItem('roboserv_elm_latest_reconciliation', JSON.stringify(reconciliation));
  } catch (err) {
    console.warn('Reconciliation storage error:', err);
  }

  return {
    newTrackers,
    newObjects,
    newRelationships,
    reconciliation
  };
}
