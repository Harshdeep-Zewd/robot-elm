import { Project, Tracker, Folder, EngineeringObject, TestStep, Relationship, Artifact, User } from '../types/elm';
import { CANONICAL_TRACKERS, cleanTrackerName, createProjectTrackers } from './canonicalTrackers';

export const DEMO_USER: User = {
  id: 999,
  username: 'demo',
  email: 'demo@roboserv.io',
  name: 'Demo User (Sandbox)',
  password: 'demo',
  role: 'DEMO',
  engineering_role: 'SYSTEMS_ENGINEER',
  status: 'ACTIVE',
  assigned_project_ids: [100],
  created_at: new Date().toISOString()
};

export const DEMO_PROJECT: Project = {
  id: 100,
  key: 'DEMO',
  name: 'RoboServ-X1 Demo Sandbox',
  description: 'Interactive Systems Engineering Showcase. Contains an example requirement for each tracker. State automatically resets on page reload.'
};

/**
 * Generates an intelligent, realistic title for an example requirement in a given tracker.
 */
function getExampleTitle(trackerName: string, category: string, key: string): string {
  const clean = cleanTrackerName(trackerName);
  const lower = clean.toLowerCase();

  if (lower.includes('system requirement') || key === 'SYS-REQ') {
    return 'Autonomous Table Delivery Navigation & Corridor Clearance';
  }
  if (lower.includes('software requirement') || key === 'SW-REQ') {
    return 'Dynamic Obstacle Avoidance & DWB Local Planner Trajectory';
  }
  if (lower.includes('architecture') || key === 'ARCH') {
    return 'Dual-Channel Motor Drive & Safety Relay Hardware Decomposition';
  }
  if (lower.includes('risk') || key === 'RISK') {
    return 'Kinetic Collision Hazard & Tactile Bumper Emergency Shutdown';
  }
  if (lower.includes('test case') || key === 'SYS-TST') {
    return 'Dynamic Obstacle Deceleration & Safe Stopping Distance Verification';
  }
  if (lower.includes('test set') || key === 'TST-SET') {
    return 'ISO 13482 Section 5 Physical Contact Safety Qualification Suite';
  }
  if (lower.includes('internal requirement') || key === 'IRS') {
    return 'Internal Microcontroller CAN Bus & SPI Watchdog Latency Limit';
  }
  if (lower.includes('customer quality') || key === 'CQR') {
    return 'Tray Liquid Spill Containment & Anti-Slosh Acceleration Threshold';
  }
  if (lower.includes('telemetry') || key.includes('CUST')) {
    return 'Real-Time Food Compartment Temperature & Heat Sensor Telemetry';
  }
  if (lower.includes('battery') || lower.includes('power')) {
    return 'LiFePO4 Power Management & Over-Current Thermal Protection';
  }
  if (lower.includes('sensor') || lower.includes('lidar') || lower.includes('camera')) {
    return '3D Depth Camera & LiDAR Point Cloud Processing Frequency';
  }
  if (lower.includes('brake') || lower.includes('stopping') || lower.includes('e-stop')) {
    return 'Electromechanical Brake Actuation & Category 0 Stop Response Time';
  }
  if (lower.includes('defect') || lower.includes('bug') || lower.includes('issue') || category === 'Defects & Problems') {
    return `Mirror Reflection Odometry Divergence in ${clean}`;
  }
  if (category === 'Testing, Sets & Runs') {
    return `Qualification Verification Procedure for ${clean}`;
  }
  if (category === 'Safety & Risks') {
    return `Hazard Analysis & Risk Mitigation Strategy for ${clean}`;
  }
  if (category === 'Architecture & Hardware') {
    return `Subsystem Hardware Specification & Interface Definition for ${clean}`;
  }
  if (category === 'Tasks & Epics') {
    return `Engineering Implementation Sprint: ${clean}`;
  }
  if (category === 'Changes & Releases') {
    return `Engineering Change Notice (ECN) Baseline for ${clean}`;
  }
  if (category === 'Documents & Governance') {
    return `Compliance Governance & Quality Audit Dossier for ${clean}`;
  }

  return `Baseline Engineering Specification for ${clean}`;
}

