export interface Tracker {
  id: number;
  project_id: number;
  key: string;
  name: string;
  type: string;
  prefix: string;
  object_count?: number;
  enable_test_steps?: boolean;
  enable_folders?: boolean;
  description?: string;
  category?: string;
}


export interface TrackerTemplate {
  index: number;
  name: string;
  key: string;
  category: CanonicalCategory;
  type: string;
  prefix: string;
  source: string;
  desc: string;
  enable_test_steps?: boolean;
}

export const CANONICAL_CATEGORIES = [
  'Group 1: Project Governance',
  'Group 2: Requirements Engineering',
  'Group 3: Architecture, Design & Components',
  'Group 4: Decisions, Safety & Quality',
  'Group 5: Verification & Validation',
  'Group 6: Defect Management',
  'Group 7: Task & Change Management',
  'Custom Trackers',
  // Backward compatibility legacy category names
  'Requirements & Verification',
  'Architecture & Hardware',
  'Testing, Sets & Runs',
  'Safety & Risks',
  'Defects & Problems',
  'Tasks & Epics',
  'Changes & Releases',
  'Documents & Governance'
] as const;

export type CanonicalCategory = typeof CANONICAL_CATEGORIES[number];

export const CORE_25_CATEGORIES = [
  'Group 1: Project Governance',
  'Group 2: Requirements Engineering',
  'Group 3: Architecture, Design & Components',
  'Group 4: Decisions, Safety & Quality',
  'Group 5: Verification & Validation',
  'Group 6: Defect Management',
  'Group 7: Task & Change Management'
] as const;

/**
 * Strips legacy serial numbers and prefixes (e.g., '028_', '031_', '054A_', '0741 ', '10_')
 * and normalizes tracker names into clean engineering titles.
 */
export function cleanTrackerName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^\d+[A-Za-z]?_/, '')   // 028_, 054A_, 0311_, 0361_
    .replace(/^\d+\s+/, '')           // 10 Quality Assurance, 0741 SW Epic
    .replace(/_/g, ' ')               // Replace remaining underscores with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Authoritative 25 Consolidated Core Trackers for Systems Engineering.
 */
export const CORE_25_TRACKERS: TrackerTemplate[] = [
  {
    "index": 1,
    "name": "Systems Engineering Strategy",
    "key": "SYS-STRAT",
    "category": "Group 1: Project Governance",
    "type": "DOCUMENT",
    "prefix": "SYS-STRAT-",
    "source": "Governance",
    "desc": "Defines the complete engineering lifecycle, methodology, standards, review rules, milestones, and governance framework for the robotic product."
  },
  {
    "index": 2,
    "name": "Controlled Engineering Documents",
    "key": "DOC",
    "category": "Group 1: Project Governance",
    "type": "DOCUMENT",
    "prefix": "DOC-",
    "source": "Governance",
    "desc": "Controlled engineering reports, problem statements, specifications, calculation sheets, CAD exports, wiring diagrams, and manuals."
  },
  {
    "index": 3,
    "name": "Minutes of Meeting",
    "key": "MOM",
    "category": "Group 1: Project Governance",
    "type": "DOCUMENT",
    "prefix": "MOM-",
    "source": "Governance",
    "desc": "Formal records of systems engineering reviews, architecture boards, gate assessments, action items, and technical alignment meetings."
  },
  {
    "index": 4,
    "name": "Stakeholder Requirements",
    "key": "STK-REQ",
    "category": "Group 2: Requirements Engineering",
    "type": "REQUIREMENT",
    "prefix": "STK-REQ-",
    "source": "Requirements",
    "desc": "High-level operational needs, business goals, and constraints captured from restaurant owners, managers, kitchen staff, diners, and maintenance."
  },
  {
    "index": 5,
    "name": "System Requirements",
    "key": "SYS-REQ",
    "category": "Group 2: Requirements Engineering",
    "type": "REQUIREMENT",
    "prefix": "SYS-REQ-",
    "source": "Requirements",
    "desc": "Functional and non-functional requirements defining what the complete robot platform must do (delivery, navigation, E-stop, payload, battery life)."
  },
  {
    "index": 6,
    "name": "Hardware Requirements",
    "key": "HW-REQ",
    "category": "Group 2: Requirements Engineering",
    "type": "REQUIREMENT",
    "prefix": "HW-REQ-",
    "source": "Requirements",
    "desc": "Detailed physical requirements allocated to chassis, motors, controllers, power distribution, battery, BMS, computing, sensors, and mechanical tray."
  },
  {
    "index": 7,
    "name": "Software Requirements",
    "key": "SW-REQ",
    "category": "Group 2: Requirements Engineering",
    "type": "REQUIREMENT",
    "prefix": "SW-REQ-",
    "source": "Requirements",
    "desc": "Software requirements allocated to ROS 2 nodes, localization, mapping, Nav2 path planning, obstacle avoidance, order integration, and diagnostics."
  },
  {
    "index": 8,
    "name": "System Architecture & Design",
    "key": "SAD",
    "category": "Group 3: Architecture, Design & Components",
    "type": "ARCHITECTURE",
    "prefix": "SAD-",
    "source": "Architecture",
    "desc": "System-level architectural decompositions, functional allocations, logical partitions, physical block diagrams, and multi-tier design models."
  },
  {
    "index": 9,
    "name": "Subsystem Design",
    "key": "SUBD",
    "category": "Group 3: Architecture, Design & Components",
    "type": "ARCHITECTURE",
    "prefix": "SUBD-",
    "source": "Architecture",
    "desc": "Subsystem engineering records covering mechanical structure, electrical layout, power distribution, sensor mounts, firmware, and embedded controls."
  },
  {
    "index": 10,
    "name": "Interface Control",
    "key": "ICD",
    "category": "Group 3: Architecture, Design & Components",
    "type": "ARCHITECTURE",
    "prefix": "ICD-",
    "source": "Architecture",
    "desc": "Defines and controls physical, electrical, CAN bus, UART, Ethernet, ROS 2 topics/actions/services, and external restaurant POS/app interfaces."
  },
  {
    "index": 11,
    "name": "Components & Bill of Materials",
    "key": "CMP",
    "category": "Group 3: Architecture, Design & Components",
    "type": "COMPONENT",
    "prefix": "CMP-",
    "source": "Architecture",
    "desc": "Manages component selection, specifications, datasheets, supplier part numbers, lead times, costs, and hierarchical multi-level robot BOM."
  },
  {
    "index": 12,
    "name": "Architecture & Decision Records",
    "key": "ADR",
    "category": "Group 4: Decisions, Safety & Quality",
    "type": "DOCUMENT",
    "prefix": "ADR-",
    "source": "Safety & Quality",
    "desc": "Records significant engineering decisions, context, evaluated alternatives, trade-off analysis, justification rationale, and consequences."
  },
  {
    "index": 13,
    "name": "Risk & Hazard Register",
    "key": "RISK",
    "category": "Group 4: Decisions, Safety & Quality",
    "type": "RISK",
    "prefix": "RISK-",
    "source": "Safety & Quality",
    "desc": "Comprehensive hazard analysis and risk assessment under ISO 13482, tracking initiating causes, severity, likelihood, controls, and residual risks."
  },
  {
    "index": 14,
    "name": "Safety Plan & Safety Case",
    "key": "SAFE",
    "category": "Group 4: Decisions, Safety & Quality",
    "type": "DOCUMENT",
    "prefix": "SAFE-",
    "source": "Safety & Quality",
    "desc": "Maintains product-safety strategy, safety arguments, standards compliance proofs (ISO 13482, ISO 13849), protective measures, and safety acceptance."
  },
  {
    "index": 15,
    "name": "Quality Requirements",
    "key": "QREQ",
    "category": "Group 4: Decisions, Safety & Quality",
    "type": "REQUIREMENT",
    "prefix": "QREQ-",
    "source": "Safety & Quality",
    "desc": "Quality-management, process compliance, reliability metrics (MTBF), maintainability targets, supplier quality requirements, and audit controls."
  },
  {
    "index": 16,
    "name": "Verification & Validation Plans",
    "key": "VVP",
    "category": "Group 5: Verification & Validation",
    "type": "DOCUMENT",
    "prefix": "VVP-",
    "source": "Verification",
    "desc": "Governing verification & validation strategies, campaign objectives, environments, entry/exit criteria, and test resource allocations."
  },
  {
    "index": 17,
    "name": "Universal Test Cases",
    "key": "TC",
    "category": "Group 5: Verification & Validation",
    "type": "TEST_CASE",
    "prefix": "TC-",
    "source": "Verification",
    "desc": "Universal reusable test-case definitions with mandatory Preconditions, ordered Test Steps, expected results per step, and Post-Actions.",
    "enable_test_steps": true
  },
  {
    "index": 18,
    "name": "Test Configurations",
    "key": "TCFG",
    "category": "Group 5: Verification & Validation",
    "type": "CONFIGURATION",
    "prefix": "TCFG-",
    "source": "Verification",
    "desc": "Controls exact hardware build, firmware version, ROS 2 parameters, payload conditions, and test environment setups for reproducible testing."
  },
  {
    "index": 19,
    "name": "Test Sets",
    "key": "TSET",
    "category": "Group 5: Verification & Validation",
    "type": "TEST_SET",
    "prefix": "TSET-",
    "source": "Verification",
    "desc": "Structured collections of test cases grouped into execution campaigns, qualification suites, regression runs, or subsystem verification batches."
  },
  {
    "index": 20,
    "name": "Test Runs",
    "key": "TRUN",
    "category": "Group 5: Verification & Validation",
    "type": "TEST_RUN",
    "prefix": "TRUN-",
    "source": "Verification",
    "desc": "Historical execution instances of test cases and sets, preserving step-level verdicts, actual outcomes, measurements, and verification evidence.",
    "enable_test_steps": true
  },
  {
    "index": 21,
    "name": "Test Reports",
    "key": "TREP",
    "category": "Group 5: Verification & Validation",
    "type": "DOCUMENT",
    "prefix": "TREP-",
    "source": "Verification",
    "desc": "Documented campaign summaries, pass/fail analytics, defect distributions, deviations, coverage proofs, and engineering acceptance statements."
  },
  {
    "index": 22,
    "name": "Defects & Problem Reports",
    "key": "DEF",
    "category": "Group 6: Defect Management",
    "type": "DEFECT",
    "prefix": "DEF-",
    "source": "Defects",
    "desc": "Consolidates hardware faults, software bugs, test failures, integration anomalies, and restaurant field defects with root cause and retest tracking."
  },
  {
    "index": 23,
    "name": "Engineering Tasks & Epics",
    "key": "TASK",
    "category": "Group 7: Task & Change Management",
    "type": "TASK",
    "prefix": "TASK-",
    "source": "Tasks",
    "desc": "Manages engineering tasks, research investigations, design activities, development sprints, and epics with parent-child task hierarchies."
  },
  {
    "index": 24,
    "name": "Change Requests",
    "key": "CR",
    "category": "Group 7: Task & Change Management",
    "type": "CHANGE_REQUEST",
    "prefix": "CR-",
    "source": "Changes",
    "desc": "Rigorous engineering change control with multi-disciplinary impact analysis across requirements, architecture, BOM, safety, and testing."
  },
  {
    "index": 25,
    "name": "Configuration & Releases",
    "key": "REL",
    "category": "Group 7: Task & Change Management",
    "type": "RELEASE",
    "prefix": "REL-",
    "source": "Releases",
    "desc": "Authoritative configuration baselines and formal releases bundling approved requirements, hardware revisions, BOM, software commits, and test evidence."
  }
];

