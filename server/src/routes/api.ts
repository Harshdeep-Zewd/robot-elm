import { Router } from 'express';
import { store } from '../db/store';
import { createProjectTrackers } from '../db/canonicalTrackers';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure Multer for file storage
const uploadDir = path.join('/tmp', 'artifacts');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem error in serverless environment
}
const upload = multer({ dest: uploadDir });

// --- PROJECTS & TRACKERS ---
router.get('/projects', (req, res) => {
  res.json(store.projects);
});

router.post('/projects', (req, res) => {
  const { key, name, description } = req.body;
  if (!key || !name) {
    return res.status(400).json({ error: 'Key and Name are required' });
  }

  const upperKey = key.toUpperCase().trim();
  const newProject = {
    id: store.projects.length + 1,
    key: upperKey,
    name: name.trim(),
    description: description || '',
    created_at: new Date().toISOString()
  };

  store.projects.unshift(newProject);

  // Auto-initialize all 101 standard engineering trackers for new project
  const pId = newProject.id;
  const projectTrackers = createProjectTrackers(pId, upperKey);
  for (const tt of projectTrackers) {
    store.trackers.push({
      id: tt.id,
      project_id: pId,
      key: tt.key,
      name: tt.name,
      type: tt.type,
      prefix: tt.prefix,
      category: tt.category
    });
  }

  // Audit log
  store.auditLogs.unshift({
    id: store.auditLogs.length + 1,
    user_name: 'Alex Chen',
    user_email: 'alex.chen@roboserv.io',
    action: 'CREATE',
    entity_type: 'PROJECT',
    entity_id: pId,
    details: { key: upperKey, name: name.trim() },
    created_at: new Date().toISOString()
  });

  res.json({ success: true, id: pId, key: upperKey });
});

router.get('/projects/:projectId/trackers', (req, res) => {
  const pId = Number(req.params.projectId);
  const pTrackers = store.trackers.filter(t => t.project_id === pId);
  
  const result = pTrackers.map(t => {
    const objectCount = store.objects.filter(o => o.tracker_id === t.id).length;
    return { ...t, object_count: objectCount };
  });

  res.json(result);
});

router.get('/trackers/:trackerId/folders', (req, res) => {
  const tId = Number(req.params.trackerId);
  const pFolders = store.folders.filter(f => f.tracker_id === tId);
  res.json(pFolders);
});

router.post('/folders', (req, res) => {
  const { tracker_id, parent_id, name } = req.body;
  if (!tracker_id || !name) {
    return res.status(400).json({ error: 'tracker_id and name are required' });
  }
  const existing = store.folders.filter(f => f.tracker_id === Number(tracker_id));
  const newFolder = {
    id: Date.now(),
    tracker_id: Number(tracker_id),
    parent_id: parent_id ? Number(parent_id) : null,
    name: String(name).trim(),
    position: existing.length + 1
  };
  store.folders.push(newFolder);
  res.status(201).json(newFolder);
});

router.get('/trackers/:trackerId/objects', (req, res) => {
  const tId = Number(req.params.trackerId);
  const { folderId, search, status, priority } = req.query;

  let filtered = store.objects.filter(o => o.tracker_id === tId);

  if (folderId) {
    filtered = filtered.filter(o => o.folder_id === Number(folderId));
  }
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  if (priority) {
    filtered = filtered.filter(o => o.priority === priority);
  }
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(o => 
      o.object_key.toLowerCase().includes(s) || 
      o.title.toLowerCase().includes(s) || 
      o.description.toLowerCase().includes(s)
    );
  }

  const result = filtered.map(o => {
    const owner = store.users.find(u => u.id === o.owner_id);
    const folder = store.folders.find(f => f.id === o.folder_id);
    return {
      ...o,
      owner_name: owner?.name || 'Alex Chen',
      folder_name: folder?.name || null
    };
  });

  res.json(result);
});

