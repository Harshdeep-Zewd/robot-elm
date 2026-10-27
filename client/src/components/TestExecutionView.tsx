import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertOctagon, HelpCircle, Plus, Activity, Layers, User, Settings, Check, X, ChevronDown, ChevronUp, ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { TestRun, Project, Tracker, EngineeringObject, TestStep, Relationship, User as UserType } from '../types/elm';
import { createNewTabHandlers } from '../utils/tabOpener';

interface TestExecutionViewProps {
  currentUser?: UserType | null;
  activeProject?: Project | null;
  currentTrackers?: Tracker[];
  allObjects?: EngineeringObject[];
  testSteps?: TestStep[];
  relationships?: Relationship[];
  testRuns?: TestRun[];
  testRunDetailsMap?: Record<number, any>;
  onUpdateTestRuns?: React.Dispatch<React.SetStateAction<TestRun[]>>;
  onUpdateRunDetailsMap?: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  onBack?: () => void;
  onBackToSQTR?: () => void;
  onNavigateView?: (view: any) => void;
  selectedRunIdProp?: number | null;
  onSelectRunIdProp?: (id: number | null) => void;
  onSaveResults?: (runId: number, status: string, detail: any) => void;
}

export const TestExecutionView: React.FC<TestExecutionViewProps> = ({
  currentUser,
  activeProject,
  currentTrackers = [],
  allObjects = [],
  testSteps = [],
  relationships = [],
  testRuns = [],
  testRunDetailsMap = {},
  onUpdateTestRuns,
  onUpdateRunDetailsMap,
  onBack,
  onBackToSQTR,
  onNavigateView,
  selectedRunIdProp,
  onSelectRunIdProp,
  onSaveResults
}) => {
  // Filter objects and runs strictly for the current active project
  const currentTrackerIds = currentTrackers.map(t => t.id);

  const availableTestSets = allObjects.filter(o => o.type === 'TEST_SET' && currentTrackerIds.includes(o.tracker_id));
  const availableTestCases = allObjects.filter(o => o.type === 'TEST_CASE' && currentTrackerIds.includes(o.tracker_id));
  const projectRuns = testRuns.filter(r => r.project_id === activeProject?.id);

  const [selectedRunId, setSelectedRunId] = useState<number | null>(() => {
    return projectRuns.length > 0 ? projectRuns[0].id : null;
  });
  
  // New Test Run Modal State
  const [showModal, setShowModal] = useState(false);
  const [newRunName, setNewRunName] = useState('');
  const [selectedTestSetId, setSelectedTestSetId] = useState<number | null>(null);
  const [testerName, setTesterName] = useState(currentUser?.name || 'Zewd');
  const [configName, setConfigName] = useState(`${activeProject?.key || 'PROJ'} Hardware Config Rev 1`);
  const [swVersion, setSwVersion] = useState('v1.0.0-release');

  // Save Execution Results State
  const [saveState, setSaveState] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Test Case Dropdown & Expansion State
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<number>>(new Set());
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('ALL');

  const toggleCaseExpanded = (caseId: number) => {
    setExpandedCaseIds(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (activeRunDetail?.caseResults) {
      setExpandedCaseIds(new Set(activeRunDetail.caseResults.map((c: any) => c.id)));
    }
  };

  const handleCollapseAll = () => {
    setExpandedCaseIds(new Set());
  };

  // Reset dropdown filters and expansion when changing selected run
  useEffect(() => {
    setSelectedCaseFilter('ALL');
    setExpandedCaseIds(new Set());
  }, [selectedRunId]);

  // Sync selected run ID when project, runs, or active selection changes
  useEffect(() => {
    if (selectedRunIdProp) {
      setSelectedRunId(selectedRunIdProp);
      return;
    }
    const pRuns = testRuns.filter(r => r.project_id === activeProject?.id);
    if (pRuns.length > 0) {
      if (!selectedRunId || !pRuns.some(r => r.id === selectedRunId)) {
        setSelectedRunId(pRuns[0].id);
      }
    } else {
      setSelectedRunId(null);
    }
  }, [testRuns, activeProject?.id, selectedRunId, selectedRunIdProp]);

  // Dynamically build detail if a run exists but has no entry in map
  useEffect(() => {
    if (selectedRunId && !testRunDetailsMap[selectedRunId]) {
      buildMockRunDetail(selectedRunId);
    }
  }, [selectedRunId, testRunDetailsMap]);

  const buildMockRunDetail = (runId: number) => {
    const targetRun = testRuns.find(r => r.id === runId);
    
    // Find test cases included in the test set via relationships or default
    let includedCases = availableTestCases;
    if (targetRun?.test_set_id) {
      const relCases = relationships
        .filter(r => r.target_id === targetRun.test_set_id && r.relationship_type === 'INCLUDED_IN')
        .map(r => allObjects.find(o => o.id === r.source_id))
        .filter(Boolean) as EngineeringObject[];
      if (relCases.length > 0) includedCases = relCases;
    }

    const caseResults = includedCases.map(tc => {
      const tcSteps = testSteps.filter(s => s.test_case_id === tc.id);
      return {
        id: Date.now() + tc.id,
        test_run_id: runId,
        test_case_id: tc.id,
        case_key: tc.object_key,
        case_title: tc.title,
        status: 'PASS',
        steps: tcSteps.length > 0 ? tcSteps.map(s => ({
          id: s.id * 100 + runId,
          test_run_result_id: Date.now() + tc.id,
          test_step_id: s.id,
          step_number: s.step_number,
          action: s.action,
          expected_result: s.expected_result,
          status: 'PASS',
          actual_result: 'Verified output matching expected result.'
        })) : [
          {
            id: Date.now() + 500,
            test_run_result_id: Date.now() + tc.id,
            test_step_id: 1,
            step_number: 1,
            action: `Execute verification procedure for ${tc.title}`,
            expected_result: `System operates in compliance with ${tc.object_key}`,
            status: 'PASS',
            actual_result: 'Verified output matching specification.'
          }
        ]
      };
    });

    const detailObj = {
      id: runId,
      name: targetRun?.name || `Test Run #${runId}`,
      test_set_key: targetRun?.test_set_key || (availableTestSets[0]?.object_key || 'TST-SET-001'),
      test_set_title: targetRun?.test_set_title || (availableTestSets[0]?.title || 'System Test Set'),
      config_name: targetRun?.config_name || `${activeProject?.key || 'PROJ'} Configuration`,
      software_version: targetRun?.software_version || 'v1.0.0',
      tester_name: targetRun?.tester_name || currentUser?.name || 'Zewd',
      overall_status: targetRun?.overall_status || 'PASS',
      caseResults
    };

    if (onUpdateRunDetailsMap) {
      onUpdateRunDetailsMap(prev => ({ ...prev, [runId]: detailObj }));
    }
  };

  const handleOpenCreateModal = () => {
    setNewRunName(`${activeProject?.key || 'PROJ'} Test Run #${projectRuns.length + 1}`);
    setSelectedTestSetId(availableTestSets[0]?.id || null);
    setConfigName(`${activeProject?.key || 'PROJ'} Main Hardware Configuration`);
    setSwVersion('v1.0.0-rc1');
    setTesterName(currentUser?.name || 'Zewd');
    setShowModal(true);
  };

  const handleCreateTestRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunName.trim()) return;

    const selectedSet = availableTestSets.find(s => s.id === selectedTestSetId) || availableTestSets[0];
    const newRunId = Date.now();

    const newRun: TestRun = {
      id: newRunId,
      project_id: activeProject?.id || 1,
      test_set_id: selectedSet?.id || 1,
      test_config_id: 1,
      name: newRunName.trim(),
      overall_status: 'IN_PROGRESS',
      tester_name: testerName.trim() || currentUser?.name || 'Zewd',
      test_set_key: selectedSet?.object_key || `${activeProject?.key || 'SET'}-001`,
      test_set_title: selectedSet?.title || `${activeProject?.name || 'Project'} Test Suite`,
      config_name: configName.trim(),
      software_version: swVersion.trim(),
      started_at: new Date().toISOString()
    };

    // Find test cases included in selected Test Set
    let includedCases = availableTestCases;
    if (selectedSet) {
      const relCases = relationships
        .filter(r => r.target_id === selectedSet.id && r.relationship_type === 'INCLUDED_IN')
        .map(r => allObjects.find(o => o.id === r.source_id))
        .filter(Boolean) as EngineeringObject[];
      if (relCases.length > 0) includedCases = relCases;
    }

    const caseResults = includedCases.map(tc => {
      const tcSteps = testSteps.filter(s => s.test_case_id === tc.id);
      return {
        id: Date.now() + tc.id,
        test_run_id: newRunId,
        test_case_id: tc.id,
        case_key: tc.object_key,
        case_title: tc.title,
        status: 'NOT_RUN',
        steps: tcSteps.length > 0 ? tcSteps.map(s => ({
          id: s.id * 100 + newRunId,
          test_run_result_id: Date.now() + tc.id,
          test_step_id: s.id,
          step_number: s.step_number,
          action: s.action,
          expected_result: s.expected_result,
          status: 'NOT_RUN',
          actual_result: ''
        })) : [
          {
            id: Date.now() + 500,
            test_run_result_id: Date.now() + tc.id,
            test_step_id: 1,
            step_number: 1,
            action: `Execute test verification procedure for ${tc.title}`,
            expected_result: `System operates in compliance with ${tc.object_key} specification`,
            status: 'NOT_RUN',
            actual_result: ''
          }
        ]
      };
    });

    const detailObj = {
      id: newRunId,
      name: newRun.name,
      test_set_key: newRun.test_set_key,
      test_set_title: newRun.test_set_title,
      config_name: newRun.config_name,
      software_version: newRun.software_version,
      tester_name: newRun.tester_name,
      overall_status: 'NOT_RUN',
      caseResults
    };

    if (onUpdateTestRuns) {
      onUpdateTestRuns(prev => [newRun, ...prev]);
    }
    if (onUpdateRunDetailsMap) {
      onUpdateRunDetailsMap(prev => ({ ...prev, [newRunId]: detailObj }));
    }
    setSelectedRunId(newRunId);
    setShowModal(false);
  };

  const handleUpdateStepStatus = (
    stepId: number,
    caseId: number,
    newStatus: 'PASS' | 'FAIL' | 'BLOCKED',
    actualNote?: string
  ) => {
    if (!selectedRunId) return;

    const currentDetail = testRunDetailsMap[selectedRunId];
    if (!currentDetail) return;

    const updatedCaseResults = currentDetail.caseResults.map((cr: any) => {
      if (cr.id === caseId) {
        const updatedSteps = cr.steps.map((st: any) => {
          if (st.id === stepId) {
            return {
              ...st,
              status: newStatus,
              actual_result: actualNote !== undefined ? actualNote : (st.actual_result || (newStatus === 'PASS' ? 'Step executed successfully.' : newStatus === 'FAIL' ? 'Observed failure during step.' : 'Step blocked.'))
            };
          }
          return st;
        });

        // Recalculate case status
        let newCaseStatus = 'PASS';
        if (updatedSteps.some((s: any) => s.status === 'FAIL')) newCaseStatus = 'FAIL';
        else if (updatedSteps.some((s: any) => s.status === 'BLOCKED')) newCaseStatus = 'BLOCKED';
        else if (updatedSteps.some((s: any) => s.status === 'NOT_RUN')) newCaseStatus = 'IN_PROGRESS';

        return {
          ...cr,
          status: newCaseStatus,
          steps: updatedSteps
        };
      }
      return cr;
    });

    // Recalculate overall run status
    let newOverallStatus = 'PASS';
    if (updatedCaseResults.some((c: any) => c.status === 'FAIL')) newOverallStatus = 'FAIL';
    else if (updatedCaseResults.some((c: any) => c.status === 'BLOCKED')) newOverallStatus = 'BLOCKED';
    else if (updatedCaseResults.some((c: any) => c.status === 'IN_PROGRESS' || c.status === 'NOT_RUN')) newOverallStatus = 'IN_PROGRESS';

    const updatedDetail = {
      ...currentDetail,
      overall_status: newOverallStatus,
      caseResults: updatedCaseResults
    };

    if (onUpdateRunDetailsMap) {
      onUpdateRunDetailsMap(prev => ({ ...prev, [selectedRunId]: updatedDetail }));
    }
    if (onUpdateTestRuns) {
      onUpdateTestRuns(prev => prev.map(r => r.id === selectedRunId ? { ...r, overall_status: newOverallStatus as any } : r));
    }
    if (onSaveResults) {
      onSaveResults(selectedRunId, newOverallStatus, updatedDetail);
    }
  };

  const handleSaveResults = () => {
    if (!selectedRunId || !activeRunDetail) return;
    setSaveState('SAVING');

    const statusToSave = activeRunDetail.overall_status || 'PASS';

    // 1. Update Test Runs
    if (onUpdateTestRuns) {
      onUpdateTestRuns(prev => prev.map(r => r.id === selectedRunId ? { ...r, overall_status: statusToSave as any } : r));
    }

    // 2. Update Details Map
    if (onUpdateRunDetailsMap) {
      onUpdateRunDetailsMap(prev => ({ ...prev, [selectedRunId]: activeRunDetail }));
    }

    // 3. Update SQTR Tracker Object (The Yellow Box in SQTR Dashboard!)
    if (onSaveResults) {
      onSaveResults(selectedRunId, statusToSave, activeRunDetail);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedAt(timeStr);
    setSaveState('SAVED');
    setShowToast(true);

    setTimeout(() => {
      setSaveState('IDLE');
    }, 3500);

    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  const activeRunDetail = selectedRunId ? testRunDetailsMap[selectedRunId] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
      {/* Top Navigation & Breadcrumb Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back to Test Runs Tracker Button */}
          {onBackToSQTR ? (
            <button
              type="button"
              onClick={onBackToSQTR}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.15s ease'
              }}
              title="Return to System Qualification Test Runs Dashboard"
            >
              <ArrowLeft size={15} />
              <span>← Back to Test Runs Tracker</span>
            </button>
          ) : onNavigateView ? (
            <button
              type="button"
              onClick={() => onNavigateView('TRACKER')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: '6px'
              }}
            >
              <ArrowLeft size={15} />
              <span>← Back to Trackers</span>
            </button>
          ) : null}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '7px 12px',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Back to Project Dashboard"
            >
              <span>Dashboard</span>
            </button>
          )}

          <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Test Execution Console
            </span>
            {activeRunDetail && (
              <>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {activeRunDetail.name}
                </span>
              </>
            )}
          </div>
        </div>

        {activeRunDetail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overall Status:</span>
            <span className={`badge badge-${(activeRunDetail.overall_status || 'PASS').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              {activeRunDetail.overall_status || 'PASS'}
            </span>

            {/* Prominent Save Execution Results Button */}
            <button
              type="button"
              onClick={handleSaveResults}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: saveState === 'SAVED' ? '#10b981' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: saveState === 'SAVED' ? '0 2px 10px rgba(16, 185, 129, 0.45)' : '0 2px 10px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="Save execution results and update the status in the System Qualification Test Runs Dashboard (Yellow Box)"
            >
              {saveState === 'SAVED' ? <Check size={15} /> : <Save size={15} />}
              <span>{saveState === 'SAVED' ? 'Results Saved ✓' : 'Save Results'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Step Execution Interface - Focused solely on the active test run (Yellow Box) */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--bg-dark)' }}>
        {activeRunDetail ? (
          <div>
            {/* Header info card */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{activeRunDetail.name}</h2>
                    <span className={`badge badge-${(activeRunDetail.overall_status || 'PASS').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.85rem' }}>
                      {activeRunDetail.overall_status || 'PASS'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>Target Test Set:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }} className="mono">{activeRunDetail.test_set_key}</span>
                    <span>• {activeRunDetail.test_set_title}</span>
                  </div>

                  {/* Quick Save Option in Header Card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSaveResults}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: saveState === 'SAVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.12)',
                        border: `1px solid ${saveState === 'SAVED' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.35)'}`,
                        color: saveState === 'SAVED' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {saveState === 'SAVED' ? <Check size={14} /> : <Save size={14} />}
                      <span>{saveState === 'SAVED' ? 'Saved to SQTR Dashboard ✓' : 'Save Execution Results'}</span>
                    </button>

                    {lastSavedAt && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Last saved: <strong style={{ color: 'var(--text-main)' }}>{lastSavedAt}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', backgroundColor: 'var(--bg-dark)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Build Under Test</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>{activeRunDetail.config_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }} className="mono">{activeRunDetail.software_version}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Executed by: <strong>{activeRunDetail.tester_name}</strong></div>
                </div>
              </div>
            </div>

            {/* Test Cases List Header & Quick Filter Dropdown */}
            {activeRunDetail.caseResults?.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap',
                backgroundColor: 'var(--bg-card)',
                padding: '12px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Test Cases ({activeRunDetail.caseResults.length})
                  </span>

                  {/* Dropdown selector for test cases */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Filter / Select:
                    </label>
                    <select
                      value={selectedCaseFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCaseFilter(val);
                        if (val !== 'ALL') {
                          setExpandedCaseIds(new Set([Number(val)]));
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Test Cases ({activeRunDetail.caseResults.length})</option>
                      {activeRunDetail.caseResults.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          [{c.case_key}] {c.case_title} ({c.status || 'NOT_RUN'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer'
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            )}

            {/* Test Case Execution Cards with Dropdown Accordion */}
            {activeRunDetail.caseResults?.length > 0 ? (
              (selectedCaseFilter === 'ALL'
                ? activeRunDetail.caseResults
                : activeRunDetail.caseResults.filter((c: any) => String(c.id) === selectedCaseFilter)
              ).map((cr: any) => {
                const isExpanded = expandedCaseIds.has(cr.id);
                const caseTabHandlers = createNewTabHandlers({
                  view: 'TRACKER',
                  objectKey: cr.case_key,
                  label: `[${cr.case_key}] ${cr.case_title}`
                });

                return (
                  <div
                    key={cr.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: `1px solid ${isExpanded ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      marginBottom: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                      boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.25)' : 'none'
                    }}
                  >
                    {/* Clickable Header Dropdown Bar */}
                    <div
                      onClick={() => toggleCaseExpanded(cr.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                        borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                        userSelect: 'none',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            backgroundColor: isExpanded ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isExpanded ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ChevronDown
                            size={16}
                            style={{
                              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </div>

                        <div
                          {...caseTabHandlers}
                          title={`[${cr.case_key}] ${cr.case_title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                        >
                          <span
                            className="mono"
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 800,
                              color: 'var(--accent-cyan)',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              marginRight: '10px'
                            }}
                          >
                            {cr.case_key}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'inline', color: 'var(--text-main)' }}>
                            {cr.case_title}
                          </h3>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              backgroundColor: 'var(--bg-dark)',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              marginLeft: '10px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {cr.steps?.length || 0} {cr.steps?.length === 1 ? 'Step' : 'Steps'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge badge-${(cr.status || 'NOT_RUN').toLowerCase().replace(/_/g, '-')}`}>
                          {cr.status || 'NOT_RUN'}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            backgroundColor: isExpanded ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-dark)',
                            border: `1px solid ${isExpanded ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                            color: isExpanded ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{isExpanded ? 'Hide Steps' : 'View Steps'}</span>
                          <ChevronDown
                            size={13}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dropped-down Steps with PASS, FAIL, BLOCKED controls */}
                    {isExpanded && (
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        {cr.steps?.map((step: any) => (
                          <div key={step.id} style={{ backgroundColor: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                Procedure Step #{step.step_number}
                              </span>

                              {/* Interactive Step Pass / Fail / Blocked Controls */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStepStatus(step.id, cr.id, 'PASS')}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: step.status === 'PASS' ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.15)',
                                    color: step.status === 'PASS' ? '#000' : 'var(--accent-emerald)',
                                    border: `1px solid ${step.status === 'PASS' ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.4)'}`,
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                  <span>PASS</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateStepStatus(step.id, cr.id, 'FAIL')}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: step.status === 'FAIL' ? 'var(--accent-rose)' : 'rgba(239, 68, 68, 0.15)',
                                    color: step.status === 'FAIL' ? '#fff' : 'var(--accent-rose)',
                                    border: `1px solid ${step.status === 'FAIL' ? 'var(--accent-rose)' : 'rgba(239, 68, 68, 0.4)'}`,
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <XCircle size={14} />
                                  <span>FAIL</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateStepStatus(step.id, cr.id, 'BLOCKED')}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: step.status === 'BLOCKED' ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.15)',
                                    color: step.status === 'BLOCKED' ? '#000' : 'var(--accent-amber)',
                                    border: `1px solid ${step.status === 'BLOCKED' ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.4)'}`,
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <AlertOctagon size={14} />
                                  <span>BLOCKED</span>
                                </button>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                              <strong>Action:</strong> {step.action}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                              <strong>Expected Result:</strong> {step.expected_result}
                            </div>

                            {/* Actual Result Telemetry / Notes */}
                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Recorded Telemetry / Actual Result Output:
                              </label>
                              <input
                                type="text"
                                value={step.actual_result || ''}
                                onChange={(e) => handleUpdateStepStatus(step.id, cr.id, step.status === 'NOT_RUN' ? 'PASS' : step.status, e.target.value)}
                                placeholder="Enter measured output, logs, or verification notes..."
                                style={{ width: '100%', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                No test cases registered for this test run.
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Workspace Project: {activeProject?.name || 'Current Project'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              No Test Execution Runs exist in this project yet.
            </p>
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              <span>Create First Test Run for {activeProject?.key || 'Project'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification when results are saved */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(16, 185, 129, 0.6)',
          padding: '14px 22px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000
        }}>
          <CheckCircle2 size={22} color="var(--accent-emerald)" />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Execution Results Saved!
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Status updated to <strong style={{ color: activeRunDetail?.overall_status === 'PASS' ? 'var(--accent-emerald)' : activeRunDetail?.overall_status === 'FAIL' ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{activeRunDetail?.overall_status}</strong> in System Qualification Test Runs Dashboard.
            </div>
          </div>
        </div>
      )}

      {/* New Test Run Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '480px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', color: 'var(--accent-cyan)' }}>
              Create New Test Execution Run
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Project: <strong>[{activeProject?.key}] {activeProject?.name}</strong>
            </p>

            <form onSubmit={handleCreateTestRunSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Test Run Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. Qualification Run #1"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Select Target Test Set *
                </label>
                <select
                  value={selectedTestSetId || ''}
                  onChange={(e) => setSelectedTestSetId(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  {availableTestSets.length > 0 ? (
                    availableTestSets.map(ts => (
                      <option key={ts.id} value={ts.id}>
                        [{ts.object_key}] {ts.title}
                      </option>
                    ))
                  ) : (
                    <option value={0}>No Test Sets found in this project - Sample Suite will be created</option>
                  )}
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Loads test cases registered inside this test set for {activeProject?.key}.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Build Under Test / Configuration
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. Main Hardware Revision 1"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Software / Firmware Version
                </label>
                <input
                  type="text"
                  value={swVersion}
                  onChange={(e) => setSwVersion(e.target.value)}
                  style={{ width: '100%' }}
                  className="mono"
                  placeholder="e.g. v1.0.0-rc1"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Tester Name
                </label>
                <input
                  type="text"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. Zewd"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Create & Launch Test Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