/**
 * Preserved catalog of the original 101 legacy trackers (Non-Negotiable Rule 1).
 */
export const LEGACY_101_TRACKERS: TrackerTemplate[] = [
// ==========================================
  // Group 1: Requirements & Verification (15)
  // ==========================================
  {
    index: 1,
    name: 'IRS Internal Requirement Specification',
    key: 'IRS',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'IRS-',
    source: 'Image 3',
    desc: 'Internal engineering requirements, technical specifications, and internal boundary constraints.'
  },
  {
    index: 2,
    name: 'Customer Quality Requirements',
    key: 'CQR',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'CQR-',
    source: 'Image 3',
    desc: 'Customer-mandated quality metrics, reliability targets, MTBF goals, and warranty expectations.'
  },
  {
    index: 3,
    name: 'Customer Requirement Specification SW',
    key: 'CRSSW',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'CRSSW-',
    source: 'Image 3',
    desc: 'Customer-specified software features, UI/UX interaction workflows, and mission logic.'
  },
  {
    index: 4,
    name: 'Customer Requirement Specification EMC',
    key: 'CRSEMC',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'CRSEMC-',
    source: 'Image 3',
    desc: 'Customer electromagnetic compatibility standards, emission ceilings, and immunity requirements.'
  },
  {
    index: 5,
    name: 'Customer Requirement Specification Test',
    key: 'CRST',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'CRST-',
    source: 'Image 3',
    desc: 'Customer acceptance testing criteria, test witness requirements, and compliance proof demands.'
  },
  {
    index: 6,
    name: 'Customer Requirement Specification ENV',
    key: 'CRSENV',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'CRSENV-',
    source: 'Image 3',
    desc: 'Environmental tolerance standards: thermal range, humidity, ingress protection, and shock.'
  },
  {
    index: 7,
    name: 'CRS Referenced Documents',
    key: 'CRSREF',
    category: 'Requirements & Verification',
    type: 'DOCUMENT',
    prefix: 'CRSREF-',
    source: 'Image 3',
    desc: 'External normative standards, client interface agreements, and customer statements of work.'
  },
  {
    index: 8,
    name: 'System Requirement Specification',
    key: 'SRS',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'SRS-',
    source: 'Image 3',
    desc: 'Master system functional and non-functional requirements governing the complete robot platform.'
  },
  {
    index: 9,
    name: 'Parameter Specification',
    key: 'PAR',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'PAR-',
    source: 'Image 3',
    desc: 'Quantitative operating limits, speed limits, payload capacity, sensor tolerances, and thresholds.'
  },
  {
    index: 10,
    name: 'System Requirement Verification',
    key: 'SRV',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'SRV-',
    source: 'Image 3',
    desc: 'Verification method assignment (Test, Analysis, Demo, Inspection) and verification cross-reference matrix.'
  },
  {
    index: 11,
    name: 'System Requirement Verification (Old)',
    key: 'SRV_OLD',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'SRV-OLD-',
    source: 'Image 2, Image 3',
    desc: 'Archived prior verification baselines, legacy qualification criteria, and traceability history.'
  },
  {
    index: 12,
    name: 'HW Requirements Specification',
    key: 'HWR',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'HWR-',
    source: 'Image 2',
    desc: 'Electronic hardware requirements, PCB power rails, micro-controller compute constraints, and pinouts.'
  },
  {
    index: 13,
    name: 'High Level SW Requirements',
    key: 'HSWR',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'HSWR-',
    source: 'Image 2',
    desc: 'Top-level software architecture capabilities, ROS2 orchestrator goals, and mission state machines.'
  },
  {
    index: 14,
    name: 'SW Requirements Specification',
    key: 'SWR',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'SWR-',
    source: 'Image 2',
    desc: 'Detailed software requirement specifications, dynamic obstacle avoidance logic, and DWB local planner specs.'
  },
  {
    index: 15,
    name: 'Software Customer Topic List',
    key: 'SWCTL',
    category: 'Requirements & Verification',
    type: 'REQUIREMENT',
    prefix: 'SWCTL-',
    source: 'Image 2',
    desc: 'Customer software enhancement backlog, feature requests, and field change topic requests.'
  },

  // ==========================================
  // Group 2: Architecture & Hardware (14)
  // ==========================================
  {
    index: 16,
    name: 'Systems Engineering Strategy',
    key: 'SYS_STRATEGY',
    category: 'Architecture & Hardware',
    type: 'DOCUMENT',
    prefix: 'SYS-STRAT-',
    source: 'Image 3',
    desc: 'V-model systems engineering strategy, milestone review gates, and decomposition architecture.'
  },
  {
    index: 17,
    name: 'COM Matrix',
    key: 'COM',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'COM-',
    source: 'Image 3',
    desc: 'CAN bus 2.0B, Ethernet, and ROS2 DDS topic/service message dictionary and communication frame layout.'
  },
  {
    index: 18,
    name: 'Diagnostic Services',
    key: 'DS',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'DS-',
    source: 'Image 3',
    desc: 'Unified Diagnostic Services (UDS / ISO 14229) definitions, session management, and routine control.'
  },
  {
    index: 19,
    name: 'Fault Code List',
    key: 'FC',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'FC-',
    source: 'Image 3',
    desc: 'Diagnostic Trouble Codes (DTC), fault detection debounce rules, warning chime triggers, and safe states.'
  },
  {
    index: 20,
    name: 'System Architectural Design',
    key: 'SAD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'SAD-',
    source: 'Image 3',
    desc: 'Physical, mechanical, and electrical decomposition into Mobility, Payload, Sensors, and Compute subsystems.'
  },
  {
    index: 21,
    name: 'TCI',
    key: 'TCI',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'TCI-',
    source: 'Image 3',
    desc: 'Technical Customer Interface (TCI) specifications, telemetry push APIs, and remote dispatch endpoints.'
  },
  {
    index: 22,
    name: 'Hardware-Software-Interface',
    key: 'HSI',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'HSI-',
    source: 'Image 3',
    desc: 'Hardware-Software Interface (HSI) register maps, GPIO assignments, ADC channels, and HAL drivers.'
  },
  {
    index: 23,
    name: 'SYS Design',
    key: 'SYSD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'SYSD-',
    source: 'Image 2',
    desc: 'High-level cyber-physical systems design specifications and multi-domain engineering blueprints.'
  },
  {
    index: 24,
    name: 'Electrical (EM) Design',
    key: 'EMD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'EMD-',
    source: 'Image 2',
    desc: 'Electrical wiring harnesses, power distribution boards, battery management BMS schematics, and fusing.'
  },
  {
    index: 25,
    name: 'Mechanical Design',
    key: 'MED',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'MED-',
    source: 'Image 2',
    desc: 'SolidWorks 3D chassis design, IP54 sealing gaskets, drive wheel suspension, and thermal heat sinks.'
  },
  {
    index: 26,
    name: 'HW Architectural Design',
    key: 'HWAD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'HWAD-',
    source: 'Image 2',
    desc: 'High-level electronic block diagrams, bus topology, power domain isolation, and processor hierarchy.'
  },
  {
    index: 27,
    name: 'HW Detailed Design',
    key: 'HWDD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'HWDD-',
    source: 'Image 2',
    desc: 'Altium PCB layouts, component BOM, trace clearance calculations, and high-speed differential pairs.'
  },
  {
    index: 28,
    name: 'SW Architectural Design',
    key: 'SWAD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'SWAD-',
    source: 'Image 2',
    desc: 'Layered ROS2 software architecture, node graph, DDS domain ID allocation, and real-time thread priorities.'
  },
  {
    index: 29,
    name: 'SW Detailed Design',
    key: 'SWDD',
    category: 'Architecture & Hardware',
    type: 'ARCHITECTURE',
    prefix: 'SWDD-',
    source: 'Image 2',
    desc: 'Module-level class diagrams, algorithm state flowcharts, function prototypes, and mutex locking rules.'
  },

  // ==========================================
  // Group 3: Testing, Sets & Runs (44)
  // ==========================================
  {
    index: 30,
    name: 'EMC Test Plan DV',
    key: 'EMCTP_DV',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'EMCTP-DV-',
    source: 'Image 2',
    desc: 'Design Verification (DV) test procedure for conducted and radiated electromagnetic emissions.'
  },
  {
    index: 31,
    name: 'EMC Test Report DV',
    key: 'EMCTR_DV',
    category: 'Testing, Sets & Runs',
    type: 'DOCUMENT',
    prefix: 'EMCTR-DV-',
    source: 'Image 2',
    desc: 'Anechoic chamber empirical test results and formal compliance certificates for DV phase.'
  },
  {
    index: 32,
    name: 'EMC Test Plan PV',
    key: 'EMCTP_PV',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'EMCTP-PV-',
    source: 'Image 2',
    desc: 'Production Validation (PV) electromagnetic immunity and electrostatic discharge (ESD) test protocol.'
  },
  {
    index: 33,
    name: 'EMV Test Report PV',
    key: 'EMVTR_PV',
    category: 'Testing, Sets & Runs',
    type: 'DOCUMENT',
    prefix: 'EMVTR-PV-',
    source: 'Image 2',
    desc: 'Final production-intent electromagnetic compatibility validation results and CE/FCC compliance dossier.'
  },
  {
    index: 34,
    name: 'HW Design Verification',
    key: 'HWDV',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'HWDV-',
    source: 'Image 2',
    desc: 'Hardware bench testing suite: oscilloscope signal integrity, voltage rail ripple, and thermals.'
  },
  {
    index: 35,
    name: 'HW Test Plan',
    key: 'HWTP',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'HWTP-',
    source: 'Image 2',
    desc: 'Board bring-up test plan, boundary scan JTAG testing, and flying-probe ICT test coverage.'
  },
  {
    index: 36,
    name: 'HW Test Report',
    key: 'HWTR',
    category: 'Testing, Sets & Runs',
    type: 'DOCUMENT',
    prefix: 'HWTR-',
    source: 'Image 2',
    desc: 'Empirical hardware verification records, sign-off metrics, and component derating analysis.'
  },
  {
    index: 37,
    name: 'Hardware Software Integration Testplan',
    key: 'HSITP',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'HSITP-',
    source: 'Image 2',
    desc: 'Integration test protocol verifying low-level firmware drivers against microcontroller hardware.'
  },
  {
    index: 38,
    name: 'Design Verification Plan (B-Samples)',
    key: 'DV_PLAN',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'DVP-',
    source: 'Image 2',
    desc: 'B-sample prototype qualification suite: shock, vibration, thermal cycling, and ingress ingress testing.'
  },
  {
    index: 39,
    name: 'Product Validation Plan (C-Samples)',
    key: 'PV_PLAN',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'PVP-',
    source: 'Image 2',
    desc: 'C-sample production-line validation: continuous 500-hour endurance trials and restaurant deployment runs.'
  },
  {
    index: 40,
    name: 'System Qualification Test Specification',
    key: 'SQTS',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'SQTS-',
    source: 'Image 2',
    desc: 'Formal qualification test specifications proving compliance with ISO 13482 safety requirements.'
  },
  {
    index: 41,
    name: 'System Integration and Integration Test Specification',
    key: 'SIITS',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'SIITS-',
    source: 'Image 2',
    desc: 'Multi-subsystem integration test procedures verifying Navigation, Vision, and Motor Drive interplay.'
  },
  {
    index: 42,
    name: 'Mechanical Qualification Test Plan',
    key: 'MQTP',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'MQTP-',
    source: 'Image 2',
    desc: 'Chassis payload stress test, drop impact test, wheel wear characterization, and IPX4 water spray test.'
  },

  {
    index: 43,
    name: 'Test Engineering Cases',
    key: 'TEC',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TEC-',
    source: 'Image 2',
    desc: 'Detailed test cases engineered for custom hardware rigs, HIL test benches, and automated dynamometers.',
    enable_test_steps: true
  },
  {
    index: 44,
    name: 'Test Cases Software Qualification Test',
    key: 'TCSQT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TCSQT-',
    source: 'Image 2',
    desc: 'Formal software qualification test cases verifying high-level SW requirements and mission workflows.',
    enable_test_steps: true
  },
  {
    index: 45,
    name: 'Test Cases Software Integration Test',
    key: 'TCSIT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TCSIT-',
    source: 'Image 2',
    desc: 'ROS2 inter-node topic communication, message deserialization latency, and service call timeout tests.',
    enable_test_steps: true
  },
  {
    index: 46,
    name: 'Test Cases Software Unit Test',
    key: 'TCSUT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TCSUT-',
    source: 'Image 2',
    desc: 'GTest/pytest algorithmic unit tests covering path smoothing, quaternion conversions, and math libraries.',
    enable_test_steps: true
  },
  {
    index: 47,
    name: 'Test Cases Hardware Qualification Test',
    key: 'TCHQT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TCHQT-',
    source: 'Image 2',
    desc: 'Hardware qualification tests: power brownout recovery, over-voltage tolerance, and thermal throttling.',
    enable_test_steps: true
  },
  {
    index: 48,
    name: 'Test Cases Integration Test',
    key: 'TCIT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TCIT-',
    source: 'Image 2',
    desc: 'End-to-end integration test scenarios combining sensors, compute, actuation, and cloud fleet dispatch.',
    enable_test_steps: true
  },
  {
    index: 49,
    name: 'Reliability Test',
    key: 'REL_TST',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'REL-TST-',
    source: 'Image 2',
    desc: 'Accelerated life testing (ALT), thermal shock, continuous runtime stress, and MTBF validation.',
    enable_test_steps: true
  },
  {
    index: 50,
    name: 'Test Cases',
    key: 'TC_GEN',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'TC-',
    source: 'Image 1, Image 2',
    desc: 'General purpose test case repository supporting step-by-step action sequences, expected outcomes, and parameters.',
    enable_test_steps: true
  },
  {
    index: 51,
    name: 'Test Engineering Configuration',
    key: 'TE_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TE-CFG-',
    source: 'Image 2',
    desc: 'HIL simulator configurations, CAN bus baud rate matrices, sensor calibration targets, and test harness setup.'
  },
  {
    index: 52,
    name: 'Test Configurations Software Qualification Test',
    key: 'TCSQT_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TCSQT-CFG-',
    source: 'Image 2',
    desc: 'Software build profiles, compiler flags (-O3, ASAN), ROS2 distro environment variables, and simulation maps.'
  },
  {
    index: 53,
    name: 'Test Configurations Software Integration Test',
    key: 'TCSIT_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TCSIT-CFG-',
    source: 'Image 2',
    desc: 'Multi-node network namespace configs, CycloneDDS XML profiles, and mock sensor data replay bag files.'
  },
  {
    index: 54,
    name: 'Test Configurations Software Unit Test',
    key: 'TCSUT_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TCSUT-CFG-',
    source: 'Image 2',
    desc: 'Isolated unit testing mock injection stubs, memory leak sanitizers, and code coverage tool configurations.'
  },
  {
    index: 55,
    name: 'System Qualification Test Configurations',
    key: 'SQTC',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'SQTC-',
    source: 'Image 2',
    desc: 'Full vehicle system configurations: battery charge state, payload ballast weights, and floor traction profiles.'
  },
  {
    index: 56,
    name: 'Test Configurations Hardware Qualification Test',
    key: 'TCHQT_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TCHQT-CFG-',
    source: 'Image 2',
    desc: 'Bench power supply current limits, climate chamber humidity/temp profiles, and vibration shaker table spectrums.'
  },
  {
    index: 57,
    name: 'Test Configurations Integration Test',
    key: 'TCIT_CFG',
    category: 'Testing, Sets & Runs',
    type: 'ARCHITECTURE',
    prefix: 'TCIT-CFG-',
    source: 'Image 2',
    desc: 'Combined electro-mechanical test rig parameter settings and digital twin synchronization environments.'
  },
  {
    index: 58,
    name: 'Test Engineering Sets',
    key: 'TE_SET',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TE-SET-',
    source: 'Image 2',
    desc: 'Grouped test suites executing automated bench test sets for continuous nightly regression testing.'
  },
  {
    index: 59,
    name: 'Test Sets Software Qualification Test',
    key: 'TSSQT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TSSQT-',
    source: 'Image 2',
    desc: 'Official software release gate test suites required prior to signing off customer release candidates.'
  },
  {
    index: 60,
    name: 'Test Sets Software Integration Test',
    key: 'TSSIT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TSSIT-',
    source: 'Image 2',
    desc: 'Inter-process communications test sets verifying data fidelity between LiDAR, IMU, and Wheel Odometry.'
  },
  {
    index: 61,
    name: 'Test Sets Software Unit Test',
    key: 'TSSUT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TSSUT-',
    source: 'Image 2',
    desc: 'Curated suites of unit tests running on every pull request to enforce 90%+ code coverage.'
  },
  {
    index: 62,
    name: 'System Qualification Test Sets',
    key: 'SQTS_SET',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'SQTS-SET-',
    source: 'Image 2',
    desc: 'End-to-end qualification test sets executed on fully assembled delivery robots in operational environments.'
  },
  {
    index: 63,
    name: 'System Integration Test Sets',
    key: 'SITS',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'SITS-',
    source: 'Image 2',
    desc: 'Complete system integration suites combining mechanical, electrical, and software actuation under load.'
  },
  {
    index: 64,
    name: 'Test Sets Hardware Qualification Test',
    key: 'TSHQT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TSHQT-',
    source: 'Image 2',
    desc: 'Physical PCB and motor inverter stress test suites run at extremes of supply voltage and temperature.'
  },
  {
    index: 65,
    name: 'Test Sets Integration Test',
    key: 'TSIT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TSIT-',
    source: 'Image 2',
    desc: 'Full-loop hardware-in-the-loop (HIL) test suites connecting real controller hardware to simulated dynamics.'
  },
  {
    index: 66,
    name: 'System Qualification Test Runs',
    key: 'SQTR',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'SQTR-',
    source: 'Image 2',
    desc: 'Historical execution runs, recorded passes/failures, environmental logs, and formal audit results.'
  },
  {
    index: 67,
    name: 'Test Runs',
    key: 'TR_GEN',
    category: 'Testing, Sets & Runs',
    type: 'TEST_SET',
    prefix: 'TR-',
    source: 'Image 1, Image 2',
    desc: 'Execution instances of test cases and test sets across builds, serial numbers, and field firmware.'
  },
  {
    index: 68,
    name: 'HW Tests',
    key: 'HWT',
    category: 'Testing, Sets & Runs',
    type: 'TEST_CASE',
    prefix: 'HWT-',
    source: 'Image 2',
    desc: 'General hardware functional test procedures, voltage checks, and sensor sanity checks.'
  },
  {
    index: 69,
    name: 'HW Test Tasks',
    key: 'HWTT',
    category: 'Testing, Sets & Runs',
    type: 'TASK',
    prefix: 'HWTT-',
    source: 'Image 2',
    desc: 'Work assignments for hardware lab engineers: soldering rework, instrument calibration, and test set prep.'
  },
  {
    index: 70,
    name: 'SW Test Tasks',
    key: 'SWTT',
    category: 'Testing, Sets & Runs',
    type: 'TASK',
    prefix: 'SWTT-',
    source: 'Image 2',
    desc: 'Software QA engineering assignments: test case authoring, automation scripting, and flake investigations.'
  },
  {
    index: 71,
    name: 'SW Test Reviews',
    key: 'SWTRV',
    category: 'Testing, Sets & Runs',
    type: 'TASK',
    prefix: 'SWTRV-',
    source: 'Image 2',
    desc: 'Peer reviews of software test procedures, traceability audit sign-offs, and coverage verification.'
  },
  {
    index: 72,
    name: 'System Test Task',
    key: 'STT',
    category: 'Testing, Sets & Runs',
    type: 'TASK',
    prefix: 'STT-',
    source: 'Image 2',
    desc: 'Field testing operational tasks: test track setup, safety tether installation, and sensor cleanups.'
  },

  // ==========================================
  // Group 4: Safety & Risks (3)
  // ==========================================
  {
    index: 73,
    name: 'Risks SWRS',
    key: 'RSWRS',
    category: 'Safety & Risks',
    type: 'RISK',
    prefix: 'RSWRS-',
    source: 'Image 1',
    desc: 'Software safety risks, ASIL hazard ratings, kinetic collision hazards, and fail-safe mitigations.'
  },
  {
    index: 74,
    name: 'Quality Assurance',
    key: 'QA',
    category: 'Safety & Risks',
    type: 'REQUIREMENT',
    prefix: 'QA-',
    source: 'Image 3, Image 4',
    desc: 'Quality assurance gate checklists, ISO 9001 process audits, and peer inspection approvals.'
  },
  {
    index: 75,
    name: 'Safetyplan',
    key: 'SafeP',
    category: 'Safety & Risks',
    type: 'DOCUMENT',
    prefix: 'SafeP-',
    source: 'Image 3, Image 4',
    desc: 'Functional safety management plan, safety lifecycle milestones, and ISO 13482 safety case roadmap.'
  },

  // ==========================================
  // Group 5: Defects & Problems (5)
  // ==========================================
  {
    index: 76,
    name: 'HW Failures',
    key: 'HWF',
    category: 'Defects & Problems',
    type: 'DEFECT',
    prefix: 'HWF-',
    source: 'Image 2',
    desc: 'Physical component burnout, cracked solder joints, delamination, and electrical failure root causes.'
  },
  {
    index: 77,
    name: 'HW Testing Failures',
    key: 'HWTF',
    category: 'Defects & Problems',
    type: 'DEFECT',
    prefix: 'HWTF-',
    source: 'Image 2',
    desc: 'Defects discovered during bench and chamber testing: thermal runaway, voltage dropouts, and noise.'
  },
  {
    index: 78,
    name: 'SW Bugs',
    key: 'SWB',
    category: 'Defects & Problems',
    type: 'DEFECT',
    prefix: 'SWB-',
    source: 'Image 2',
    desc: 'Software defects: segmentation faults, memory leaks, navigation costmap corruption, and race conditions.'
  },
  {
    index: 79,
    name: 'Problem Report',
    key: 'PR',
    category: 'Defects & Problems',
    type: 'DEFECT',
    prefix: 'PR-',
    source: 'Image 1, Image 2',
    desc: 'Unified customer and engineering issue reporting tracker for cross-disciplinary triage.'
  },
  {
    index: 80,
    name: 'Problem Report Octane',
    key: 'PRO',
    category: 'Defects & Problems',
    type: 'DEFECT',
    prefix: 'PRO-',
    source: 'Image 2',
    desc: 'ALM Octane synchronized defect tickets, enterprise escalations, and warranty return investigations.'
  },

  // ==========================================
  // Group 6: Tasks & Epics (9)
  // ==========================================
  {
    index: 81,
    name: 'SYS Tasks',
    key: 'SYST',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'SYST-',
    source: 'Image 2',
    desc: 'Systems engineering work items: allocation analysis, interface harmonization, and ICD generation.'
  },
  {
    index: 82,
    name: 'HW Tasks',
    key: 'HWTK',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'HWTK-',
    source: 'Image 2',
    desc: 'Electronic and mechanical development tasks: schematic capture, PCB layout, and cable harness drafting.'
  },
  {
    index: 83,
    name: 'SW Tasks',
    key: 'SWTK',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'SWTK-',
    source: 'Image 2',
    desc: 'Software sprint tasks: path planner optimization, sensor driver development, and web GUI implementation.'
  },
  {
    index: 84,
    name: 'SW Epic',
    key: 'SWEPIC',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'SWEPIC-',
    source: 'Image 2',
    desc: 'High-level multi-sprint software development initiatives, major subsystem overhauls, and capabilities.'
  },
  {
    index: 85,
    name: 'QAD Tasks (Old Version)',
    key: 'QAD_OLD',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'QAD-OLD-',
    source: 'Image 2',
    desc: 'Legacy Quality Assurance Division tasks, archive audit items, and historical punch list tasks.'
  },

  {
    index: 86,
    name: 'QAD Epic',
    key: 'QAD_EPIC',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'QAD-EPIC-',
    source: 'Image 2',
    desc: 'Quality assurance programmatic initiatives, certification audits, and factory acceptance test epics.'
  },

  {
    index: 87,
    name: 'Tasks',
    key: 'TSK',
    category: 'Tasks & Epics',
    type: 'TASK',
    prefix: 'TSK-',
    source: 'Image 1, Image 2',
    desc: 'General engineering work items, team action items, and technical debt resolution tickets.'
  },

  // ==========================================
  // Group 7: Changes & Releases (10)
  // ==========================================
  {
    index: 88,
    name: 'SW Change Requests',
    key: 'SWCR',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'SWCR-',
    source: 'Image 2',
    desc: 'Formal software change proposals, impact evaluations, regression risk ratings, and CCB approvals.'
  },
  {
    index: 89,
    name: 'Change Requests',
    key: 'CR',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'CR-',
    source: 'Image 1, Image 2',
    desc: 'Engineering Change Requests (ECR) spanning hardware, software, tooling, and manufacturing processes.'
  },
  {
    index: 90,
    name: 'SW Configuration Integration Tickets',
    key: 'SWCIT',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'SWCIT-',
    source: 'Image 2',
    desc: 'Software branch merge tickets, dependency updates, third-party library licenses, and release tagging.'
  },
  {
    index: 91,
    name: 'Components',
    key: 'CMP',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'CMP-',
    source: 'Image 2',
    desc: 'Hardware components, off-the-shelf LiDAR sensors, motor controllers, and battery packs.'
  },
  {
    index: 92,
    name: 'CM Report',
    key: 'CMR',
    category: 'Changes & Releases',
    type: 'DOCUMENT',
    prefix: 'CMR-',
    source: 'Image 2',
    desc: 'Configuration Management audit reports, BOM change history, and hardware revision serial tracking.'
  },
  {
    index: 93,
    name: 'Platforms',
    key: 'PLT',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'PLT-',
    source: 'Image 2',
    desc: 'Robot hardware base revisions, chassis revisions, compute modules (Jetson Orin vs Xavier), and wheel bases.'
  },
  {
    index: 94,
    name: 'HW Releases',
    key: 'HWR_REL',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'HWR-REL-',
    source: 'Image 2',
    desc: 'Hardware engineering release packages (Gerber files, assembly drawings, mechanical STEP files).'
  },
  {
    index: 95,
    name: 'Project Releases',
    key: 'PROJ_REL',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'PROJ-REL-',
    source: 'Image 2',
    desc: 'Master product delivery milestones, customer pilot releases, and commercial market rollouts.'
  },
  {
    index: 96,
    name: 'SW Releases',
    key: 'SWR_REL',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'SWR-REL-',
    source: 'Image 2',
    desc: 'Software firmware binaries, OTA docker containers, signed security keys, and release notes.'
  },
  {
    index: 97,
    name: 'System Releases',
    key: 'SYS_REL',
    category: 'Changes & Releases',
    type: 'RELEASE',
    prefix: 'SYS-REL-',
    source: 'Image 2',
    desc: 'Integrated system releases combining verified hardware revisions and qualified firmware images.'
  },

  // ==========================================
  // Group 8: Documents & Governance (4)
  // ==========================================
  {
    index: 98,
    name: 'Documents',
    key: 'DOC',
    category: 'Documents & Governance',
    type: 'DOCUMENT',
    prefix: 'DOC-',
    source: 'Image 2',
    desc: 'General project engineering documentation, specifications, contractual agreements, and whitepapers.'
  },
  {
    index: 99,
    name: 'Minutes of Meeting',
    key: 'MoM',
    category: 'Documents & Governance',
    type: 'DOCUMENT',
    prefix: 'MoM-',
    source: 'Image 1',
    desc: 'Official minutes of meetings: architecture syncs, customer design reviews, and change control boards.'
  },
  {
    index: 100,
    name: 'Contacts',
    key: 'CNT',
    category: 'Documents & Governance',
    type: 'DOCUMENT',
    prefix: 'CNT-',
    source: 'Image 4',
    desc: 'Project stakeholder directory, engineering leads, component suppliers, and customer representatives.'
  },
  {
    index: 101,
    name: 'Team',
    key: 'TEAM',
    category: 'Documents & Governance',
    type: 'DOCUMENT',
    prefix: 'TEAM-',
    source: 'Image 4',
    desc: 'Project staffing directory, engineering roles, safety manager designations, and RACI responsibilities.'
  }
];