// --- ENGINEERING OBJECT DETAIL, CREATE & UPDATE ---
router.get('/objects/:id', (req, res) => {
  const objId = Number(req.params.id);
  const object = store.objects.find(o => o.id === objId);

  if (!object) {
    return res.status(404).json({ error: 'Object not found' });
  }

  const owner = store.users.find(u => u.id === object.owner_id);
  const tracker = store.trackers.find(t => t.id === object.tracker_id);

  // Outgoing relationships
  const outgoingRels = store.relationships
    .filter(r => r.source_id === objId)
    .map(r => {
      const target = store.objects.find(o => o.id === r.target_id);
      return {
        ...r,
        target_key: target?.object_key,
        target_title: target?.title,
        target_type: target?.type
      };
    });

  // Incoming relationships
  const incomingRels = store.relationships
    .filter(r => r.target_id === objId)
    .map(r => {
      const source = store.objects.find(o => o.id === r.source_id);
      return {
        ...r,
        source_key: source?.object_key,
        source_title: source?.title,
        source_type: source?.type
      };
    });

  // Versions
  const versions = store.objectVersions.filter(v => v.object_id === objId);
  const testSteps = store.testSteps.filter(s => s.test_case_id === objId);
  const attachments = store.artifacts.filter(a => a.object_id === objId);

  res.json({
    ...object,
    owner_name: owner?.name || 'Alex Chen',
    tracker_key: tracker?.key,
    tracker_name: tracker?.name,
    tracker_type: tracker?.type,
    metadata: JSON.parse(object.metadata_json || '{}'),
    outgoingRelationships: outgoingRels,
    incomingRelationships: incomingRels,
    versions,
    testSteps,
    attachments
  });
});

