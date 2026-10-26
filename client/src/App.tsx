import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, ViewMode } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TrackerTableView } from './components/TrackerTableView';
import { TraceabilityMatrixView } from './components/TraceabilityMatrixView';
import { ImpactAnalysisView } from './components/ImpactAnalysisView';
import { TestExecutionView } from './components/TestExecutionView';
import { RisksMatrixView } from './components/RisksMatrixView';
import { BaselinesView } from './components/BaselinesView';
import { ArtifactsView } from './components/ArtifactsView';
import { AuditView } from './components/AuditView';
import { LoginView } from './components/LoginView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { ProjectsPortalView } from './components/ProjectsPortalView';
import { Project, Tracker, EngineeringObject, Folder, RequirementType, SafetyLevel, TestSubProcess, Relationship, TestStep, Artifact, User, TestRun } from './types/elm';
import { authService } from './api/auth';
import { CANONICAL_TRACKERS, createProjectTrackers, cleanTrackerName, getTrackerCategory } from './data/canonicalTrackers';
import {
  DEMO_USER,
  DEMO_PROJECT,
  buildDemoTrackers,
  buildDemoFolders,
  buildDemoObjects,
  buildDemoTestSteps,
  buildDemoArtifacts,
  buildDemoRelationships
} from './data/demoData';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    key: 'ROBO',
    name: 'RoboServ-X1 Autonomous Delivery Robot',
    description: 'Systems Engineering Lifecycle Management & ISO 13482 Safety Compliance Workspace.'
  },
  {
    id: 2,
    key: 'AERO',
    name: 'AeroDrone-V2 Heavy Cargo Delivery',
    description: 'DO-178C Level A flight avionics and cargo delivery UAV platform.'
  }
];

function buildProject1Trackers(): Tracker[] {
  // Preserve initial 6 tracker IDs (1..6) for backward compatibility with initial objects
  const coreTrackers: Tracker[] = [
    { id: 1, project_id: 1, key: 'SYS-REQ', name: 'System Requirement Specification', category: 'Requirements & Verification', type: 'REQUIREMENT', prefix: 'ROBO-SYS-REQ-', object_count: 3, enable_test_steps: false, enable_folders: true, description: 'Master system functional and non-functional requirements governing the complete robot platform.' },
    { id: 2, project_id: 1, key: 'SW-REQ', name: 'SW Requirements Specification', category: 'Requirements & Verification', type: 'REQUIREMENT', prefix: 'ROBO-SW-REQ-', object_count: 1, enable_test_steps: false, enable_folders: true, description: 'Detailed software requirement specifications, dynamic obstacle avoidance logic, and DWB local planner specs.' },
    { id: 3, project_id: 1, key: 'ARCH', name: 'System Architectural Design', category: 'Architecture & Hardware', type: 'ARCHITECTURE', prefix: 'ROBO-ARCH-', object_count: 2, enable_test_steps: false, enable_folders: true, description: 'Physical, mechanical, and electrical decomposition into Mobility, Payload, Sensors, and Compute subsystems.' },
    { id: 4, project_id: 1, key: 'RISK', name: 'Risks SWRS', category: 'Safety & Risks', type: 'RISK', prefix: 'ROBO-RISK-', object_count: 2, enable_test_steps: false, enable_folders: true, description: 'Software safety risks, ASIL hazard ratings, kinetic collision hazards, and fail-safe mitigations.' },
    { id: 5, project_id: 1, key: 'SYS-TST', name: 'Test Cases', category: 'Testing, Sets & Runs', type: 'TEST_CASE', prefix: 'ROBO-SYS-TST-', object_count: 2, enable_test_steps: true, enable_folders: true, description: 'Universal test case library supporting step-by-step action sequences, expected outcomes, and parameters.' },
    { id: 6, project_id: 1, key: 'TST-SET', name: 'System Qualification Test Sets', category: 'Testing, Sets & Runs', type: 'TEST_SET', prefix: 'ROBO-TST-SET-', object_count: 1, enable_test_steps: false, enable_folders: true, description: 'System-level test suites mapped directly to ISO 13482 safety requirements and customer PRDs.' }
  ];

  // Map remaining 95 canonical trackers for project 1
  const remaining = CANONICAL_TRACKERS.slice(6).map((ct, idx) => ({
    id: 7 + idx,
    project_id: 1,
    key: ct.key,
    name: cleanTrackerName(ct.name),
    category: ct.category,
    type: ct.type,
    prefix: `ROBO-${ct.prefix}`,
    object_count: 0,
    enable_test_steps: ct.enable_test_steps || false,
    enable_folders: true,
    description: ct.desc
  }));

  return [...coreTrackers, ...remaining];
}

const INITIAL_TRACKERS: Tracker[] = [
  ...buildProject1Trackers(),
  ...createProjectTrackers(2, 'AERO')
];

const INITIAL_FOLDERS: Folder[] = [
  { id: 1, tracker_id: 1, parent_id: null, name: 'Navigation & Perception', position: 1 },
  { id: 2, tracker_id: 1, parent_id: null, name: 'Safety & Emergency Stop', position: 2 },
  { id: 3, tracker_id: 1, parent_id: null, name: 'Payload & Thermal Containment', position: 3 },
  { id: 4, tracker_id: 2, parent_id: null, name: 'ROS2 Navigation Stack', position: 1 },
  { id: 5, tracker_id: 2, parent_id: null, name: 'Sensor Processing Pipeline', position: 2 },
  { id: 6, tracker_id: 3, parent_id: null, name: 'Cyber-Physical Base Architecture', position: 1 },
  { id: 7, tracker_id: 4, parent_id: null, name: 'Kinetic & Motion Hazards', position: 1 },
  { id: 8, tracker_id: 5, parent_id: null, name: 'Obstacle Avoidance Test Suite', position: 1 },
  { id: 9, tracker_id: 5, parent_id: null, name: 'Braking & E-Stop Field Tests', position: 2 },
  { id: 10, tracker_id: 6, parent_id: null, name: 'ISO 13482 Release 2.4 Qualification', position: 1 }
];