/**
 * Generates an intelligent, realistic description for an example requirement in a given tracker.
 */
function getExampleDescription(trackerName: string, category: string, key: string): string {
  const clean = cleanTrackerName(trackerName);
  const lower = clean.toLowerCase();

  if (category === 'Safety & Risks' || lower.includes('risk') || lower.includes('safety')) {
    return `The system shall identify, evaluate, and mitigate potential hazards associated with ${clean} in strict compliance with ISO 13482:2014. In the event of a critical threshold breach, the safety controller shall trigger an immediate fail-safe state within <= 15 milliseconds.`;
  }

  if (category === 'Testing, Sets & Runs' || lower.includes('test')) {
    return `Verify that the ${clean} module meets all performance, functional, and safety tolerances under peak operational load. All test steps must execute sequentially with zero unresolved critical exceptions and 100% telemetry logging.`;
  }

  if (category === 'Defects & Problems' || lower.includes('defect')) {
    return `Identified deviation in ${clean} observed during edge-case field trials. Root cause analysis indicates intermittent timing divergence under extreme sensor noise. Corrective action plan requires firmware debouncing and parameter filtering.`;
  }

  if (category === 'Architecture & Hardware') {
    return `Architectural boundary specification defining the physical, electrical, and CAN-bus signal routing for the ${clean} subsystem. All components shall conform to industrial ingress protection (IP54) and operating temperature ranges from 0°C to 45°C.`;
  }

  if (category === 'Tasks & Epics') {
    return `Engineering development task allocated to implement, configure, and integrate the ${clean} functionality. Work includes unit test coverage (> 85%), automated regression testing, and code review approval by lead systems architect.`;
  }

  if (category === 'Changes & Releases') {
    return `Formal change management record tracking version increments, dependency upgrades, and regression test sign-offs for ${clean}. Approved for deployment in the current production release candidate.`;
  }

  if (category === 'Documents & Governance') {
    return `Controlled engineering document establishing governance protocols, standard operating procedures, and ISO quality management guidelines governing the ${clean} lifecycle.`;
  }

  return `The autonomous delivery robot shall implement and maintain the functional criteria defined under ${clean}. Sensor inputs, processing algorithms, and physical actuation must remain strictly within design tolerances under all normal restaurant operating conditions.`;
}

/**
 * Builds the complete tracker list for the demo project (all 101 canonical + 1 custom Group 9 tracker).
 */
export function buildDemoTrackers(): Tracker[] {
  const trackers = createProjectTrackers(DEMO_PROJECT.id, DEMO_PROJECT.key);

  // Add 1 specialized custom tracker to Group 9 (Custom Trackers)
  const customDemoTracker: Tracker = {
    id: DEMO_PROJECT.id * 1000 + 999,
    project_id: DEMO_PROJECT.id,
    key: 'CUST-DEMO',
    name: 'Custom Food Telemetry & Environmental Tracker',
    category: 'Custom Trackers',
    type: 'REQUIREMENT',
    prefix: 'DEMO-CUST-',
    object_count: 1,
    enable_test_steps: false,
    enable_folders: true,
    description: 'Demonstration of a user-defined custom engineering tracker in Group 9 for food delivery heat and humidity monitoring.'
  };

  return [...trackers, customDemoTracker];
}

/**
 * Builds folders for the demo project (1 primary folder per tracker).
 */
export function buildDemoFolders(trackers: Tracker[]): Folder[] {
  return trackers.map((t, idx) => ({
    id: t.id * 10 + 1,
    tracker_id: t.id,
    parent_id: null,
    name: `${cleanTrackerName(t.name).split(' ').slice(0, 2).join(' ')} Specifications`,
    position: 1
  }));
}