router.post('/objects', (req, res) => {
  const { tracker_id, folder_id, title, description, priority, owner_id, metadata } = req.body;

  const tracker = store.trackers.find(t => t.id === Number(tracker_id));
  if (!tracker) {
    return res.status(400).json({ error: 'Invalid tracker ID' });
  }

  const count = store.objects.filter(o => o.tracker_id === tracker.id).length;
  const object_key = `${tracker.prefix}${String(count + 1).padStart(3, '0')}`;

  const newObj: any = {
    id: store.objects.length + 1,
    tracker_id: tracker.id,
    folder_id: folder_id || null,
    object_key,
    title,
    description: description || '',
    type: tracker.type,
    status: 'DRAFT',
    priority: priority || 'MEDIUM',
    owner_id: owner_id || 1,
    version: 1,
    metadata_json: JSON.stringify(metadata || {}),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.objects.unshift(newObj);

  store.objectVersions.unshift({
    id: store.objectVersions.length + 1,
    object_id: newObj.id,
    version: 1,
    title,
    description: description || '',
    status: 'DRAFT',
    metadata_json: JSON.stringify(metadata || {}),
    changed_fields: '[]',
    change_reason: 'Initial object creation',
    author_id: owner_id || 1,
    created_at: new Date().toISOString()
  });

  store.auditLogs.unshift({
    id: store.auditLogs.length + 1,
    user_name: 'Alex Chen',
    user_email: 'alex.chen@roboserv.io',
    action: 'CREATE',
    entity_type: tracker.type,
    entity_id: newObj.id,
    details: { key: object_key, title },
    created_at: new Date().toISOString()
  });

  res.json({ success: true, id: newObj.id, object_key });
});

router.put('/objects/:id', (req, res) => {
  const objId = Number(req.params.id);
  const currentObj = store.objects.find(o => o.id === objId);

  if (!currentObj) {
    return res.status(404).json({ error: 'Object not found' });
  }

  const { title, description, status, priority, owner_id, metadata, change_reason } = req.body;
  const newVersion = currentObj.version + 1;

  currentObj.title = title || currentObj.title;
  currentObj.description = description !== undefined ? description : currentObj.description;
  currentObj.status = status || currentObj.status;
  currentObj.priority = priority || currentObj.priority;
  currentObj.owner_id = owner_id || currentObj.owner_id;
  currentObj.version = newVersion;
  currentObj.metadata_json = JSON.stringify(metadata || JSON.parse(currentObj.metadata_json || '{}'));
  currentObj.updated_at = new Date().toISOString();

  store.objectVersions.unshift({
    id: store.objectVersions.length + 1,
    object_id: objId,
    version: newVersion,
    title: currentObj.title,
    description: currentObj.description,
    status: currentObj.status,
    metadata_json: currentObj.metadata_json,
    changed_fields: '["title", "description", "status", "metadata"]',
    change_reason: change_reason || 'Updated object details',
    author_id: owner_id || 1,
    created_at: new Date().toISOString()
  });

  res.json({ success: true, version: newVersion });
});

// --- TRACEABILITY ENGINE & MATRIX ---
router.get('/traceability/matrix', (req, res) => {
  const { sourceTrackerId, targetTrackerId } = req.query;

  const sId = Number(sourceTrackerId);
  const tId = Number(targetTrackerId);

  const sources = store.objects.filter(o => o.tracker_id === sId);
  const targets = store.objects.filter(o => o.tracker_id === tId);

  const links = store.relationships.filter(r => {
    const sObj = store.objects.find(o => o.id === r.source_id);
    const tObj = store.objects.find(o => o.id === r.target_id);
    return sObj?.tracker_id === sId && tObj?.tracker_id === tId;
  });

  res.json({ sources, targets, links });
});

router.get('/traceability/coverage', (req, res) => {
  const unverifiedReqs = store.objects.filter(o => 
    o.type === 'REQUIREMENT' && 
    !store.relationships.some(r => r.source_id === o.id && r.relationship_type === 'VERIFIED_BY')
  );

  const orphanTests = store.objects.filter(o => 
    o.type === 'TEST_CASE' && 
    !store.relationships.some(r => r.target_id === o.id && r.relationship_type === 'VERIFIED_BY')
  );

  const unmitigatedRisks = store.objects.filter(o => 
    o.type === 'RISK' && 
    !store.relationships.some(r => r.source_id === o.id && r.relationship_type === 'MITIGATED_BY')
  );

  res.json({
    unverifiedRequirements: unverifiedReqs,
    orphanTests,
    unmitigatedRisks,
    stats: {
      unverifiedCount: unverifiedReqs.length,
      orphanTestCount: orphanTests.length,
      unmitigatedRiskCount: unmitigatedRisks.length
    }
  });
});

router.get('/traceability/impact/:objectId', (req, res) => {
  const objectId = Number(req.params.objectId);
  const rootObject = store.objects.find(o => o.id === objectId);

  if (!rootObject) return res.status(404).json({ error: 'Object not found' });

  const impactedDownstream = store.relationships
    .filter(r => r.source_id === objectId)
    .map(r => {
      const target = store.objects.find(o => o.id === r.target_id);
      return { ...r, id: target?.id, object_key: target?.object_key, title: target?.title, type: target?.type, status: target?.status };
    });

  const impactedUpstream = store.relationships
    .filter(r => r.target_id === objectId)
    .map(r => {
      const source = store.objects.find(o => o.id === r.source_id);
      return { ...r, id: source?.id, object_key: source?.object_key, title: source?.title, type: source?.type, status: source?.status };
    });

  res.json({
    root: rootObject,
    downstreamImpact: impactedDownstream,
    upstreamImpact: impactedUpstream
  });
});

router.post('/relationships', (req, res) => {
  const { source_id, target_id, relationship_type, created_by } = req.body;

  const newRel = {
    id: store.relationships.length + 1,
    source_id,
    target_id,
    relationship_type,
    created_by: created_by || 1,
    created_at: new Date().toISOString()
  };

  store.relationships.push(newRel);
  res.json({ success: true, id: newRel.id });
});

// --- TESTING MODULE ---
router.get('/tests/sets', (req, res) => {
  const testSets = store.objects
    .filter(o => o.type === 'TEST_SET')
    .map(o => {
      const caseCount = store.testSetItems.filter(tsi => tsi.test_set_id === o.id).length;
      return { ...o, case_count: caseCount };
    });
  res.json(testSets);
});

router.get('/tests/configs', (req, res) => {
  res.json(store.testConfigs);
});

router.get('/tests/runs', (req, res) => {
  const runs = store.testRuns.map(tr => {
    const tsObj = store.objects.find(o => o.id === tr.test_set_id);
    const tc = store.testConfigs.find(c => c.id === tr.test_config_id);
    const u = store.users.find(usr => usr.id === tr.executed_by);

    return {
      ...tr,
      test_set_key: tsObj?.object_key,
      test_set_title: tsObj?.title,
      config_name: tc?.name,
      software_version: tc?.software_version,
      firmware_version: tc?.firmware_version,
      hardware_revision: tc?.hardware_revision,
      tester_name: u?.name || 'Elena Rostova'
    };
  });

  res.json(runs);
});

router.get('/tests/runs/:id', (req, res) => {
  const runId = Number(req.params.id);
  const run = store.testRuns.find(tr => tr.id === runId);

  if (!run) return res.status(404).json({ error: 'Test run not found' });

  const tsObj = store.objects.find(o => o.id === run.test_set_id);
  const tc = store.testConfigs.find(c => c.id === run.test_config_id);
  const u = store.users.find(usr => usr.id === run.executed_by);

  const caseResults = store.testRunResults
    .filter(trr => trr.test_run_id === runId)
    .map(cr => {
      const tcObj = store.objects.find(o => o.id === cr.test_case_id);
      const steps = store.testStepResults
        .filter(tsr => tsr.test_run_result_id === cr.id)
        .map(tsr => {
          const stepDef = store.testSteps.find(ts => ts.id === tsr.test_step_id);
          return {
            ...tsr,
            step_number: stepDef?.step_number,
            action: stepDef?.action,
            expected_result: stepDef?.expected_result
          };
        });

      return {
        ...cr,
        case_key: tcObj?.object_key,
        case_title: tcObj?.title,
        priority: tcObj?.priority,
        steps
      };
    });

  res.json({
    ...run,
    test_set_key: tsObj?.object_key,
    test_set_title: tsObj?.title,
    config_name: tc?.name,
    software_version: tc?.software_version,
    firmware_version: tc?.firmware_version,
    hardware_revision: tc?.hardware_revision,
    tester_name: u?.name || 'Elena Rostova',
    caseResults
  });
});

router.put('/tests/runs/:runId/step-result', (req, res) => {
  const { test_step_result_id, status, actual_result, notes } = req.body;

  const stepRes = store.testStepResults.find(tsr => tsr.id === Number(test_step_result_id));
  if (stepRes) {
    stepRes.status = status;
    stepRes.actual_result = actual_result || '';
    stepRes.notes = notes || '';

    const caseRes = store.testRunResults.find(cr => cr.id === stepRes.test_run_result_id);
    if (caseRes) {
      const allSteps = store.testStepResults.filter(tsr => tsr.test_run_result_id === caseRes.id);
      if (allSteps.some(s => s.status === 'FAIL')) caseRes.status = 'FAIL';
      else if (allSteps.some(s => s.status === 'BLOCKED')) caseRes.status = 'BLOCKED';
      else if (allSteps.some(s => s.status === 'NOT_RUN')) caseRes.status = 'IN_PROGRESS';
      else caseRes.status = 'PASS';
    }
  }

  res.json({ success: true });
});

// --- CHANGE REQUESTS & BASELINES ---
router.get('/changes', (req, res) => {
  const changes = store.changeRequests.map(cr => {
    const author = store.users.find(u => u.id === cr.author_id);
    const itemCount = store.changeRequestItems.filter(cri => cri.change_request_id === cr.id).length;
    return { ...cr, author_name: author?.name || 'Alex Chen', item_count: itemCount };
  });
  res.json(changes);
});

router.get('/baselines', (req, res) => {
  const baselines = store.baselines.map(b => {
    const author = store.users.find(u => u.id === b.created_by);
    const itemCount = store.baselineItems.filter(bi => bi.baseline_id === b.id).length;
    return { ...b, author_name: author?.name || 'Alex Chen', item_count: itemCount };
  });
  res.json(baselines);
});

router.get('/baselines/:id', (req, res) => {
  const bId = Number(req.params.id);
  const baseline = store.baselines.find(b => b.id === bId);

  if (!baseline) return res.status(404).json({ error: 'Baseline not found' });

  const author = store.users.find(u => u.id === baseline.created_by);
  const items = store.baselineItems
    .filter(bi => bi.baseline_id === bId)
    .map(bi => {
      const obj = store.objects.find(o => o.id === bi.object_id);
      return {
        ...bi,
        object_key: obj?.object_key,
        title: obj?.title,
        type: obj?.type,
        status: obj?.status,
        snapshot_version: bi.object_version
      };
    });

  res.json({ ...baseline, author_name: author?.name || 'Alex Chen', items });
});

router.post('/baselines', (req, res) => {
  const { project_id, name, version_tag, description, created_by } = req.body;

  const newBaseline = {
    id: store.baselines.length + 1,
    project_id: project_id || 1,
    name,
    version_tag,
    description: description || '',
    created_by: created_by || 1,
    created_at: new Date().toISOString()
  };

  store.baselines.push(newBaseline);

  const pObjects = store.objects.filter(o => {
    const t = store.trackers.find(tr => tr.id === o.tracker_id);
    return t?.project_id === (project_id || 1);
  });

  for (const obj of pObjects) {
    store.baselineItems.push({
      id: store.baselineItems.length + 1,
      baseline_id: newBaseline.id,
      object_id: obj.id,
      object_version: obj.version
    });
  }

  res.json({ success: true, id: newBaseline.id });
});

// --- ARTIFACTS & AUDIT LOGS ---
router.get('/artifacts', (req, res) => {
  const result = store.artifacts.map(a => {
    const u = store.users.find(usr => usr.id === a.uploaded_by);
    const obj = store.objects.find(o => o.id === a.object_id);
    return { ...a, uploader_name: u?.name || 'Alex Chen', object_key: obj?.object_key, object_title: obj?.title };
  });
  res.json(result);
});

router.get('/audit', (req, res) => {
  res.json(store.auditLogs);
});

export default router;