const INITIAL_OBJECTS: EngineeringObject[] = [
  {
    id: 1, tracker_id: 1, tracker_name: 'System Requirements', folder_id: 1, folder_name: 'Navigation & Perception', object_key: 'SYS-REQ-001',
    title: 'Obstacle Detection & Local Rerouting Latency',
    description: 'The autonomous navigation system shall detect dynamic obstacles within 3.0 meters and compute a local collision avoidance trajectory within < 50 milliseconds.',
    type: 'REQUIREMENT', requirement_type: 'Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'System Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Robot navigation stack active in autonomous delivery mode with LiDAR costmap streaming at 20Hz.',
    post_action: 'Dynamic avoidance trajectory safely clears obstacle with min 0.5m clearance and resumes mission trajectory.',
    version: 3,
    custom_columns: [
      {
        id: 'col-sys-001-table',
        name: 'Subsystem Latency & Parameter Spec',
        type: 'TABLE',
        position_reference: 'DESCRIPTION',
        placement: 'BELOW',
        content: [
          { parameter: 'Perception LiDAR Processing Pipeline', value: '< 25 ms', tolerance: '±2 ms Max' },
          { parameter: 'DWB Dynamic Local Path Solver', value: '< 15 ms', tolerance: 'Limit 20 ms' },
          { parameter: 'CAN Bus Motor Brake Actuation', value: '< 8 ms', tolerance: 'ASIL-D Loop' }
        ]
      },
      {
        id: 'col-sys-001-files',
        name: 'Attached Verification Reports & Logs',
        type: 'FILES',
        position_reference: 'POST_ACTION',
        placement: 'BELOW',
        content: [
          { name: 'ISO_13482_Compliance_Audit_Report.pdf', size: '2.4 MB', date: '2026-10-15' },
          { name: 'LiDAR_Costmap_Benchmark_Results.csv', size: '840 KB', date: '2026-10-16' }
        ]
      }
    ],
    revisions: [
      {
        version: 1,
        saved_at: '2026-03-10T10:00:00.000Z',
        saved_by: 'Zewd',
        title: 'Obstacle Detection & Local Rerouting Latency [Initial PRD Draft]',
        description: 'Initial draft: Robot shall detect obstacles within 2.0 meters and compute avoidance trajectory within 100 milliseconds.',
        pre_action: 'Robot navigation stack active in autonomous delivery mode.',
        post_action: 'Avoid obstacle and continue mission trajectory.',
        status: 'DRAFT',
        safety_level: 'SIL-2',
        priority: 'HIGH',
        owner_name: 'Zewd',
        category: 'Functional Requirement',
        release: 'Release 1.0',
        change_summary: 'Initial PRD draft specification baseline'
      },
      {
        version: 2,
        saved_at: '2026-06-15T14:30:00.000Z',
        saved_by: 'Zewd',
        title: 'Obstacle Detection & Local Rerouting Latency [ASIL-D Safety Upgrade]',
        description: 'The autonomous navigation system shall detect dynamic obstacles within 2.5 meters and compute a local collision avoidance trajectory within < 75 milliseconds.',
        pre_action: 'Robot navigation stack active in autonomous delivery mode with LiDAR costmap streaming at 15Hz.',
        post_action: 'Dynamic avoidance trajectory safely clears obstacle with min 0.4m clearance.',
        status: 'REVIEW',
        safety_level: 'ASIL-C',
        priority: 'CRITICAL',
        owner_name: 'Zewd',
        category: 'Functional Requirement',
        release: 'Release 2.0',
        change_summary: 'Tighter latency margin and ASIL-C qualification upgrade'
      }
    ],
    metadata: { rationale: 'Prevent collision in high-density dining room environments.', source: 'ISO 13482 Standard', verificationMethod: 'Test' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 2, tracker_id: 1, tracker_name: 'System Requirements', folder_id: 2, folder_name: 'Safety & Emergency Stop', object_key: 'SYS-REQ-002',
    title: 'Physical & Software Emergency Braking Distance',
    description: 'When an emergency stop signal is triggered, the robot shall come to a complete stop within 0.35 meters from a cruising speed of 1.5 m/s.',
    type: 'REQUIREMENT', requirement_type: 'Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'HIL Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Robot moving at cruising speed 1.5 m/s on dry floor with wireless e-stop safety loop verified closed.',
    post_action: 'Power relay opens instantly, mechanical brakes engage, stopping distance strictly <= 0.35m, robot enters safe IDLE state.',
    version: 2,
    custom_columns: [
      {
        id: 'col-sys-002-link',
        name: 'CAD / Kinematics Assembly Reference',
        type: 'LINK',
        position_reference: 'PRE_ACTION',
        placement: 'BELOW',
        content: {
          title: 'RoboServ-X1 E-Stop & Braking Kinematics (Onshape CAD)',
          url: 'https://cad.onshape.com/documents/roboserv-x1-estop'
        }
      }
    ],
    revisions: [
      {
        version: 1,
        saved_at: '2026-04-01T09:15:00.000Z',
        saved_by: 'Zewd',
        title: 'Physical & Software Emergency Braking Distance [Initial Inception]',
        description: 'When an emergency stop signal is triggered, the robot shall come to a complete stop within 0.50 meters from a cruising speed of 1.5 m/s.',
        pre_action: 'Robot moving at cruising speed 1.5 m/s with e-stop loop closed.',
        post_action: 'Brakes engage, stopping distance <= 0.50m.',
        status: 'REVIEW',
        safety_level: 'ASIL-C',
        priority: 'CRITICAL',
        owner_name: 'Zewd',
        category: 'Functional Requirement',
        release: 'Release 1.0',
        change_summary: 'Initial braking distance requirement (0.50m limit)'
      }
    ],
    metadata: { rationale: 'Guarantee patron safety when sudden obstacles step directly into path.', source: 'Safety Hazard Analysis SHA-2026-01', verificationMethod: 'Test' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 3, tracker_id: 1, tracker_name: 'System Requirements', folder_id: 3, folder_name: 'Payload & Thermal Containment', object_key: 'SYS-REQ-003',
    title: 'Active Hot Food Bay Thermal Maintenance',
    description: 'The insulated payload compartment shall maintain hot soup and plated meals at a minimum internal temperature of 65°C for up to 25 minutes of transit.',
    type: 'REQUIREMENT', requirement_type: 'Non-Functional Requirement', safety_level: 'Standard / Non-Safety', test_subprocess: 'Black-Box Testing',
    status: 'REVIEW', priority: 'MEDIUM', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Thermal heating elements preheated to 70°C, seal door closed, temperature sensor polling at 1Hz.',
    post_action: 'Transit concluded within 25 min; verify food core temp >= 65°C and emit delivery confirmation to server.',
    version: 1,
    metadata: { rationale: 'Ensure food quality and customer satisfaction during peak dining hours.', source: 'PRD §4.2', verificationMethod: 'Inspection' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 4, tracker_id: 2, tracker_name: 'Software Requirements', folder_id: 4, folder_name: 'ROS2 Navigation Stack', object_key: 'SW-REQ-001',
    title: 'ROS2 Nav2 DWB Dynamic Local Planner Configuration',
    description: 'The software stack shall integrate ROS2 Iron Nav2 DWB local planner tuned with 20Hz local costmap updates using Ouster 3D LiDAR point cloud scans.',
    type: 'REQUIREMENT', requirement_type: 'Parameter', safety_level: 'ASIL-C', test_subprocess: 'SW Testing',
    status: 'APPROVED', priority: 'HIGH', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'ROS2 Iron daemon running, Nav2 navigation stack initialized with costmap filter plugins loaded.',
    post_action: 'DWB local controller produces collision-free cmd_vel twists at 20Hz without oscillation.',
    version: 1,
    metadata: { rationale: 'Real-time reactive navigation in tight restaurant table aisles.', source: 'Derived from SYS-REQ-001' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 5, tracker_id: 3, tracker_name: 'System Architecture', folder_id: 6, folder_name: 'Cyber-Physical Base Architecture', object_key: 'ARCH-001',
    title: 'RoboServ-X1 Main Cyber-Physical System',
    description: 'Top-level system architecture encapsulating Mobility Base, Sensor Suite, Thermal Bay, Compute, and Power.',
    type: 'ARCHITECTURE', requirement_type: 'Folder', safety_level: 'ASIL-D', test_subprocess: 'Integration Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'System main DC bus powered at 48V, CAN bus 2.0B topology initialized across all motor controllers.',
    post_action: 'All subsystems reporting healthy heartbeat over ROS2 DDS middleware with zero fault codes.',
    version: 1,
    metadata: { archType: 'System', subsystems: ['Mobility', 'Sensors', 'Payload', 'Compute'] },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 6, tracker_id: 4, tracker_name: 'Risks & Hazards', folder_id: 7, folder_name: 'Kinetic & Motion Hazards', object_key: 'RISK-001',
    title: 'Robot Collision with Fast-Moving Dining Room Patron',
    description: 'Hazard: Uncontrolled physical contact with customer in crowded dining area resulting in minor injury or food spill.',
    type: 'RISK', requirement_type: 'Non-Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'Field Testing',
    status: 'REVIEW', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Robot navigating during crowded dinner rush hours (18:00 - 21:00) with patrons moving unpredictably.',
    post_action: 'Speed clamped to < 1.0 m/s in narrow aisles; optical warning chime active to notify nearby persons.',
    version: 1,
    metadata: { hazard: 'Kinetic collision at 1.5 m/s', severity: 5, exposure: 4, avoidance: 3, riskRating: 60, mitigation: 'SYS-REQ-001 & SYS-REQ-002' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 7, tracker_id: 5, tracker_name: 'System Test Cases', folder_id: 8, folder_name: 'Obstacle Avoidance Test Suite', object_key: 'SYS-TST-001',
    title: 'Dynamic Pedestrian Avoidance & Latency Test',
    description: 'Verify that the robot detects a dynamic human target walking across its path at 1.0 m/s and computes a non-colliding path.',
    type: 'TEST_CASE', requirement_type: 'Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'System Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Test track clear, mannequin obstacle rigged to motorized cable pulling system with optical tripwire active.',
    post_action: 'Record trajectory in rosbag; confirm evasion begins within 50ms of tripwire breach.',
    version: 1,
    metadata: { objective: 'Validate <50ms response time.', preconditions: 'Nav2 active in simulator.' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 8, tracker_id: 5, tracker_name: 'System Test Cases', folder_id: 9, folder_name: 'Braking & E-Stop Field Tests', object_key: 'SYS-TST-002',
    title: 'Emergency Stop Braking Distance Field Test',
    description: 'Perform hard emergency stop triggers at maximum operational velocity (1.5 m/s) and record stopping distance.',
    type: 'TEST_CASE', requirement_type: 'Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'HIL Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'Ground tracking optical sensor calibrated on dry tile floor; robot battery > 80% with wireless e-stop receiver paired.',
    post_action: 'Laser distance meter measures point of trigger to wheel rest position; record stopping distance in test log.',
    version: 1,
    metadata: { objective: 'Verify stopping distance <= 0.35m.', preconditions: 'Dry tile surface.' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 9, tracker_id: 6, tracker_name: 'Test Sets', folder_id: 10, folder_name: 'ISO 13482 Release 2.4 Qualification', object_key: 'TST-SET-001',
    title: 'Safety & ISO 13482 Validation Test Set',
    description: 'Comprehensive safety suite combining dynamic obstacle avoidance and e-stop braking tests.',
    type: 'TEST_SET', requirement_type: 'Functional Requirement', safety_level: 'ASIL-D', test_subprocess: 'System Testing',
    status: 'APPROVED', priority: 'CRITICAL', owner_id: 1, owner_name: 'Zewd', created_by_name: 'Zewd',
    pre_action: 'RoboServ-X1 hardware revision Rev 1 loaded with release candidate firmware v1.0.0-rc1 in certified test pen.',
    post_action: 'Generate ISO 13482 compliance verification certificate with all test run step outcomes.',
    version: 1,
    metadata: { targetRelease: 'Release 2.4' },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }
];

const INITIAL_RELATIONSHIPS: Relationship[] = [
  { id: 1, source_id: 6, target_id: 1, relationship_type: 'MITIGATED_BY' },
  { id: 2, source_id: 1, target_id: 4, relationship_type: 'DERIVED_TO' },
  { id: 3, source_id: 1, target_id: 7, relationship_type: 'VERIFIED_BY' },
  { id: 4, source_id: 2, target_id: 8, relationship_type: 'VERIFIED_BY' },
  { id: 5, source_id: 1, target_id: 5, relationship_type: 'ALLOCATED_TO' },
  { id: 6, source_id: 7, target_id: 9, relationship_type: 'INCLUDED_IN' },
  { id: 7, source_id: 8, target_id: 9, relationship_type: 'INCLUDED_IN' }
];

const INITIAL_TEST_STEPS: TestStep[] = [
  {
    id: 1, test_case_id: 7, step_number: 1,
    action: 'Initialize ROS2 Iron Nav2 stack and load 3D LiDAR point cloud costmap in restaurant dining room environment.',
    expected_result: 'Costmap initializes cleanly with zero collision flags and steady 20Hz update rate.'
  },
  {
    id: 2, test_case_id: 7, step_number: 2,
    action: 'Trigger dynamic pedestrian obstacle walking across robot path at 1.0 m/s velocity at a 2.5 meter range.',
    expected_result: 'Local DWB trajectory planner computes collision-free evasion path within < 50 milliseconds.'
  },
  {
    id: 3, test_case_id: 7, step_number: 3,
    action: 'Monitor robot velocity and trajectory during local bypass maneuver.',
    expected_result: 'Robot maintains smooth velocity profile (> 0.5 m/s) without erratic oscillation or emergency brake locking.'
  },
  {
    id: 4, test_case_id: 8, step_number: 1,
    action: 'Accelerate RoboServ-X1 robot base to maximum cruising speed of 1.5 m/s on dry tile flooring.',
    expected_result: 'Base wheel encoders confirm steady 1.5 m/s cruising velocity.'
  },
  {
    id: 5, test_case_id: 8, step_number: 2,
    action: 'Trigger emergency stop hardware break signal via wireless e-stop safety button.',
    expected_result: 'Power relay opens instantly, killing motor drive power and engaging electromechanical brakes.'
  },
  {
    id: 6, test_case_id: 8, step_number: 3,
    action: 'Measure total physical stopping distance from brake trigger location using optical ground tracking sensor.',
    expected_result: 'Total measured stopping distance is strictly <= 0.35 meters.'
  }
];

const INITIAL_ARTIFACTS: Artifact[] = [
  {
    id: 1, project_id: 1, object_id: 5, object_key: 'ARCH-001', object_title: 'RoboServ-X1 Main Cyber-Physical System',
    filename: 'RoboServ_X1_CyberPhysical_Architecture_v2.pdf', stored_path: '/artifacts/RoboServ_X1_CyberPhysical_Architecture_v2.pdf',
    file_size: 4200100, mime_type: 'application/pdf', category: 'PDF', uploader_name: 'Zewd', created_at: new Date().toISOString()
  },
  {
    id: 2, project_id: 1, object_id: 5, object_key: 'ARCH-001', object_title: 'RoboServ-X1 Main Cyber-Physical System',
    filename: 'Mobility_Base_CAD_Assembly_v1.step', stored_path: '/artifacts/Mobility_Base_CAD_Assembly_v1.step',
    file_size: 14500100, mime_type: 'application/octet-stream', category: 'CAD', uploader_name: 'Zewd', created_at: new Date().toISOString()
  },
  {
    id: 3, project_id: 1, object_id: 5, object_key: 'ARCH-001', object_title: 'RoboServ-X1 Main Cyber-Physical System',
    filename: 'Power_Budget_and_Thermal_Calculations.xlsx', stored_path: '/artifacts/Power_Budget_and_Thermal_Calculations.xlsx',
    file_size: 850200, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'CSV', uploader_name: 'Zewd', created_at: new Date().toISOString()
  },
  {
    id: 4, project_id: 1, object_id: 5, object_key: 'ARCH-001', object_title: 'RoboServ-X1 Main Cyber-Physical System',
    filename: 'ISO_13482_Safety_Architecture_Spec.docx', stored_path: '/artifacts/ISO_13482_Safety_Architecture_Spec.docx',
    file_size: 1250100, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'OTHER', uploader_name: 'Zewd', created_at: new Date().toISOString()
  }
];

const INITIAL_TEST_RUNS: TestRun[] = [
  {
    id: 1,
    project_id: 1,
    test_set_id: 9,
    test_config_id: 1,
    name: 'Safety & ISO 13482 Validation Run #1',
    overall_status: 'PASS',
    tester_name: 'Zewd',
    test_set_key: 'TST-SET-001',
    test_set_title: 'Safety & ISO 13482 Validation Test Set',
    config_name: 'RoboServ-X1 Main Hardware Configuration',
    software_version: 'v2.4.0-release',
    started_at: new Date().toISOString()
  }
];

const INITIAL_TEST_RUN_DETAILS: Record<number, any> = {
  1: {
    id: 1,
    name: 'Safety & ISO 13482 Validation Run #1',
    test_set_key: 'TST-SET-001',
    test_set_title: 'Safety & ISO 13482 Validation Test Set',
    config_name: 'RoboServ-X1 Main Hardware Configuration',
    software_version: 'v2.4.0-release',
    tester_name: 'Zewd',
    overall_status: 'PASS',
    caseResults: [
      {
        id: 107,
        test_run_id: 1,
        test_case_id: 7,
        case_key: 'SYS-TST-001',
        case_title: 'Dynamic Pedestrian Avoidance & Latency Test',
        status: 'PASS',
        steps: [
          {
            id: 101,
            test_run_result_id: 107,
            test_step_id: 1,
            step_number: 1,
            action: 'Initialize ROS2 Iron Nav2 stack and load 3D LiDAR point cloud costmap in restaurant dining room environment.',
            expected_result: 'Costmap initializes cleanly with zero collision flags and steady 20Hz update rate.',
            status: 'PASS',
            actual_result: 'Costmap initialized cleanly at 20Hz. Zero initial collision flags detected.'
          },
          {
            id: 102,
            test_run_result_id: 107,
            test_step_id: 2,
            step_number: 2,
            action: 'Trigger dynamic pedestrian obstacle walking across robot path at 1.0 m/s velocity at a 2.5 meter range.',
            expected_result: 'Local DWB trajectory planner computes collision-free evasion path within < 50 milliseconds.',
            status: 'PASS',
            actual_result: 'Local DWB trajectory planner calculated evasion path in 38ms (< 50ms requirement).'
          },
          {
            id: 103,
            test_run_result_id: 107,
            test_step_id: 3,
            step_number: 3,
            action: 'Monitor robot velocity and trajectory during local bypass maneuver.',
            expected_result: 'Robot maintains smooth velocity profile (> 0.5 m/s) without erratic oscillation or emergency brake locking.',
            status: 'PASS',
            actual_result: 'Bypass maneuver maintained steady velocity profile of 0.85 m/s without oscillation.'
          }
        ]
      },
      {
        id: 108,
        test_run_id: 1,
        test_case_id: 8,
        case_key: 'SYS-TST-002',
        case_title: 'Emergency Stop Braking Distance Field Test',
        status: 'PASS',
        steps: [
          {
            id: 104,
            test_run_result_id: 108,
            test_step_id: 4,
            step_number: 1,
            action: 'Accelerate RoboServ-X1 robot base to maximum cruising speed of 1.5 m/s on dry tile flooring.',
            expected_result: 'Base wheel encoders confirm steady 1.5 m/s cruising velocity.',
            status: 'PASS',
            actual_result: 'Base encoders confirmed steady 1.50 m/s velocity on test track.'
          },
          {
            id: 105,
            test_run_result_id: 108,
            test_step_id: 5,
            step_number: 2,
            action: 'Trigger emergency stop hardware break signal via wireless e-stop safety button.',
            expected_result: 'Power relay opens instantly, killing motor drive power and engaging electromechanical brakes.',
            status: 'PASS',
            actual_result: 'E-stop relay opened in < 2ms, electromechanical brakes engaged.'
          },
          {
            id: 106,
            test_run_result_id: 108,
            test_step_id: 6,
            step_number: 3,
            action: 'Measure total physical stopping distance from brake trigger location using optical ground tracking sensor.',
            expected_result: 'Total measured stopping distance is strictly <= 0.35 meters.',
            status: 'PASS',
            actual_result: 'Measured stopping distance was 0.28 meters (passed <= 0.35m threshold).'
          }
        ]
      }
    ]
  }
};


const ZEWD_USER: User = {
  id: 1,
  username: 'zewd',
  email: 'zewd@roboserv.io',
  name: 'Zewd (Owner)',
  password: 'zew_D003',
  role: 'ADMIN_OWNER',
  engineering_role: 'ADMIN',
  status: 'ACTIVE',
  assigned_project_ids: [1],
  created_at: new Date().toISOString()
};

const getInitialData = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`roboserv_elm_${key}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load storage for key:', key, e);
  }
  return defaultValue;
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const acc = params.get('account')?.toLowerCase();
      if (acc === 'demo') {
        return DEMO_USER;
      }
      // Check stored session across tabs
      const raw = sessionStorage.getItem('roboserv_auth_current_user') || localStorage.getItem('roboserv_auth_current_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.username) {
          if (u.username === 'zewd') {
            u.password = 'zew_D003';
          }
          return u;
        }
      }
    } catch (e) {}
    return null;
  });

  const isDemo = currentUser?.username === 'demo';

  const [initialDemoBundle] = useState(() => {
    const demoTrackers = buildDemoTrackers();
    const demoFolders = buildDemoFolders(demoTrackers);
    const demoObjects = buildDemoObjects(demoTrackers, demoFolders);
    const demoTestSteps = buildDemoTestSteps(demoObjects, demoTrackers);
    const demoArtifacts = buildDemoArtifacts();
    const demoRelationships = buildDemoRelationships(demoObjects);
    return {
      demoTrackers,
      demoFolders,
      demoObjects,
      demoTestSteps,
      demoArtifacts,
      demoRelationships
    };
  });

  const [adminMode, setAdminMode] = useState<'CONSOLE' | 'INSPECT'>('INSPECT');

  const [currentScreen, setCurrentScreen] = useState<'PROJECTS_PORTAL' | 'WORKSPACE'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('project') || params.get('tracker') || params.get('object') || params.get('view')) return 'WORKSPACE';
    } catch (e) {}
    return 'PROJECTS_PORTAL';
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    if (isDemo) return [DEMO_PROJECT];
    return getInitialData('projects', INITIAL_PROJECTS);
  });
  
  const [activeProjectId, setActiveProjectId] = useState<number>(() => {
    if (isDemo) return DEMO_PROJECT.id;
    const loadedProjects = getInitialData<Project[]>('projects', INITIAL_PROJECTS);
    try {
      const params = new URLSearchParams(window.location.search);
      const projParam = params.get('project');
      if (projParam) {
        const found = loadedProjects.find(p => p.key.toLowerCase() === projParam.toLowerCase() || String(p.id) === projParam);
        if (found) return found.id;
      }
      const objParam = params.get('object');
      if (objParam) {
        const loadedObjects = getInitialData<EngineeringObject[]>('objects', INITIAL_OBJECTS);
        const obj = loadedObjects.find(o => String(o.id) === objParam || o.object_key.toLowerCase() === objParam.toLowerCase());
        if (obj) {
          const loadedTrackers = getInitialData<Tracker[]>('trackers', INITIAL_TRACKERS);
          const trk = loadedTrackers.find(t => t.id === obj.tracker_id);
          if (trk) {
            const foundProj = loadedProjects.find(p => p.id === trk.project_id);
            if (foundProj) return foundProj.id;
          }
        }
      }
      const trkParam = params.get('tracker');
      if (trkParam) {
        const loadedTrackers = getInitialData<Tracker[]>('trackers', INITIAL_TRACKERS);
        const trk = loadedTrackers.find(t => String(t.id) === trkParam || t.key.toLowerCase() === trkParam.toLowerCase());
        if (trk) {
          const foundProj = loadedProjects.find(p => p.id === trk.project_id);
          if (foundProj) return foundProj.id;
        }
      }
    } catch (e) {}
    const savedId = getInitialData<number | null>('active_project_id', null);
    if (savedId && loadedProjects.some(p => p.id === savedId)) {
      return savedId;
    }
    return loadedProjects[0]?.id || INITIAL_PROJECTS[0].id;
  });

  const [allTrackers, setAllTrackers] = useState<Tracker[]>(() => {
    if (isDemo) return initialDemoBundle.demoTrackers;
    const rawTrackers = getInitialData<Tracker[]>('trackers', INITIAL_TRACKERS);
    const loadedProjects = getInitialData<Project[]>('projects', INITIAL_PROJECTS);

    const isRemoved = (t: { key?: string; name?: string }) => {
      const k = (t.key || '').toUpperCase();
      const n = (t.name || '').toLowerCase();
      return (
        k === 'STS_RR4X' ||
        k === 'QAD_XNF' ||
        k === 'RRT' ||
        n.includes('system test strategy rr4x') ||
        n.includes('qad tasks (xnf)') ||
        n.includes('rr tasks')
      );
    };

    // Sanitize any existing stored trackers to remove deleted trackers, strip serial numbers, and assign canonical category
    const sanitized: Tracker[] = rawTrackers
      .filter(t => !isRemoved(t))
      .map(t => ({
        ...t,
        name: cleanTrackerName(t.name),
        category: getTrackerCategory(t)
      }));

    // Ensure every project has all independent trackers
    const merged = [...sanitized].filter(t => !isRemoved(t));
    for (const proj of loadedProjects) {
      const projTrackers = merged.filter(t => t.project_id === proj.id);
      if (projTrackers.length < CANONICAL_TRACKERS.length) {
        const canonicalForProj = proj.id === 1 ? buildProject1Trackers() : createProjectTrackers(proj.id, proj.key);
        for (const ct of canonicalForProj) {
          const cleanName = cleanTrackerName(ct.name);
          const alreadyExists = projTrackers.some(
            t => t.id === ct.id ||
                 t.key.toLowerCase() === ct.key.toLowerCase() ||
                 cleanTrackerName(t.name).toLowerCase() === cleanName.toLowerCase()
          );
          if (!alreadyExists) {
            merged.push({
              ...ct,
              name: cleanName,
              category: getTrackerCategory(ct)
            });
          }
        }
      }
    }
    return merged;
  });
  
  const [selectedTrackerId, setSelectedTrackerId] = useState<number | null>(() => {
    const loadedTrackers = isDemo ? initialDemoBundle.demoTrackers : getInitialData<Tracker[]>('trackers', INITIAL_TRACKERS);
    try {
      const params = new URLSearchParams(window.location.search);
      const objParam = params.get('object');
      if (objParam) {
        const loadedObjects = isDemo ? initialDemoBundle.demoObjects : getInitialData<EngineeringObject[]>('objects', INITIAL_OBJECTS);
        const foundObj = loadedObjects.find(o => String(o.id) === objParam || o.object_key.toLowerCase() === objParam.toLowerCase());
        if (foundObj) {
          return foundObj.tracker_id;
        }
      }
      const trkParam = params.get('tracker');
      if (trkParam) {
        const foundTrk = loadedTrackers.find(t =>
          String(t.id) === trkParam ||
          t.key.toLowerCase() === trkParam.toLowerCase() ||
          t.prefix.toLowerCase() === trkParam.toLowerCase() ||
          cleanTrackerName(t.name).toLowerCase() === trkParam.toLowerCase()
        );
        if (foundTrk) return foundTrk.id;
      }
    } catch (e) {}
    if (isDemo) return initialDemoBundle.demoTrackers[0]?.id || null;
    const savedId = getInitialData<number | null>('selected_tracker_id', null);
    if (savedId && loadedTrackers.some(t => t.id === savedId)) {
      return savedId;
    }
    return loadedTrackers[0]?.id || INITIAL_TRACKERS[0].id;
  });

  const [allFolders, setAllFolders] = useState<Folder[]>(() => {
    if (isDemo) return initialDemoBundle.demoFolders;
    return getInitialData('folders', INITIAL_FOLDERS);
  });

  const [allObjects, setAllObjects] = useState<EngineeringObject[]>(() => {
    if (isDemo) return initialDemoBundle.demoObjects;
    const loaded = getInitialData<EngineeringObject[]>('objects', INITIAL_OBJECTS);
    return loaded.map(obj => {
      const initObj = INITIAL_OBJECTS.find(io => io.id === obj.id);
      if (initObj) {
        return {
          ...obj,
          custom_columns: (obj.custom_columns && obj.custom_columns.length > 0) ? obj.custom_columns : initObj.custom_columns,
          revisions: (obj.revisions && obj.revisions.length > 0) ? obj.revisions : initObj.revisions,
          version: obj.version > 1 ? obj.version : (initObj.version || obj.version)
        };
      }
      return obj;
    });
  });

  const [relationships, setRelationships] = useState<Relationship[]>(() => {
    if (isDemo) return initialDemoBundle.demoRelationships;
    return getInitialData('relationships', INITIAL_RELATIONSHIPS);
  });

  const [testSteps, setTestSteps] = useState<TestStep[]>(() => {
    if (isDemo) return initialDemoBundle.demoTestSteps;
    return getInitialData('test_steps', INITIAL_TEST_STEPS);
  });

  const [artifacts, setArtifacts] = useState<Artifact[]>(() => {
    if (isDemo) return initialDemoBundle.demoArtifacts;
    return getInitialData('artifacts', INITIAL_ARTIFACTS);
  });

  const [testRuns, setTestRuns] = useState<TestRun[]>(() => {
    return getInitialData('test_runs', INITIAL_TEST_RUNS);
  });

  const [testRunDetailsMap, setTestRunDetailsMap] = useState<Record<number, any>>(() => {
    return getInitialData('test_run_details', INITIAL_TEST_RUN_DETAILS);
  });
  
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view')?.toUpperCase();
      if (v === 'DASHBOARD' || v === 'TRACKER' || v === 'TRACEABILITY' || v === 'TEST_EXECUTION' || v === 'IMPACT') {
        return v as ViewMode;
      }
      if (params.get('tracker') || params.get('object')) {
        return 'TRACKER';
      }
    } catch (e) {}
    return 'DASHBOARD';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [impactObjectId, setImpactObjectId] = useState<number | null>(null);

  // Sync browser Back/Forward navigation with URL
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const projParam = params.get('project');
        if (projParam) {
          const match = projects.find(p => p.key.toLowerCase() === projParam.toLowerCase() || String(p.id) === projParam);
          if (match) {
            setActiveProjectId(match.id);
            setCurrentScreen('WORKSPACE');
            return;
          }
        }
        setCurrentScreen('PROJECTS_PORTAL');
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projects]);

  // Cross-tab real-time state synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'roboserv_auth_current_user') {
        if (!e.newValue) {
          setCurrentUser(null);
          setCurrentScreen('PROJECTS_PORTAL');
        } else {
          try {
            setCurrentUser(JSON.parse(e.newValue));
          } catch (err) {}
        }
      } else if (e.key === 'roboserv_elm_objects') {
        try { if (e.newValue) setAllObjects(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'roboserv_elm_folders') {
        try { if (e.newValue) setAllFolders(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'roboserv_elm_relationships') {
        try { if (e.newValue) setRelationships(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'roboserv_elm_trackers') {
        try { if (e.newValue) setAllTrackers(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'roboserv_elm_projects') {
        try { if (e.newValue) setProjects(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'roboserv_elm_test_runs') {
        try { if (e.newValue) setTestRuns(JSON.parse(e.newValue)); } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    authService.logout();
    try {
      sessionStorage.removeItem('roboserv_auth_current_user');
      localStorage.removeItem('roboserv_auth_current_user');
      const url = new URL(window.location.href);
      url.searchParams.delete('account');
      url.searchParams.delete('project');
      url.searchParams.delete('view');
      url.searchParams.delete('tracker');
      url.searchParams.delete('object');
      window.history.replaceState({}, '', url.pathname);
    } catch (e) {}
    setCurrentUser(null);
    setCurrentScreen('PROJECTS_PORTAL');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('roboserv_auth_current_user', JSON.stringify(user));
      localStorage.setItem('roboserv_auth_current_user', JSON.stringify(user));
    } catch (e) {}
    if (user.username === 'demo') {
      const demoTrackers = buildDemoTrackers();
      const demoFolders = buildDemoFolders(demoTrackers);
      const demoObjects = buildDemoObjects(demoTrackers, demoFolders);
      setProjects([DEMO_PROJECT]);
      setActiveProjectId(DEMO_PROJECT.id);
      setAllTrackers(demoTrackers);
      setAllFolders(demoFolders);
      setAllObjects(demoObjects);
      setTestSteps(buildDemoTestSteps(demoObjects, demoTrackers));
      setArtifacts(buildDemoArtifacts());
      setRelationships(buildDemoRelationships(demoObjects));
      setSelectedTrackerId(demoTrackers[0]?.id || null);
      setActiveView('DASHBOARD');
      setCurrentScreen('PROJECTS_PORTAL');
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('account', 'demo');
        url.searchParams.delete('project');
        window.history.pushState({}, '', url.toString());
      } catch (e) {}
    } else {
      // Zewd
      const loadedProjects = getInitialData<Project[]>('projects', INITIAL_PROJECTS);
      const loadedTrackers = getInitialData<Tracker[]>('trackers', INITIAL_TRACKERS);
      setProjects(loadedProjects);
      setActiveProjectId(loadedProjects[0]?.id || 1);
      setAllTrackers(loadedTrackers);
      setAllFolders(getInitialData('folders', INITIAL_FOLDERS));
      setAllObjects(getInitialData('objects', INITIAL_OBJECTS));
      setTestSteps(getInitialData('test_steps', INITIAL_TEST_STEPS));
      setArtifacts(getInitialData('artifacts', INITIAL_ARTIFACTS));
      setRelationships(getInitialData('relationships', INITIAL_RELATIONSHIPS));
      setSelectedTrackerId(loadedTrackers[0]?.id || 1);
      setActiveView('DASHBOARD');
      setCurrentScreen('PROJECTS_PORTAL');
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('account', 'zewd');
        url.searchParams.delete('project');
        window.history.pushState({}, '', url.toString());
      } catch (e) {}
    }
  };

  const handleSelectProjectToInspect = (p: Project) => {
    handleSelectProject(p);
    setAdminMode('INSPECT');
  };

  const refreshAuthData = () => {
    setProjects(getInitialData('projects', INITIAL_PROJECTS));
    setAllTrackers(getInitialData('trackers', INITIAL_TRACKERS));
    setTestRuns(getInitialData('test_runs', INITIAL_TEST_RUNS));
    setTestRunDetailsMap(getInitialData('test_run_details', INITIAL_TEST_RUN_DETAILS));
  };

  // Derived state: Active Project & Active Trackers
  const visibleProjects = projects;
  const activeProject = visibleProjects.find(p => p.id === activeProjectId) || visibleProjects[0] || INITIAL_PROJECTS[0];

  const currentTrackers = allTrackers
    .filter(t => t.project_id === activeProject.id)
    .map(t => ({
      ...t,
      object_count: allObjects.filter(o => o.tracker_id === t.id).length
    }));

  const currentProjectTrackerIds = currentTrackers.map(t => t.id);
  const currentProjectObjects = allObjects.filter(o => currentProjectTrackerIds.includes(o.tracker_id));
  const currentProjectObjectIds = currentProjectObjects.map(o => o.id);
  const currentProjectArtifacts = artifacts.filter(a => {
    if (a.project_id && a.project_id !== activeProject.id) return false;
    if (a.object_id && !currentProjectObjectIds.includes(a.object_id)) return false;
    return true;
  });

  const selectedTracker = currentTrackers.find(t => t.id === selectedTrackerId) || currentTrackers[0] || null;

  // Auto-persist all state changes directly to localStorage ONLY for non-demo users (e.g. Zewd)
  // Demo account changes are strictly in-memory and discarded upon reload
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_projects', JSON.stringify(projects));
  }, [projects, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_active_project_id', JSON.stringify(activeProjectId));
  }, [activeProjectId, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_trackers', JSON.stringify(allTrackers));
  }, [allTrackers, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_selected_tracker_id', JSON.stringify(selectedTracker?.id || null));
  }, [selectedTracker, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_folders', JSON.stringify(allFolders));
  }, [allFolders, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_objects', JSON.stringify(allObjects));
  }, [allObjects, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_relationships', JSON.stringify(relationships));
  }, [relationships, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_test_steps', JSON.stringify(testSteps));
  }, [testSteps, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_artifacts', JSON.stringify(artifacts));
  }, [artifacts, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_test_runs', JSON.stringify(testRuns));
  }, [testRuns, currentUser]);
  useEffect(() => {
    if (!currentUser || currentUser.username === 'demo') return;
    localStorage.setItem('roboserv_elm_test_run_details', JSON.stringify(testRunDetailsMap));
  }, [testRunDetailsMap, currentUser]);

  const handleSelectProject = (p: Project) => {
    setActiveProjectId(p.id);
    const pTrackers = allTrackers.filter(t => t.project_id === p.id);
    if (pTrackers.length > 0) {
      setSelectedTrackerId(pTrackers[0].id);
    } else {
      setSelectedTrackerId(null);
    }
    setActiveView('DASHBOARD');
    setCurrentScreen('WORKSPACE');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('project', p.key.toLowerCase());
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };

  const handleBackToProjectsPortal = () => {
    setCurrentScreen('PROJECTS_PORTAL');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };


  const handleCreateProject = (data: { key: string; name: string; description?: string }) => {
    const newProjectId = Date.now();
    const upperKey = data.key.toUpperCase().trim();

    const newProject: Project = {
      id: newProjectId,
      key: upperKey,
      name: data.name.trim(),
      description: data.description || ''
    };

    const newTrackers: Tracker[] = createProjectTrackers(newProjectId, upperKey);

    setProjects(prev => [newProject, ...prev]);
    setAllTrackers(prev => [...prev, ...newTrackers]);
    setActiveProjectId(newProjectId);
    setSelectedTrackerId(newTrackers[0].id);
    setActiveView('DASHBOARD');
    setCurrentScreen('WORKSPACE');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('project', upperKey.toLowerCase());
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };

  const handleUpdateProject = (id: number, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeleteProject = (id: number) => {
    if (projects.length <= 1) {
      alert("Cannot delete the only remaining project!");
      return;
    }

    const pTrackers = allTrackers.filter(t => t.project_id === id);
    const pTrackerIds = pTrackers.map(t => t.id);
    const pObjects = allObjects.filter(o => pTrackerIds.includes(o.tracker_id));
    const pObjIds = pObjects.map(o => o.id);

    setProjects(prev => prev.filter(p => p.id !== id));
    setAllTrackers(prev => prev.filter(t => !pTrackerIds.includes(t.id)));
    setAllFolders(prev => prev.filter(f => !pTrackerIds.includes(f.tracker_id)));
    setAllObjects(prev => prev.filter(o => !pTrackerIds.includes(o.tracker_id)));
    setRelationships(prev => prev.filter(r => !pObjIds.includes(r.source_id) && !pObjIds.includes(r.target_id)));
    setTestSteps(prev => prev.filter(s => !pObjIds.includes(s.test_case_id)));
    setArtifacts(prev => prev.filter(a => !pObjIds.includes(a.object_id || -1)));

    if (activeProjectId === id) {
      const remainingProjects = projects.filter(p => p.id !== id);
      const nextProject = remainingProjects[0];
      if (nextProject) {
        setActiveProjectId(nextProject.id);
        const nextTrackers = allTrackers.filter(t => t.project_id === nextProject.id);
        setSelectedTrackerId(nextTrackers[0]?.id || null);
      }
    }
  };

  const handleCreateTracker = (data: {
    name: string;
    key: string;
    type: string;
    enable_test_steps: boolean;
    enable_folders: boolean;
    description?: string;
    category?: string;
  }) => {
    const newTrackerId = Date.now();
    let prefix = data.key.toUpperCase().trim();
    if (!prefix.endsWith('-')) prefix += '-';
    const cleanKey = prefix.replace(/-/g, '');

    const newTracker: Tracker = {
      id: newTrackerId,
      project_id: activeProjectId,
      key: cleanKey,
      name: data.name.trim(),
      category: data.category || 'Custom Trackers',
      type: data.type || 'REQUIREMENT',
      prefix,
      object_count: 0,
      enable_test_steps: data.enable_test_steps,
      enable_folders: data.enable_folders,
      description: data.description || ''
    };

    setAllTrackers(prev => [...prev, newTracker]);
    setSelectedTrackerId(newTrackerId);
    setActiveView('TRACKER');
  };

  const handleDeleteTracker = (trackerId: number) => {
    setAllTrackers(prev => prev.filter(t => t.id !== trackerId));
    const trackerObjIds = allObjects.filter(o => o.tracker_id === trackerId).map(o => o.id);
    setAllObjects(prev => prev.filter(o => o.tracker_id !== trackerId));
    setRelationships(prev => prev.filter(r => !trackerObjIds.includes(r.source_id) && !trackerObjIds.includes(r.target_id)));
    setTestSteps(prev => prev.filter(s => !trackerObjIds.includes(s.test_case_id)));
    setArtifacts(prev => prev.filter(a => !trackerObjIds.includes(a.object_id || -1)));
    setAllFolders(prev => prev.filter(f => f.tracker_id !== trackerId));
    
    if (selectedTrackerId === trackerId) {
      const remaining = allTrackers.filter(t => t.id !== trackerId && t.project_id === activeProjectId);
      setSelectedTrackerId(remaining[0]?.id || null);
    }
  };

  const handleCreateFolder = (tracker_id: number, name: string) => {
    const existing = allFolders.filter(f => f.tracker_id === tracker_id);
    const newFolder: Folder = {
      id: Date.now(),
      tracker_id,
      parent_id: null,
      name: name.trim(),
      position: existing.length + 1
    };
    setAllFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const handleCreateObject = (data: {
    tracker_id: number;
    folder_id?: number | null;
    title: string;
    description?: string;
    pre_action?: string;
    post_action?: string;
    start_date?: string;
    end_date?: string;
    planned_effort?: string;
    spent_effort?: string;
    category?: string;
    resolution?: string;
    release?: string;
    status?: string;
    requirement_type?: RequirementType;
    safety_level?: SafetyLevel;
    test_subprocess?: TestSubProcess;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    test_step_action?: string;
    test_step_expected?: string;
    included_test_case_ids?: number[];
    metadata?: any;
  }) => {
    const tracker = allTrackers.find(t => t.id === data.tracker_id);
    if (!tracker) return;

    const folder = allFolders.find(f => f.id === data.folder_id);
    const count = allObjects.filter(o => o.tracker_id === tracker.id).length;
    const object_key = `${tracker.prefix}${String(count + 1).padStart(3, '0')}`;
    const newObjId = Date.now();

    const newObj: EngineeringObject = {
      id: newObjId,
      tracker_id: tracker.id,
      tracker_name: tracker.name,
      folder_id: data.folder_id || null,
      folder_name: folder?.name || null,
      object_key,
      title: data.title,
      description: data.description || '',
      pre_action: data.pre_action || '',
      post_action: data.post_action || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      planned_effort: data.planned_effort || '',
      spent_effort: data.spent_effort || '',
      category: data.category || '',
      resolution: data.resolution || 'Unresolved',
      release: data.release || 'Release 2.4',
      type: tracker.type,
      requirement_type: data.requirement_type || 'Functional Requirement',
      safety_level: data.safety_level || 'ASIL-D',
      test_subprocess: data.test_subprocess || 'System Testing',
      status: data.status || 'DRAFT',
      priority: data.priority || 'MEDIUM',
      owner_id: 1,
      owner_name: 'Zewd',
      created_by_name: 'Zewd',
      version: 1,
      metadata: data.metadata || { rationale: 'Created via workspace UI', author: 'Zewd' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAllObjects(prev => [newObj, ...prev]);

    // Add Initial Test Step for Test Cases
    if (data.test_step_action && data.test_step_expected) {
      const initialStep: TestStep = {
        id: Date.now() + 1,
        test_case_id: newObjId,
        step_number: 1,
        action: data.test_step_action.trim(),
        expected_result: data.test_step_expected.trim()
      };
      setTestSteps(prev => [...prev, initialStep]);
    }

    // Auto-link selected test cases to Test Set
    if (data.included_test_case_ids && data.included_test_case_ids.length > 0) {
      const newRels: Relationship[] = data.included_test_case_ids.map((tcId, idx) => ({
        id: Date.now() + 10 + idx,
        source_id: tcId,
        target_id: newObjId,
        relationship_type: 'INCLUDED_IN'
      }));
      setRelationships(prev => [...prev, ...newRels]);
    }
    return newObjId;
  };

  const handleUpdateObject = (id: number, updates: Partial<EngineeringObject>) => {
    setAllObjects(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          ...updates,
          version: updates.version !== undefined
            ? updates.version
            : (updates.title || updates.description || updates.status || updates.requirement_type || updates.safety_level ? o.version + 1 : o.version),
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
  };

  const handleDeleteObject = (id: number) => {
    setAllObjects(prev => prev.filter(o => o.id !== id));
    setRelationships(prev => prev.filter(r => r.source_id !== id && r.target_id !== id));
    setTestSteps(prev => prev.filter(s => s.test_case_id !== id));
    setArtifacts(prev => prev.filter(a => a.object_id !== id));
  };

  const handleAddRelationship = (source_id: number, target_id: number, relationship_type: any) => {
    const newRel: Relationship = {
      id: Date.now(),
      source_id,
      target_id,
      relationship_type
    };
    setRelationships(prev => [...prev, newRel]);
  };

  const handleDeleteRelationship = (id: number) => {
    setRelationships(prev => prev.filter(r => r.id !== id));
  };

  const handleAddTestStep = (test_case_id: number, action: string, expected_result: string) => {
    const existing = testSteps.filter(s => s.test_case_id === test_case_id);
    const newStep: TestStep = {
      id: Date.now(),
      test_case_id,
      step_number: existing.length + 1,
      action: action.trim(),
      expected_result: expected_result.trim()
    };
    setTestSteps(prev => [...prev, newStep]);
  };

  const handleDeleteTestStep = (id: number) => {
    setTestSteps(prev => prev.filter(s => s.id !== id));
  };

  // Artifact & File Attachment Handlers
  const handleAddArtifact = (data: { object_id?: number; project_id?: number; filename: string; category: any; file_size?: number; stored_path?: string }) => {
    const obj = data.object_id ? allObjects.find(o => o.id === data.object_id) : undefined;
    const projId = data.project_id || activeProject.id;
    const newArt: Artifact = {
      id: Date.now(),
      project_id: projId,
      object_id: data.object_id,
      object_key: obj?.object_key || `${activeProject.key}-DOC`,
      object_title: obj?.title || `${activeProject.name} Artifact Repository`,
      filename: data.filename.trim(),
      stored_path: data.stored_path || `/artifacts/${data.filename.trim()}`,
      file_size: data.file_size || Math.floor(Math.random() * 5000000) + 500000,
      mime_type: 'application/octet-stream',
      category: data.category || 'PDF',
      uploader_name: 'Zewd',
      created_at: new Date().toISOString()
    };
    setArtifacts(prev => [newArt, ...prev]);
  };

  const handleDeleteArtifact = (id: number) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const handleNavigate = (view: ViewMode, tracker?: Tracker) => {
    setActiveView(view);
    if (tracker) setSelectedTrackerId(tracker.id);
  };

  const handleCreateTestRunFromSet = (testSet: EngineeringObject) => {
    // 1. Resolve folder name of test set and name format based on test set title
    const folder = allFolders.find(f => f.id === testSet.folder_id);
    const folderName = testSet.folder_name || folder?.name || 'General';
    const testSetName = testSet.title?.trim() || testSet.object_key;
    const runName = `Test Run for ${testSetName}`;

    // 2. Find single test run tracker for current project
    let testRunTracker = currentTrackers.find(t =>
      t.key === 'TR_GEN' ||
      cleanTrackerName(t.name).toLowerCase() === 'test runs' ||
      t.name.toLowerCase() === 'test runs' ||
      t.key === 'SQTR' ||
      t.type === 'TEST_RUN'
    );

    if (!testRunTracker) {
      testRunTracker = currentTrackers.find(t => t.name.toLowerCase().includes('run')) || currentTrackers[0];
    }

    // 3. Find test cases included in this test set
    const incRels = relationships.filter(r => r.target_id === testSet.id && r.relationship_type === 'INCLUDED_IN');
    const includedCases = incRels
      .map(r => currentProjectObjects.find(o => o.id === r.source_id))
      .filter(Boolean) as EngineeringObject[];

    // 4. Create new Engineering Object in testRunTracker
    const existingRunObjs = currentProjectObjects.filter(o => o.tracker_id === testRunTracker!.id);
    const nextSeq = existingRunObjs.length + 1;
    const prefix = testRunTracker?.prefix || `${activeProject?.key || 'ROBO'}-TR-`;
    const newObjKey = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    const newRunId = Date.now();

    const newRunObj: EngineeringObject = {
      id: newRunId,
      tracker_id: testRunTracker!.id,
      tracker_name: testRunTracker!.name,
      folder_id: testSet.folder_id || null,
      folder_name: folderName,
      object_key: newObjKey,
      title: runName,
      description: `Execution test run generated from Test Set [${testSet.object_key}] "${testSet.title}". Contains ${includedCases.length} included test cases.`,
      type: 'TEST_RUN',
      requirement_type: 'Non-Functional Requirement',
      safety_level: testSet.safety_level || 'SIL-2',
      test_subprocess: 'System Testing',
      status: 'NOT_RUN',
      priority: testSet.priority || 'HIGH',
      owner_id: currentUser?.id || 1,
      owner_name: currentUser?.name || 'Zewd',
      created_by_name: currentUser?.name || 'Zewd',
      pre_action: `Target Test Set: [${testSet.object_key}] ${testSet.title}`,
      post_action: `Procedure results recorded in single Test Runs tracker.`,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 5. Create TestRun entity for TestExecutionView engine
    const newTestRun: TestRun = {
      id: newRunId,
      project_id: activeProject?.id || 1,
      test_set_id: testSet.id,
      test_config_id: 1,
      name: runName,
      overall_status: 'NOT_RUN',
      tester_name: currentUser?.name || 'Zewd',
      test_set_key: testSet.object_key,
      test_set_title: testSet.title,
      config_name: `${activeProject?.name || 'RoboServ-X1'} Hardware Configuration`,
      software_version: 'v1.0.0-release',
      started_at: new Date().toISOString()
    };

    // Map caseResults
    const caseResults = (includedCases.length > 0 ? includedCases : [testSet]).map(tc => {
      const tcSteps = testSteps.filter(s => s.test_case_id === tc.id);
      return {
        id: Date.now() + tc.id,
        test_run_id: newRunId,
        test_case_id: tc.id,
        case_key: tc.object_key,
        case_title: tc.title,
        status: 'NOT_RUN' as const,
        steps: tcSteps.length > 0 ? tcSteps.map(s => ({
          id: s.id * 100 + newRunId,
          test_run_result_id: Date.now() + tc.id,
          test_step_id: s.id,
          step_number: s.step_number,
          action: s.action,
          expected_result: s.expected_result,
          status: 'NOT_RUN' as const,
          actual_result: ''
        })) : [
          {
            id: Date.now() + 500,
            test_run_result_id: Date.now() + tc.id,
            test_step_id: 1,
            step_number: 1,
            action: `Execute verification procedure for ${tc.title}`,
            expected_result: `System operates in compliance with ${tc.object_key} specification`,
            status: 'NOT_RUN' as const,
            actual_result: ''
          }
        ]
      };
    });

    const detailObj = {
      id: newRunId,
      name: runName,
      test_set_key: testSet.object_key,
      test_set_title: testSet.title,
      config_name: newTestRun.config_name,
      software_version: newTestRun.software_version,
      tester_name: newTestRun.tester_name,
      overall_status: 'NOT_RUN',
      caseResults
    };

    // Update states
    setAllObjects(prev => [newRunObj, ...prev]);
    setTestRuns(prev => [newTestRun, ...prev]);
    setTestRunDetailsMap(prev => ({ ...prev, [newRunId]: detailObj }));

    // Relationship: new run object EXECUTED_FROM test set
    const newRel: Relationship = {
      id: Date.now() + 1,
      source_id: newRunId,
      target_id: testSet.id,
      relationship_type: 'EXECUTED_FROM'
    };
    setRelationships(prev => [...prev, newRel]);
    setAllTrackers(prev => prev.map(t => t.id === testRunTracker!.id ? { ...t, object_count: (t.object_count || 0) + 1 } : t));

    return { newRunObj, newTestRun, testRunTracker: testRunTracker! };
  };

  const handleSelectObjectForImpact = (objId: number) => {
    setImpactObjectId(objId);
    setActiveView('IMPACT');
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => handleLoginSuccess(u)} />;
  }

  if (currentUser.role === 'ADMIN_OWNER' && adminMode === 'CONSOLE') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
        <Header
          project={activeProject}
          projects={projects}
          currentUser={currentUser}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLogout={handleLogout}
          onBackToProjects={handleBackToProjectsPortal}
        />
        <AdminConsoleView
          currentUser={currentUser}
          projects={projects}
          allObjects={allObjects}
          allTrackers={allTrackers}
          onSelectProjectToInspect={handleSelectProjectToInspect}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onCreateTracker={handleCreateTracker}
          onRefreshData={refreshAuthData}
        />
      </div>
    );
  }

  if (currentScreen === 'PROJECTS_PORTAL') {
    return (
      <ProjectsPortalView
        projects={visibleProjects}
        allTrackers={allTrackers}
        allObjects={allObjects}
        testRuns={testRuns}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Header
        project={activeProject}
        projects={visibleProjects}
        currentUser={currentUser}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        onOpenAdminConsole={() => setAdminMode('CONSOLE')}
        onBackToProjects={handleBackToProjectsPortal}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeView !== 'TRACKER' && (
          <Sidebar
            trackers={currentTrackers}
            activeView={activeView}
            setActiveView={setActiveView}
            selectedTracker={selectedTracker}
            setSelectedTracker={(t) => setSelectedTrackerId(t?.id || null)}
            currentUser={currentUser}
            activeProjectId={activeProject.id}
            activeProjectName={activeProject.name}
            onCreateTracker={handleCreateTracker}
            onDeleteTracker={handleDeleteTracker}
          />
        )}

        <main style={{ flex: 1, overflow: 'hidden' }}>
          {activeView === 'DASHBOARD' && (
            <DashboardView
              project={activeProject}
              onNavigate={handleNavigate}
              trackers={currentTrackers}
              allObjects={currentProjectObjects}
              testRuns={testRuns}
            />
          )}

          {activeView === 'TRACKER' && selectedTracker && (
            <TrackerTableView
              tracker={selectedTracker}
              objects={allObjects.filter(o => o.tracker_id === selectedTracker.id)}
              allObjects={currentProjectObjects}
              folders={allFolders.filter(f => f.tracker_id === selectedTracker.id)}
              allTrackers={currentTrackers}
              relationships={relationships}
              testSteps={testSteps}
              artifacts={currentProjectArtifacts}
              testRuns={testRuns}
              onCreateFolder={handleCreateFolder}
              onCreateObject={handleCreateObject}
              onUpdateObject={handleUpdateObject}
              onDeleteObject={handleDeleteObject}
              onAddRelationship={handleAddRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              onAddTestStep={handleAddTestStep}
              onDeleteTestStep={handleDeleteTestStep}
              onAddArtifact={handleAddArtifact}
              onDeleteArtifact={handleDeleteArtifact}
              onSelectObjectForImpact={handleSelectObjectForImpact}
              onCreateTestRun={handleCreateTestRunFromSet}
              onNavigateTracker={(tracker, objId) => {
                setSelectedTrackerId(tracker.id);
                setActiveView('TRACKER');
              }}
              onNavigateView={(view) => setActiveView(view)}
              onBackToDashboard={() => setActiveView('DASHBOARD')}
            />
          )}

          {activeView === 'TRACEABILITY' && (
            <TraceabilityMatrixView
              trackers={currentTrackers}
              allObjects={currentProjectObjects}
              relationships={relationships}
              onAddRelationship={handleAddRelationship}
              onDeleteRelationship={handleDeleteRelationship}
            />
          )}

          {activeView === 'IMPACT' && impactObjectId && (
            <ImpactAnalysisView objectId={impactObjectId} onBack={() => setActiveView('TRACKER')} />
          )}

          {activeView === 'TEST_EXECUTION' && (
            <TestExecutionView
              currentUser={currentUser}
              activeProject={activeProject}
              currentTrackers={currentTrackers}
              allObjects={currentProjectObjects}
              testSteps={testSteps}
              relationships={relationships}
              testRuns={testRuns}
              testRunDetailsMap={testRunDetailsMap}
              onUpdateTestRuns={setTestRuns}
              onUpdateRunDetailsMap={setTestRunDetailsMap}
            />
          )}

          {activeView === 'RISK_MATRIX' && (
            <RisksMatrixView
              activeProject={activeProject}
              currentTrackers={currentTrackers}
              allObjects={currentProjectObjects}
            />
          )}

          {activeView === 'BASELINES' && (
            <BaselinesView />
          )}

          {activeView === 'ARTIFACTS' && (
            <ArtifactsView
              artifacts={currentProjectArtifacts}
              onAddArtifact={handleAddArtifact}
              onDeleteArtifact={handleDeleteArtifact}
            />
          )}

          {activeView === 'AUDIT' && (
            <AuditView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