// Lookup maps for exact canonical matching
export const CANONICAL_KEY_MAP = new Map<string, CanonicalCategory>();
export const CANONICAL_NAME_MAP = new Map<string, CanonicalCategory>();

// Core tracker keys mapped to standard canonical categories
CANONICAL_KEY_MAP.set('SYS-REQ', 'Requirements & Verification');
CANONICAL_KEY_MAP.set('SYSREQ', 'Requirements & Verification');
CANONICAL_KEY_MAP.set('SW-REQ', 'Requirements & Verification');
CANONICAL_KEY_MAP.set('SWREQ', 'Requirements & Verification');
CANONICAL_KEY_MAP.set('ARCH', 'Architecture & Hardware');
CANONICAL_KEY_MAP.set('SAD', 'Architecture & Hardware');
CANONICAL_KEY_MAP.set('RISK', 'Safety & Risks');
CANONICAL_KEY_MAP.set('SYS-TST', 'Testing, Sets & Runs');
CANONICAL_KEY_MAP.set('SYSTST', 'Testing, Sets & Runs');
CANONICAL_KEY_MAP.set('TST-SET', 'Testing, Sets & Runs');
CANONICAL_KEY_MAP.set('TSTSET', 'Testing, Sets & Runs');

export const CANONICAL_TRACKERS: TrackerTemplate[] = CORE_25_TRACKERS;