/**
 * Generates exactly ONE example requirement for EACH tracker in the demo project.
 */
export function buildDemoObjects(trackers: Tracker[], folders: Folder[]): EngineeringObject[] {
  const folderMap = new Map<number, Folder>();
  folders.forEach(f => folderMap.set(f.tracker_id, f));

  return trackers.map((t, idx) => {
    const folder = folderMap.get(t.id);
    const objectId = t.id * 10 + 1;
    const cleanName = cleanTrackerName(t.name);
    const title = getExampleTitle(t.name, t.category || '', t.key);
    const description = getExampleDescription(t.name, t.category || '', t.key);

    const isSafety = (t.category || '').includes('Safety') || cleanName.toLowerCase().includes('safety');
    const isTest = (t.category || '').includes('Testing') || (t.type || '').includes('TEST');

    return {
      id: objectId,
      tracker_id: t.id,
      tracker_name: cleanName,
      folder_id: folder ? folder.id : null,
      folder_name: folder ? folder.name : null,
      object_key: `${t.prefix || 'DEMO-' + t.key + '-'}001`,
      title,
      description,
      type: t.type || 'REQUIREMENT',
      requirement_type: isTest ? 'Non-Functional Requirement' : 'Functional Requirement',
      safety_level: isSafety ? 'ASIL-D' : 'SIL-2',
      test_subprocess: isTest ? 'System Testing' : 'Integration Testing',
      status: idx % 4 === 0 ? 'APPROVED' : idx % 4 === 1 ? 'IN_PROGRESS' : idx % 4 === 2 ? 'REVIEW' : 'APPROVED',
      priority: idx % 3 === 0 ? 'CRITICAL' : idx % 3 === 1 ? 'HIGH' : 'MEDIUM',
      owner_id: DEMO_USER.id,
      owner_name: 'Demo User',
      created_by_name: 'Demo User',
      pre_action: 'RoboServ-X1 system operational in restaurant environment with active LiDAR and power bus.',
      post_action: 'Subsystem criteria verified with zero diagnostic error flags.',
      version: 1,
      custom_columns: [
        {
          id: `col-demo-${objectId}-table`,
          name: 'Engineering Parameters & Verification Limits',
          type: 'TABLE',
          position_reference: 'DESCRIPTION',
          placement: 'BELOW',
          content: [
            { parameter: 'Operational Response Latency', value: '<= 25 ms', tolerance: '±2 ms' },
            { parameter: 'Sensor Sampling Frequency', value: '20 Hz', tolerance: 'Min 15 Hz' },
            { parameter: 'Safety Threshold Margin', value: '0.40 meters', tolerance: 'ISO 13482 Pass' }
          ]
        },
        {
          id: `col-demo-${objectId}-files`,
          name: 'Verification Evidence Dossier',
          type: 'FILES',
          position_reference: 'POST_ACTION',
          placement: 'BELOW',
          content: [
            { name: `${t.key}_Verification_Audit_Report.pdf`, size: '1.8 MB', date: '2026-10-21' }
          ]
        }
      ],
      revisions: [
        {
          version: 1,
          saved_at: new Date().toISOString(),
          saved_by: 'Demo User',
          title,
          description,
          pre_action: 'RoboServ-X1 system operational in restaurant environment.',
          post_action: 'Subsystem criteria verified.',
          status: 'APPROVED',
          safety_level: isSafety ? 'ASIL-D' : 'SIL-2',
          priority: 'HIGH',
          owner_name: 'Demo User',
          category: 'Functional Requirement',
          release: 'Demo Release 1.0',
          change_summary: `Initial example requirement baseline for ${cleanName}`
        }
      ],
      metadata: {
        rationale: `Showcase example requirement demonstrating full lifecycle management and traceability in ${cleanName}.`,
        author: 'Demo Systems Engineer',
        standard: 'ISO 13482:2014 & IEC 61508'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

/**
 * Builds test steps for test case trackers in the demo project.
 */
export function buildDemoTestSteps(objects: EngineeringObject[], trackers: Tracker[]): TestStep[] {
  const testTrackers = new Set(trackers.filter(t => t.enable_test_steps || t.type.includes('TEST')).map(t => t.id));
  const testObjects = objects.filter(o => testTrackers.has(o.tracker_id));

  let stepIdCounter = 1000;
  const steps: TestStep[] = [];

  testObjects.forEach(obj => {
    steps.push({
      id: stepIdCounter++,
      test_case_id: obj.id,
      step_number: 1,
      action: `Initialize calibration and diagnostic pre-flight check for ${obj.tracker_name}.`,
      expected_result: 'Diagnostic status register reports READY with zero active hardware faults within <= 100ms.'
    });
    steps.push({
      id: stepIdCounter++,
      test_case_id: obj.id,
      step_number: 2,
      action: `Inject operational dynamic load and record telemetry response for ${obj.object_key}.`,
      expected_result: 'All measured parameters remain strictly within specified tolerance band without emergency stop trip.'
    });
  });

  return steps;
}

/**
 * Builds sample artifacts for the demo project.
 */
export function buildDemoArtifacts(): Artifact[] {
  return [
    {
      id: 1001,
      project_id: DEMO_PROJECT.id,
      object_id: 1000011,
      object_key: 'DEMO-DOC-001',
      object_title: 'ISO 13482 Service Robot Safety Compliance Dossier',
      file_name: 'RoboServ_ISO13482_Compliance_Dossier.pdf',
      file_size: 3840000,
      mime_type: 'application/pdf',
      category: 'PDF',
      uploader_name: 'Demo User',
      created_at: new Date().toISOString()
    },
    {
      id: 1002,
      project_id: DEMO_PROJECT.id,
      object_id: 1000021,
      object_key: 'DEMO-CAD-001',
      object_title: 'Chassis & Payload Suspension 3D CAD Assembly',
      file_name: 'RoboServ_Chassis_Assembly_Rev4.step',
      file_size: 18500000,
      mime_type: 'application/octet-stream',
      category: 'CAD',
      uploader_name: 'Demo User',
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Builds sample traceability relationships for the demo project.
 */
export function buildDemoRelationships(objects: EngineeringObject[]): Relationship[] {
  const rels: Relationship[] = [];
  if (objects.length >= 6) {
    rels.push({ id: 1001, source_id: objects[0].id, target_id: objects[1].id, relationship_type: 'DERIVED_TO' });
    rels.push({ id: 1002, source_id: objects[0].id, target_id: objects[2].id, relationship_type: 'ALLOCATED_TO' });
    rels.push({ id: 1003, source_id: objects[0].id, target_id: objects[4].id, relationship_type: 'VERIFIED_BY' });
    rels.push({ id: 1004, source_id: objects[3].id, target_id: objects[0].id, relationship_type: 'MITIGATED_BY' });
  }

  // Link demo test cases to demo test set
  const demoTestSets = objects.filter(o =>
    o.type === 'TEST_SET' ||
    o.object_key.includes('SET') ||
    o.tracker_name.toLowerCase().includes('test set')
  );
  const demoTestCases = objects.filter(o =>
    o.type === 'TEST_CASE' ||
    o.object_key.includes('TST') ||
    o.object_key.includes('TC') ||
    o.tracker_name.toLowerCase().includes('test case')
  );

  if (demoTestSets.length > 0 && demoTestCases.length > 0) {
    const primarySet = demoTestSets[0];
    demoTestCases.slice(0, 3).forEach((tc, idx) => {
      rels.push({
        id: 2000 + idx,
        source_id: tc.id,
        target_id: primarySet.id,
        relationship_type: 'INCLUDED_IN'
      });
    });
  }

  return rels;
}
