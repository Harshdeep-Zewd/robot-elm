// Pure TypeScript In-Memory & Ephemeral Relational Store for Serverless Environments
import { CANONICAL_TRACKERS, createProjectTrackers } from './canonicalTrackers';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Tracker {
  id: number;
  project_id: number;
  key: string;
  name: string;
  type: string;
  prefix: string;
  object_count?: number;
  category?: string;
  enable_test_steps?: boolean;
  enable_folders?: boolean;
  description?: string;
}

export interface Folder {
  id: number;
  tracker_id: number;
  parent_id: number | null;
  name: string;
  position: number;
}

export interface EngineeringObject {
  id: number;
  tracker_id: number;
  folder_id: number | null;
  object_key: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner_id: number;
  owner_name?: string;
  version: number;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

class MemoryStore {
  users: User[] = [];
  projects: Project[] = [];
  trackers: Tracker[] = [];
  folders: Folder[] = [];
  objects: EngineeringObject[] = [];
  objectVersions: any[] = [];
  testSteps: any[] = [];
  testSetItems: any[] = [];
  testConfigs: any[] = [];
  testRuns: any[] = [];
  testRunResults: any[] = [];
  testStepResults: any[] = [];
  relationships: any[] = [];
  changeRequests: any[] = [];
  changeRequestItems: any[] = [];
  baselines: any[] = [];
  baselineItems: any[] = [];
  artifacts: any[] = [];
  auditLogs: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    if (this.projects.length > 0) return;

    // 1. Users
    this.users = [
      { id: 1, email: 'alex.chen@roboserv.io', name: 'Alex Chen', role: 'SYSTEMS_ENGINEER' },
      { id: 2, email: 'sarah.jenkins@roboserv.io', name: 'Sarah Jenkins', role: 'SOFTWARE_ENGINEER' },
      { id: 3, email: 'marcus.vance@roboserv.io', name: 'Marcus Vance', role: 'HARDWARE_ENGINEER' },
      { id: 4, email: 'elena.rostova@roboserv.io', name: 'Elena Rostova', role: 'TESTER' }
    ];

    // 2. Default Projects
    this.projects = [
      {
        id: 1,
        key: 'ROBO',
        name: 'RoboServ-X1 Autonomous Delivery Robot',
        description: 'Full Systems Engineering Lifecycle Management for the next-gen autonomous indoor restaurant waiter & food delivery robot platform.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        key: 'AERO',
        name: 'AeroDrone-V2 Heavy Cargo Delivery',
        description: 'DO-178C Level A flight avionics and cargo delivery UAV platform.',
        created_at: new Date().toISOString()
      }
    ];

    // 3. Trackers (101 independent canonical trackers per project)
    const p1Trackers = [
      { id: 1, project_id: 1, key: 'SYS-REQ', name: 'System Requirement Specification', category: 'Requirements & Verification', type: 'REQUIREMENT', prefix: 'ROBO-SYS-REQ-' },
      { id: 2, project_id: 1, key: 'SW-REQ', name: 'SW Requirements Specification', category: 'Requirements & Verification', type: 'REQUIREMENT', prefix: 'ROBO-SW-REQ-' },
      { id: 3, project_id: 1, key: 'ARCH', name: 'System Architectural Design', category: 'Architecture & Hardware', type: 'ARCHITECTURE', prefix: 'ROBO-ARCH-' },
      { id: 4, project_id: 1, key: 'RISK', name: 'Risks SWRS', category: 'Safety & Risks', type: 'RISK', prefix: 'ROBO-RISK-' },
      { id: 5, project_id: 1, key: 'SYS-TST', name: 'Test Cases', category: 'Testing, Sets & Runs', type: 'TEST_CASE', prefix: 'ROBO-SYS-TST-' },
      { id: 6, project_id: 1, key: 'TST-SET', name: 'System Qualification Test Sets', category: 'Testing, Sets & Runs', type: 'TEST_SET', prefix: 'ROBO-TST-SET-' },
      ...CANONICAL_TRACKERS.slice(6).map((ct, idx) => ({
        id: 7 + idx,
        project_id: 1,
        key: ct.key,
        name: ct.name,
        category: ct.category,
        type: ct.type,
        prefix: `ROBO-${ct.prefix}`
      }))
    ];

    const p2Trackers = createProjectTrackers(2, 'AERO').map(t => ({
      id: t.id,
      project_id: t.project_id,
      key: t.key,
      name: t.name,
      category: t.category,
      type: t.type,
      prefix: t.prefix
    }));

    this.trackers = [...p1Trackers, ...p2Trackers];

    // 4. Folders
    this.folders = [
      { id: 1, tracker_id: 1, parent_id: null, name: 'Navigation & Perception', position: 1 },
      { id: 2, tracker_id: 1, parent_id: null, name: 'Safety & Emergency Stop', position: 2 },
      { id: 3, tracker_id: 1, parent_id: null, name: 'Payload & Thermal Containment', position: 3 }
    ];