for (const ct of CANONICAL_TRACKERS) {
  CANONICAL_KEY_MAP.set(ct.key.toUpperCase(), ct.category);
  CANONICAL_NAME_MAP.set(cleanTrackerName(ct.name).toLowerCase(), ct.category);
}

/**
 * Migration Mapping Registry from the 101 legacy tracker prefixes to the 25 core trackers.
 */
export const MIGRATION_MAPPING: Record<string, { targetKey: string; targetPrefix: string; reason: string }> = {
  "IRS-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Internal stakeholder requirements and boundary constraints"
  },
  "CQR-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Customer and stakeholder quality requirements"
  },
  "CRSSW-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Customer-specified software requirements"
  },
  "CRSEMC-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Customer electromagnetic compatibility requirements"
  },
  "CRST-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Customer test and acceptance requirements"
  },
  "CRSENV-": {
    "targetKey": "STK-REQ",
    "targetPrefix": "STK-REQ-",
    "reason": "Customer environmental operating requirements"
  },
  "CRSREF-": {
    "targetKey": "DOC",
    "targetPrefix": "DOC-",
    "reason": "Customer reference specifications and documents"
  },
  "SRS-": {
    "targetKey": "SYS-REQ",
    "targetPrefix": "SYS-REQ-",
    "reason": "System requirement specification"
  },
  "PAR-": {
    "targetKey": "SYS-REQ",
    "targetPrefix": "SYS-REQ-",
    "reason": "System engineering parameters and constraints"
  },
  "SRV-": {
    "targetKey": "SYS-REQ",
    "targetPrefix": "SYS-REQ-",
    "reason": "System requirement verification specifications"
  },
  "SRV-OLD-": {
    "targetKey": "SYS-REQ",
    "targetPrefix": "SYS-REQ-",
    "reason": "Legacy system requirement verification records"
  },
  "HWR-": {
    "targetKey": "HW-REQ",
    "targetPrefix": "HW-REQ-",
    "reason": "Hardware-allocated engineering requirements"
  },
  "HSWR-": {
    "targetKey": "SW-REQ",
    "targetPrefix": "SW-REQ-",
    "reason": "Hardware-software interface requirements"
  },
  "SWR-": {
    "targetKey": "SW-REQ",
    "targetPrefix": "SW-REQ-",
    "reason": "Software requirements and ROS 2 behavior"
  },
  "SWCTL-": {
    "targetKey": "SW-REQ",
    "targetPrefix": "SW-REQ-",
    "reason": "Software control loop and motion requirements"
  },
  "SYS-STRAT-": {
    "targetKey": "SYS-STRAT",
    "targetPrefix": "SYS-STRAT-",
    "reason": "Systems engineering strategy and lifecycle governance"
  },
  "COM-": {
    "targetKey": "ICD",
    "targetPrefix": "ICD-",
    "reason": "Communication protocol and bus interfaces"
  },
  "DS-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Design specifications and subsystem engineering"
  },
  "FC-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Functional concepts and subsystem logic"
  },
  "SAD-": {
    "targetKey": "SAD",
    "targetPrefix": "SAD-",
    "reason": "System architecture and design models"
  },
  "TCI-": {
    "targetKey": "ICD",
    "targetPrefix": "ICD-",
    "reason": "Test control interfaces"
  },
  "HSI-": {
    "targetKey": "ICD",
    "targetPrefix": "ICD-",
    "reason": "Hardware-software interfaces"
  },
  "SYSD-": {
    "targetKey": "SAD",
    "targetPrefix": "SAD-",
    "reason": "System design and architectural decomposition"
  },
  "EMD-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Electromechanical subsystem design"
  },
  "MED-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Mechanical chassis and enclosure design"
  },
  "HWAD-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Hardware architecture detailed design"
  },
  "HWDD-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Hardware detailed schematics and PCBs"
  },
  "SWAD-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Software architecture design and nodes"
  },
  "SWDD-": {
    "targetKey": "SUBD",
    "targetPrefix": "SUBD-",
    "reason": "Software detailed design and modules"
  },
  "EMCTP-DV-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "EMC design verification test plans"
  },
  "EMCTR-DV-": {
    "targetKey": "TREP",
    "targetPrefix": "TREP-",
    "reason": "EMC design verification test reports"
  },
  "EMCTP-PV-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "EMC process verification test plans"
  },
  "EMVTR-PV-": {
    "targetKey": "TREP",
    "targetPrefix": "TREP-",
    "reason": "EMC process verification test reports"
  },
  "HWDV-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Hardware design verification test cases"
  },
  "HWTP-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Hardware test campaign plans"
  },
  "HWTR-": {
    "targetKey": "TREP",
    "targetPrefix": "TREP-",
    "reason": "Hardware test execution reports"
  },
  "HSITP-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Hardware-software integration test plans"
  },
  "DVP-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Design verification master plans"
  },
  "PVP-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Production validation master plans"
  },
  "SQTS-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Software quality test specifications"
  },
  "SIITS-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "System integration & interface test specs"
  },
  "MQTP-": {
    "targetKey": "VVP",
    "targetPrefix": "VVP-",
    "reason": "Manufacturing quality test plans"
  },
  "TEC-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Test execution cases"
  },
  "TCSQT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Software quality test cases"
  },
  "TCSIT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "System integration test cases"
  },
  "TCSUT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Subsystem unit test cases"
  },
  "TCHQT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Hardware quality test cases"
  },
  "TCIT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Integration test cases"
  },
  "REL-TST-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Release qualification test cases"
  },
  "TC-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Universal test cases"
  },
  "HWT-": {
    "targetKey": "TC",
    "targetPrefix": "TC-",
    "reason": "Hardware component test cases"
  },
  "TE-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Test environment configurations"
  },
  "TCSQT-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Software test configurations"
  },
  "TCSIT-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "System integration test configurations"
  },
  "TCSUT-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Subsystem test configurations"
  },
  "SQTC-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Software qualification test configs"
  },
  "TCHQT-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Hardware quality test configurations"
  },
  "TCIT-CFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Integration test configurations"
  },
  "TCFG-": {
    "targetKey": "TCFG",
    "targetPrefix": "TCFG-",
    "reason": "Test configurations"
  },
  "TE-SET-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Test execution sets"
  },
  "TSSQT-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Software quality test sets"
  },
  "TSSIT-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "System integration test sets"
  },
  "TSSUT-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Subsystem unit test sets"
  },
  "SQTS-SET-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Software qualification suites"
  },
  "SITS-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "System integration test suites"
  },
  "TSHQT-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Hardware qualification test sets"
  },
  "TSIT-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Integration test suites"
  },
  "TSET-": {
    "targetKey": "TSET",
    "targetPrefix": "TSET-",
    "reason": "Test sets"
  },
  "SQTR-": {
    "targetKey": "TRUN",
    "targetPrefix": "TRUN-",
    "reason": "Software qualification test runs"
  },
  "TR-": {
    "targetKey": "TRUN",
    "targetPrefix": "TRUN-",
    "reason": "Test execution runs"
  },
  "TRUN-": {
    "targetKey": "TRUN",
    "targetPrefix": "TRUN-",
    "reason": "Test runs"
  },
  "TREP-": {
    "targetKey": "TREP",
    "targetPrefix": "TREP-",
    "reason": "Test summary reports"
  },
  "RSWRS-": {
    "targetKey": "RISK",
    "targetPrefix": "RISK-",
    "reason": "Safety risk assessment and hazard log"
  },
  "QA-": {
    "targetKey": "QREQ",
    "targetPrefix": "QREQ-",
    "reason": "Quality assurance criteria and requirements"
  },
  "SafeP-": {
    "targetKey": "SAFE",
    "targetPrefix": "SAFE-",
    "reason": "Safety plan and ISO 13482 safety case"
  },
  "HWF-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Hardware defect reports"
  },
  "HWTF-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Hardware test failure records"
  },
  "SWB-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Software bug reports"
  },
  "PR-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Problem reports"
  },
  "PRO-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Product observation reports"
  },
  "DEF-": {
    "targetKey": "DEF",
    "targetPrefix": "DEF-",
    "reason": "Defects & problem reports"
  },
  "SYST-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "System engineering work packages"
  },
  "HWTK-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Hardware engineering tasks"
  },
  "SWTK-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Software development tasks"
  },
  "SWEPIC-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Software epics and capabilities"
  },
  "QAD-OLD-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Quality assurance action items"
  },
  "QAD-EPIC-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Quality assurance epics"
  },
  "TSK-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "General engineering tasks"
  },
  "HWTT-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Hardware testing tasks"
  },
  "SWTT-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Software testing tasks"
  },
  "SWTRV-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Software review tasks"
  },
  "STT-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "System test tasks"
  },
  "TASK-": {
    "targetKey": "TASK",
    "targetPrefix": "TASK-",
    "reason": "Engineering tasks & epics"
  },
  "SWCR-": {
    "targetKey": "CR",
    "targetPrefix": "CR-",
    "reason": "Software change requests"
  },
  "CR-": {
    "targetKey": "CR",
    "targetPrefix": "CR-",
    "reason": "Engineering change requests"
  },
  "SWCIT-": {
    "targetKey": "CR",
    "targetPrefix": "CR-",
    "reason": "Software continuous integration tasks/changes"
  },
  "CMP-": {
    "targetKey": "CMP",
    "targetPrefix": "CMP-",
    "reason": "Components & Bill of Materials"
  },
  "CMR-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Configuration management release baselines"
  },
  "PLT-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Platform release configurations"
  },
  "HWR-REL-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Hardware release baselines"
  },
  "PROJ-REL-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Project milestone releases"
  },
  "SWR-REL-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Software version releases"
  },
  "SYS-REL-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "System release baselines"
  },
  "REL-": {
    "targetKey": "REL",
    "targetPrefix": "REL-",
    "reason": "Configuration & releases"
  },
  "DOC-": {
    "targetKey": "DOC",
    "targetPrefix": "DOC-",
    "reason": "Controlled engineering documents"
  },
  "MoM-": {
    "targetKey": "MOM",
    "targetPrefix": "MOM-",
    "reason": "Minutes of meeting"
  },
  "MOM-": {
    "targetKey": "MOM",
    "targetPrefix": "MOM-",
    "reason": "Minutes of meeting"
  },
  "CNT-": {
    "targetKey": "DOC",
    "targetPrefix": "DOC-",
    "reason": "Project contact roster and stakeholder governance"
  },
  "TEAM-": {
    "targetKey": "DOC",
    "targetPrefix": "DOC-",
    "reason": "Engineering team organization and assignments"
  }
};

