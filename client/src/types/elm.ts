export type UserRole = 'DEMO' | 'USER' | 'ADMIN_OWNER';
export type Role = 'ADMIN' | 'SYSTEMS_ENGINEER' | 'SOFTWARE_ENGINEER' | 'HARDWARE_ENGINEER' | 'TESTER' | 'REVIEWER' | 'VIEWER';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  engineering_role?: Role;
  avatar_url?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  assigned_project_ids: number[];
  created_at?: string;
}

export interface TrackerRequest {
  id: number;
  user_id: number;
  user_name: string;
  project_id: number;
  project_name: string;
  requested_name: string;
  requested_key: string;
  type: string;
  enable_test_steps: boolean;
  enable_folders: boolean;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface ProjectRequest {
  id: number;
  user_id: number;
  user_name: string;
  requested_name: string;
  key: string;
  description?: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string;
}

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

export interface Folder {
  id: number;
  tracker_id: number;
  parent_id: number | null;
  name: string;
  position: number;
}

export type RequirementType = 'Functional Requirement' | 'Non-Functional Requirement' | 'Variable' | 'Parameter' | 'Folder';

export type SafetyLevel =
  | 'Safety-Related'
  | 'Non-Safety-Related'
  | 'Safety Relevance Under Assessment'
  // Backward compatibility aliases
  | 'ASIL-D' | 'ASIL-C' | 'ASIL-B' | 'ASIL-A' | 'SIL-3' | 'SIL-2' | 'SIL-1' | 'Standard / Non-Safety';

export const CONTROLLED_SAFETY_LEVELS = [
  'Safety-Related',
  'Non-Safety-Related',
  'Safety Relevance Under Assessment'
] as const;

export type ControlledSafetyLevel = typeof CONTROLLED_SAFETY_LEVELS[number];

export const SAFETY_FRAMEWORKS = [
  'ISO 13482 (Service Robots)',
  'ISO 13849-1 (PL a-e)',
  'IEC 62061 (SIL 1-3)',
  'ISO 26262 (ASIL A-D)',
  'IEC 61508 (Functional Safety)',
  'UL 3100 (AGV / AMR Safety)',
  'Not Applicable'
] as const;

export type TestSubProcess = 'Black-Box Testing' | 'Grey-Box Testing' | 'White-Box Testing' | 'Unit Testing' | 'Integration Testing' | 'SW Testing' | 'System Testing' | 'HIL Testing' | 'Field Testing';

export interface EngineeringObject {
  id: number;
  tracker_id: number;
  tracker_name?: string;
  folder_id: number | null;
  folder_name?: string | null;
  object_key: string;
  title: string;
  description: string;
  type: string;
  requirement_type?: RequirementType;
  safety_level?: SafetyLevel;
  safety_framework?: string;
  safety_justification?: string;
  requirement_statement?: string;
  acceptance_criteria?: string;
  verification_method?: 'Inspection' | 'Analysis' | 'Demonstration' | 'Test';
  verification_status?: 'Not Defined' | 'Not Covered' | 'Partially Covered' | 'Covered' | 'Verified' | 'Failed Verification';
  preconditions?: string;
  post_actions?: string;
  test_level?: string;
  test_domain?: string;
  hardware_domain?: string;
  software_domain?: string;
  architecture_level?: string;
  interface_type?: string;
  source_subsystem?: string;
  destination_subsystem?: string;
  part_number?: string;
  manufacturer?: string;
  supplier?: string;
  unit_cost?: number;
  currency?: string;
  quantity?: number;
  hazard?: string;
  severity?: string;
  probability?: string;
  risk_level?: string;
  residual_severity?: string;
  residual_probability?: string;
  residual_risk_level?: string;
  impact_assessment?: Record<string, any>;
  release_version?: string;
  configuration_ref?: string;
  legacy_tracker_key?: string;
  legacy_object_key?: string;
  test_subprocess?: TestSubProcess;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner_id: number;
  owner_name?: string;
  created_by_name?: string;
  pre_action?: string;
  post_action?: string;
  start_date?: string;
  end_date?: string;
  planned_effort?: string;
  spent_effort?: string;
  category?: string;
  resolution?: string;
  release?: string;
  custom_columns?: CustomColumn[];
  revisions?: ObjectRevision[];
  version: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomColumn {
  id: string;
  name: string;
  type: 'TEXT' | 'FILES' | 'IMAGES' | 'TABLE' | 'LINK';
  position_reference: 'TITLE' | 'PRE_ACTION' | 'DESCRIPTION' | 'TEST_STEPS' | 'POST_ACTION';
  placement: 'ABOVE' | 'BELOW';
  content?: any;
}

export interface ObjectRevision {
  version: number;
  saved_at: string;
  saved_by?: string;
  title: string;
  description?: string;
  pre_action?: string;
  post_action?: string;
  status?: string;
  safety_level?: SafetyLevel;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner_name?: string;
  category?: string;
  release?: string;
  start_date?: string;
  end_date?: string;
  planned_effort?: string;
  spent_effort?: string;
  resolution?: string;
  custom_columns?: CustomColumn[];
  test_steps?: TestStep[];
  change_summary?: string;
}

export interface ObjectVersion {
  id: number;
  object_id: number;
  version: number;
  title: string;
  description: string;
  status: string;
  metadata: Record<string, any>;
  changed_fields: string[];
  change_reason: string;
  author_name?: string;
  created_at: string;
}

export interface TestStep {
  id: number;
  test_case_id: number;
  step_number: number;
  action: string;
  expected_result: string;
  stimulus?: string;
  actual_result?: string;
  verdict?: 'NOT_RUN' | 'PASS' | 'FAIL' | 'BLOCKED';
  measurement?: string;
  evidence_url?: string;
  comments?: string;
}

export interface TestConfig {
  id: number;
  project_id: number;
  name: string;
  software_version: string;
  firmware_version: string;
  hardware_revision: string;
  sensor_config: string;
  parameter_config: string;
  battery_config: string;
  environment_config: string;
  revision?: number;
}

export interface TestRun {
  id: number;
  project_id: number;
  test_set_id: number;
  test_config_id: number;
  name: string;
  overall_status: 'NOT_RUN' | 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'BLOCKED' | 'INCONCLUSIVE';
  tester_name?: string;
  test_set_key?: string;
  test_set_title?: string;
  config_name?: string;
  software_version?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  evidence_summary?: string;
  failure_description?: string;
}

export interface TestRunResult {
  id: number;
  test_run_id: number;
  test_case_id: number;
  case_key?: string;
  case_title?: string;
  priority?: string;
  status: 'NOT_RUN' | 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'BLOCKED' | 'INCONCLUSIVE';
  notes?: string;
  steps?: TestStepResult[];
}

export interface TestStepResult {
  id: number;
  test_run_result_id: number;
  test_step_id: number;
  step_number?: number;
  action?: string;
  expected_result?: string;
  status: 'NOT_RUN' | 'PASS' | 'FAIL' | 'BLOCKED';
  actual_result?: string;
  notes?: string;
}

export type RelationshipType =
  | 'DERIVES_FROM'
  | 'REFINES'
  | 'DECOMPOSES_INTO'
  | 'ALLOCATED_TO'
  | 'IMPLEMENTED_BY'
  | 'REALIZED_BY'
  | 'INTERFACES_WITH'
  | 'DEPENDS_ON'
  | 'USES_COMPONENT'
  | 'MITIGATES'
  | 'VERIFIES'
  | 'VALIDATES'
  | 'TESTED_BY'
  | 'EXECUTED_IN'
  | 'REPORTED_BY'
  | 'FOUND_IN'
  | 'CORRECTED_BY'
  | 'CHANGED_BY'
  | 'SUPERSEDES'
  | 'INCLUDED_IN'
  | 'APPROVED_BY'
  | 'DOCUMENTS'
  | 'RELATED_TO'
  // Legacy aliases
  | 'VERIFIED_BY'
  | 'MITIGATED_BY'
  | 'DERIVED_TO'
  | 'EXECUTED_AS'
  | 'EXECUTED_FROM'
  | 'USES_CONFIG'
  | 'PRODUCES_RESULT';

export interface Relationship {
  id: number;
  source_id: number;
  target_id: number;
  source_key?: string;
  source_title?: string;
  source_type?: string;
  target_key?: string;
  target_title?: string;
  target_type?: string;
  relationship_type: RelationshipType;
  description?: string;
  created_at?: string;
  created_by?: string;
}

export interface ChangeRequest {
  id: number;
  project_id: number;
  cr_key: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'IMPLEMENTED' | 'VERIFIED' | 'REJECTED';
  priority: string;
  author_name?: string;
  item_count?: number;
  created_at: string;
}

export interface Baseline {
  id: number;
  project_id: number;
  name: string;
  version_tag: string;
  description: string;
  author_name?: string;
  item_count?: number;
  created_at: string;
  items?: BaselineItem[];
}

export interface BaselineItem {
  id: number;
  baseline_id: number;
  object_id: number;
  object_key: string;
  title: string;
  type: string;
  status: string;
  snapshot_version: number;
}

export interface Artifact {
  id: number;
  project_id?: number;
  object_id?: number;
  filename: string;
  file_name?: string;
  stored_path?: string;
  file_size: number;
  mime_type: string;
  category: 'CAD' | 'ROS_BAG' | 'LOG' | 'CSV' | 'PDF' | 'IMAGE' | 'OTHER';
  uploader_name?: string;
  object_key?: string;
  object_title?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: Record<string, any>;
  created_at: string;
}