    // 5. Engineering Objects
    this.objects = [
      {
        id: 1, tracker_id: 1, folder_id: 1, object_key: 'SYS-REQ-001',
        title: 'Obstacle Detection & Local Rerouting Latency',
        description: 'The autonomous navigation system shall detect dynamic obstacles within 3.0 meters and compute a local collision avoidance trajectory within < 50 milliseconds.',
        type: 'REQUIREMENT', status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, version: 1,
        metadata_json: JSON.stringify({ rationale: 'Prevent collision in high-density indoor dining environments.', source: 'ISO 13482 Standard', verificationMethod: 'Test' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 2, tracker_id: 1, folder_id: 2, object_key: 'SYS-REQ-002',
        title: 'Physical & Software Emergency Braking Distance',
        description: 'When an emergency stop signal is triggered, the robot shall come to a complete stop within 0.35 meters from a cruising speed of 1.5 m/s.',
        type: 'REQUIREMENT', status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, version: 1,
        metadata_json: JSON.stringify({ rationale: 'Guarantee patron safety when sudden obstacles step directly into path.', source: 'Safety Hazard Analysis SHA-2026-01', verificationMethod: 'Test' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 3, tracker_id: 1, folder_id: 3, object_key: 'SYS-REQ-003',
        title: 'Active Hot Food Bay Thermal Maintenance',
        description: 'The insulated payload compartment shall maintain hot soup and plated meals at a minimum internal temperature of 65°C for up to 25 minutes of transit.',
        type: 'REQUIREMENT', status: 'REVIEW', priority: 'MEDIUM', owner_id: 3, version: 1,
        metadata_json: JSON.stringify({ rationale: 'Ensure food quality and customer satisfaction during peak dining hours.', source: 'PRD §4.2', verificationMethod: 'Inspection' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 4, tracker_id: 2, folder_id: null, object_key: 'SW-REQ-001',
        title: 'ROS2 Nav2 DWB Dynamic Local Planner Configuration',
        description: 'The software stack shall integrate ROS2 Iron Nav2 DWB local planner tuned with 20Hz local costmap updates using Ouster 3D LiDAR point cloud scans.',
        type: 'REQUIREMENT', status: 'APPROVED', priority: 'HIGH', owner_id: 2, version: 1,
        metadata_json: JSON.stringify({ rationale: 'Real-time reactive navigation in tight restaurant table aisles.', source: 'Derived from SYS-REQ-001' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 5, tracker_id: 3, folder_id: null, object_key: 'ARCH-001',
        title: 'RoboServ-X1 Main Cyber-Physical System',
        description: 'Top-level system architecture encapsulating Mobility Base, Sensor Suite, Thermal Bay, Compute, and Power.',
        type: 'ARCHITECTURE', status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, version: 1,
        metadata_json: JSON.stringify({ archType: 'System', subsystems: ['Mobility', 'Sensors', 'Payload', 'Compute'] }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 6, tracker_id: 4, folder_id: null, object_key: 'RISK-001',
        title: 'Robot Collision with Fast-Moving Dining Room Patron',
        description: 'Hazard: Uncontrolled physical contact with customer in crowded dining area resulting in minor injury or food spill.',
        type: 'RISK', status: 'REVIEW', priority: 'CRITICAL', owner_id: 1, version: 1,
        metadata_json: JSON.stringify({ hazard: 'Kinetic collision at 1.5 m/s', severity: 5, exposure: 4, avoidance: 3, riskRating: 60, mitigation: 'SYS-REQ-001 & SYS-REQ-002' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 7, tracker_id: 5, folder_id: null, object_key: 'SYS-TST-001',
        title: 'Dynamic Pedestrian Avoidance & Latency Test',
        description: 'Verify that the robot detects a dynamic human target walking across its path at 1.0 m/s and computes a non-colliding path.',
        type: 'TEST_CASE', status: 'APPROVED', priority: 'CRITICAL', owner_id: 4, version: 1,
        metadata_json: JSON.stringify({ objective: 'Validate <50ms response time.', preconditions: 'Nav2 active in simulator.' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 8, tracker_id: 5, folder_id: null, object_key: 'SYS-TST-002',
        title: 'Emergency Stop Braking Distance Field Test',
        description: 'Perform hard emergency stop triggers at maximum operational velocity (1.5 m/s) and record stopping distance.',
        type: 'TEST_CASE', status: 'APPROVED', priority: 'CRITICAL', owner_id: 4, version: 1,
        metadata_json: JSON.stringify({ objective: 'Verify stopping distance <= 0.35m.', preconditions: 'Dry tile surface.' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      },
      {
        id: 9, tracker_id: 6, folder_id: null, object_key: 'TST-SET-001',
        title: 'Safety & ISO 13482 Validation Test Set',
        description: 'Comprehensive safety suite combining dynamic obstacle avoidance and e-stop braking tests.',
        type: 'TEST_SET', status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, version: 1,
        metadata_json: JSON.stringify({ targetRelease: 'Release 2.4' }),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }
    ];

    // 6. Test Steps
    this.testSteps = [
      { id: 1, test_case_id: 7, step_number: 1, action: 'Initialize ROS2 Nav2 stack.', expected_result: 'Nav2 status ACTIVE.' },
      { id: 2, test_case_id: 7, step_number: 2, action: 'Command robot to navigate pose at 1.2 m/s.', expected_result: 'Robot accelerates smoothly.' },
      { id: 3, test_case_id: 7, step_number: 3, action: 'Inject dynamic obstacle across path.', expected_result: 'Costmap updated; latency <50ms.' },
      { id: 4, test_case_id: 8, step_number: 1, action: 'Drive robot straight at steady 1.5 m/s.', expected_result: 'Target velocity 1.5 m/s confirmed.' },
      { id: 5, test_case_id: 8, step_number: 2, action: 'Trigger bumper impact bar at line X=5.0m.', expected_result: 'Brakes fire instantly.' },
      { id: 6, test_case_id: 8, step_number: 3, action: 'Measure resting position.', expected_result: 'Stopping distance <= 0.35m.' }
    ];

    // 7. Relationships
    this.relationships = [
      { id: 1, source_id: 6, target_id: 1, relationship_type: 'MITIGATED_BY', created_by: 1 },
      { id: 2, source_id: 6, target_id: 2, relationship_type: 'MITIGATED_BY', created_by: 1 },
      { id: 3, source_id: 1, target_id: 4, relationship_type: 'DERIVED_TO', created_by: 1 },
      { id: 4, source_id: 1, target_id: 7, relationship_type: 'VERIFIED_BY', created_by: 1 },
      { id: 5, source_id: 2, target_id: 8, relationship_type: 'VERIFIED_BY', created_by: 1 }
    ];

    // 8. Test Set Items
    this.testSetItems = [
      { id: 1, test_set_id: 9, test_case_id: 7, position: 1 },
      { id: 2, test_set_id: 9, test_case_id: 8, position: 2 }
    ];

    // 9. Test Configurations & Runs
    this.testConfigs = [
      {
        id: 1, project_id: 1, name: 'Nav Release v2.4.1 Config',
        software_version: 'v2.4.1-rc3 (ROS2 Iron)', firmware_version: 'FW-v1.2.8', hardware_revision: 'HW Rev 3.2 (Jetson AGX Orin)'
      }
    ];

    this.testRuns = [
      {
        id: 1, project_id: 1, test_set_id: 9, test_config_id: 1,
        name: 'Safety Validation Run #1', overall_status: 'PASS', executed_by: 4,
        started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
        notes: 'All safety tests executed cleanly.'
      }
    ];

    this.testRunResults = [
      { id: 1, test_run_id: 1, test_case_id: 7, status: 'PASS', notes: 'Obstacle detection latency 34ms average.' },
      { id: 2, test_run_id: 1, test_case_id: 8, status: 'PASS', notes: 'Measured stopping distance 0.284m.' }
    ];

    this.testStepResults = [
      { id: 1, test_run_result_id: 1, test_step_id: 1, status: 'PASS', actual_result: 'Nav2 ACTIVE in 1.2s' },
      { id: 2, test_run_result_id: 1, test_step_id: 2, status: 'PASS', actual_result: 'Robot accelerated to 1.2 m/s' },
      { id: 3, test_run_result_id: 1, test_step_id: 3, status: 'PASS', actual_result: 'Obstacle detected in 34ms' },
      { id: 4, test_run_result_id: 2, test_step_id: 4, status: 'PASS', actual_result: 'Reached 1.5 m/s' },
      { id: 5, test_run_result_id: 2, test_step_id: 5, status: 'PASS', actual_result: 'Bumper engaged at X=5.0m' },
      { id: 6, test_run_result_id: 2, test_step_id: 6, status: 'PASS', actual_result: 'Stopping distance 0.284m' }
    ];

    // 10. Change Requests & Baselines
    this.changeRequests = [
      { id: 1, project_id: 1, cr_key: 'CR-001', title: 'Increase Local Costmap Resolution', description: 'Re-tune Nav2 costmap resolution to 2cm.', status: 'REVIEW', priority: 'HIGH', author_id: 2 }
    ];

    this.baselines = [
      { id: 1, project_id: 1, name: 'Baseline V1.0 - Safety Freeze', version_tag: 'v1.0-safety', description: 'ISO 13482 audit snapshot', created_by: 1, created_at: new Date().toISOString() }
    ];

    this.baselineItems = [
      { id: 1, baseline_id: 1, object_id: 1, object_version: 1 },
      { id: 2, baseline_id: 1, object_id: 2, object_version: 1 },
      { id: 3, baseline_id: 1, object_id: 6, object_version: 1 }
    ];
  }
}

// Global Singleton Instance
export const store = new MemoryStore();