const CORE_KEY_MAP = new Map<string, CanonicalCategory>();
const CORE_NAME_MAP = new Map<string, CanonicalCategory>();

CORE_25_TRACKERS.forEach(t => {
  CORE_KEY_MAP.set(t.key.toUpperCase(), t.category);
  CORE_NAME_MAP.set(cleanTrackerName(t.name).toLowerCase(), t.category);
});

/**
 * Resolves a tracker to one of the 7 engineering groups or Custom Trackers.
 */
export function getTrackerCategory(t: { category?: string; type?: string; name?: string; key?: string }): CanonicalCategory {
  if (t.category === 'Custom Trackers') {
    return 'Custom Trackers';
  }

  // If already tagged with one of the 7 core groups
  if (t.category && (CORE_25_CATEGORIES as readonly string[]).includes(t.category as any)) {
    return t.category as CanonicalCategory;
  }

  const cleanName = cleanTrackerName(t.name || '').toLowerCase();
  const rawKey = (t.key || '').trim().toUpperCase();

  const matchByKey = CORE_KEY_MAP.get(rawKey);
  if (matchByKey) return matchByKey;

  const matchByName = CORE_NAME_MAP.get(cleanName);
  if (matchByName) return matchByName;

  // Check prefix in migration mapping
  const prefixMatch = Object.entries(MIGRATION_MAPPING).find(([pfx]) => rawKey.startsWith(pfx.replace('-', '')) || (t.key && t.key.includes(pfx.replace('-', ''))));
  if (prefixMatch) {
    const target = CORE_25_TRACKERS.find(c => c.key === prefixMatch[1].targetKey);
    if (target) return target.category;
  }

  // Fallback for legacy categories
  if (t.category && (CANONICAL_CATEGORIES as readonly string[]).includes(t.category)) {
    const cat = t.category;
    if (cat.includes('Requirements')) return 'Group 2: Requirements Engineering';
    if (cat.includes('Architecture')) return 'Group 3: Architecture, Design & Components';
    if (cat.includes('Testing')) return 'Group 5: Verification & Validation';
    if (cat.includes('Safety') || cat.includes('Risks')) return 'Group 4: Decisions, Safety & Quality';
    if (cat.includes('Defects')) return 'Group 6: Defect Management';
    if (cat.includes('Tasks')) return 'Group 7: Task & Change Management';
    if (cat.includes('Changes') || cat.includes('Releases')) return 'Group 7: Task & Change Management';
    if (cat.includes('Documents')) return 'Group 1: Project Governance';
  }

  return 'Custom Trackers';
}

/**
 * Resolves target core tracker template for a given legacy prefix or key.
 */
export function getCoreTrackerForLegacyPrefix(prefix: string): TrackerTemplate | undefined {
  const norm = prefix.endsWith('-') ? prefix : `${prefix}-`;
  const mapping = MIGRATION_MAPPING[norm];
  if (!mapping) return undefined;
  return CORE_25_TRACKERS.find(t => t.key === mapping.targetKey);
}

/**
 * Creates the complete set of 25 Consolidated Core Trackers for a project.
 * Guaranteed unique tracker IDs per project: `projectId * 1000 + template.index`
 */
export function createProjectTrackers(projectId: number, projectKey: string): Tracker[] {
  const upperKey = projectKey.toUpperCase().trim();
  return CORE_25_TRACKERS.map(template => {
    return {
      id: projectId * 1000 + template.index,
      project_id: projectId,
      key: template.key,
      name: template.name,
      category: template.category,
      type: template.type,
      prefix: `${upperKey}-${template.prefix}`,
      object_count: 0,
      enable_test_steps: template.enable_test_steps || false,
      enable_folders: true,
      description: template.desc
    };
  });
}
