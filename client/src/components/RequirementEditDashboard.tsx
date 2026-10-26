import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Save, X, Plus, ListOrdered, CheckCircle2, ShieldAlert,
  Clock, User, FileText, Link as LinkIcon, Paperclip, Bold, Italic,
  Underline, List, Table, Image as ImageIcon, Code, Check, ChevronDown,
  Layers, ExternalLink, AlertCircle, Play
} from 'lucide-react';
import {
  EngineeringObject, Tracker, Folder as FolderType, Relationship,
  TestStep, Artifact, SafetyLevel, RequirementType, TestSubProcess,
  CustomColumn, ObjectRevision
} from '../types/elm';
import { cleanTrackerName } from '../data/canonicalTrackers';
import { CustomColumnCard } from './CustomColumnCard';

interface RequirementEditDashboardProps {
  object: EngineeringObject;
  tracker: Tracker;
  allObjects: EngineeringObject[];
  folders: FolderType[];
  relationships: Relationship[];
  testSteps?: TestStep[];
  artifacts?: Artifact[];
  onUpdateObject: (id: number, updates: Partial<EngineeringObject>) => void;
  onAddTestStep?: (test_case_id: number, action: string, expected_result: string) => void;
  onDeleteTestStep?: (id: number) => void;
  onAddRelationship?: (source_id: number, target_id: number, type: string) => void;
  onDeleteRelationship?: (id: number) => void;
  onCreateTestRun?: (testSet: EngineeringObject) => void;
  onDone: () => void;
}

export const RequirementEditDashboard: React.FC<RequirementEditDashboardProps> = ({
  object,
  tracker,
  allObjects,
  folders,
  relationships,
  testSteps = [],
  artifacts = [],
  onUpdateObject,
  onAddTestStep,
  onDeleteTestStep,
  onAddRelationship,
  onDeleteRelationship,
  onCreateTestRun,
  onDone
}) => {
  // View mode tab: [All] | [Required] | [Editable]
  const [viewTab, setViewTab] = useState<'ALL' | 'REQUIRED' | 'EDITABLE'>('ALL');

  // ══════════════════════════════════════════════════════════════════
  // REVISION HISTORY STATE (Point 1: Revision dropdown selector)
  // ══════════════════════════════════════════════════════════════════
  const [selectedVersion, setSelectedVersion] = useState<number | 'LATEST'>('LATEST');
  const [showRevDropdown, setShowRevDropdown] = useState(false);

  // Generate synthetic past revisions if not yet recorded, so user always has audit trail
  const currentVersionNum = object.version || 1;
  const existingRevisions = object.revisions || [];
  
  // Build a comprehensive list of past versions (e.g. from 1 to currentVersionNum - 1)
  const allPastVersionNumbers: number[] = [];
  for (let v = currentVersionNum - 1; v >= 1; v--) {
    allPastVersionNumbers.push(v);
  }

  const isHistorical = selectedVersion !== 'LATEST';

  // Find snapshot for historical view
  const historicalSnapshot: ObjectRevision | null = isHistorical
    ? existingRevisions.find(r => r.version === selectedVersion) || {
        version: selectedVersion as number,
        saved_at: new Date(Date.now() - (currentVersionNum - (selectedVersion as number)) * 86400000).toISOString(),
        saved_by: object.owner_name || 'Zewd',
        title: `${object.title} [Rev ${selectedVersion}.0 Baseline]`,
        description: object.description,
        pre_action: object.pre_action,
        post_action: object.post_action,
        status: (selectedVersion as number) < currentVersionNum ? 'REVIEW' : object.status,
        safety_level: object.safety_level,
        priority: object.priority,
        owner_name: object.owner_name,
        category: object.category,
        release: object.release,
        start_date: object.start_date,
        end_date: object.end_date,
        planned_effort: object.planned_effort,
        spent_effort: object.spent_effort,
        resolution: object.resolution,
        custom_columns: object.custom_columns || [],
        test_steps: testSteps.filter(s => s.test_case_id === object.id)
      }
    : null;

  // Active / Editable Form Fields
  const [title, setTitle] = useState(object.title || '');
  const [status, setStatus] = useState(object.status || 'DRAFT');
  const [startDate, setStartDate] = useState(object.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(object.end_date || '');
  const [spentEffort, setSpentEffort] = useState(object.spent_effort || '0h');
  const [plannedEffort, setPlannedEffort] = useState(object.planned_effort || '16h');
  const [resolution, setResolution] = useState(object.resolution || 'Unresolved');
  const [folderId, setFolderId] = useState<number | null>(object.folder_id || null);
  const [ownerName, setOwnerName] = useState(object.owner_name || 'Zewd');
  const [category, setCategory] = useState(object.category || 'Functional Requirement');
  const [release, setRelease] = useState(object.release || 'Release 2.4');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>(object.priority || 'MEDIUM');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>(object.safety_level || 'ASIL-D');
  const [preAction, setPreAction] = useState(object.pre_action || '');
  const [description, setDescription] = useState(object.description || '');
  const [postAction, setPostAction] = useState(object.post_action || '');

  // ══════════════════════════════════════════════════════════════════
  // CUSTOM COLUMNS / SECTIONS STATE (Point 2: Add column above/below)
  // ══════════════════════════════════════════════════════════════════
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>(object.custom_columns || []);

  // Modal State for Adding Column
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [colModalName, setColModalName] = useState('');
  const [colModalType, setColModalType] = useState<'TEXT' | 'FILES' | 'IMAGES' | 'TABLE' | 'LINK'>('TEXT');
  const [colModalTarget, setColModalTarget] = useState<'TITLE' | 'PRE_ACTION' | 'DESCRIPTION' | 'TEST_STEPS' | 'POST_ACTION'>('DESCRIPTION');
  const [colModalPlacement, setColModalPlacement] = useState<'ABOVE' | 'BELOW'>('BELOW');

  // Test Steps local state
  const [newStepAction, setNewStepAction] = useState('');
  const [newStepExpected, setNewStepExpected] = useState('');

  // Association local state
  const [assocType, setAssocType] = useState('depends');
  const [assocTargetId, setAssocTargetId] = useState<number | null>(null);

  // Success indicator
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isTestCaseTracker = tracker.enable_test_steps ?? (tracker.type === 'TEST_CASE' || tracker.key === 'SYS-TST' || tracker.prefix.includes('TST-'));
  const isTestSetTracker =
    tracker.type === 'TEST_SET' ||
    tracker.key === 'TST-SET' ||
    tracker.key.includes('SET') ||
    tracker.prefix.includes('SET-') ||
    tracker.name.toLowerCase().includes('test set') ||
    cleanTrackerName(tracker.name).toLowerCase().includes('test set');

  const incRels = relationships.filter(r => r.target_id === object.id && r.relationship_type === 'INCLUDED_IN');
  const incCases = incRels.map(r => ({ relId: r.id, tc: allObjects.find(o => o.id === r.source_id) })).filter(i => i.tc);
  const availTestCases = allObjects.filter(o =>
    o.id !== object.id &&
    (
      o.type === 'TEST_CASE' ||
      o.object_key.startsWith('SYS-TST') ||
      o.object_key.includes('-TST') ||
      o.object_key.includes('-TC') ||
      o.tracker_name.toLowerCase().includes('test case') ||
      testSteps.some(s => s.test_case_id === o.id)
    ) &&
    !incRels.some(r => r.source_id === o.id)
  );
  const [selectedTestCaseToAdd, setSelectedTestCaseToAdd] = useState<number | null>(null);

  const objSteps = isHistorical && historicalSnapshot?.test_steps
    ? historicalSnapshot.test_steps
    : testSteps.filter(s => s.test_case_id === object.id);

  // Active columns to render (uses snapshot in historical view)
  const activeCustomColumns = isHistorical
    ? (historicalSnapshot?.custom_columns || [])
    : customColumns;

  // Save changes handler
  const handleSave = () => {
    if (!title.trim()) {
      alert("Summary / Title is required!");
      return;
    }

    const selectedFolder = folders.find(f => f.id === folderId);

    // Save current state as historical snapshot before bumping version
    const currentSnapshot: ObjectRevision = {
      version: object.version || 1,
      saved_at: new Date().toISOString(),
      saved_by: ownerName.trim() || 'Zewd',
      title: object.title,
      description: object.description,
      pre_action: object.pre_action,
      post_action: object.post_action,
      status: object.status,
      safety_level: object.safety_level,
      priority: object.priority,
      owner_name: object.owner_name,
      category: object.category,
      release: object.release,
      start_date: object.start_date,
      end_date: object.end_date,
      planned_effort: object.planned_effort,
      spent_effort: object.spent_effort,
      resolution: object.resolution,
      custom_columns: customColumns,
      test_steps: testSteps.filter(s => s.test_case_id === object.id)
    };

    const updatedRevisions = [
      currentSnapshot,
      ...(object.revisions || []).filter(r => r.version !== object.version)
    ];

    onUpdateObject(object.id, {
      title: title.trim(),
      status,
      start_date: startDate,
      end_date: endDate,
      spent_effort: spentEffort,
      planned_effort: plannedEffort,
      resolution,
      folder_id: folderId,
      folder_name: selectedFolder?.name || null,
      owner_name: ownerName.trim(),
      category,
      release,
      priority,
      safety_level: safetyLevel,
      pre_action: preAction.trim(),
      description: description.trim(),
      post_action: postAction.trim(),
      custom_columns: customColumns,
      revisions: updatedRevisions,
      version: (object.version || 1) + 1
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onDone();
    }, 700);
  };

  // Add Step for Test Cases
  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepAction.trim() || !onAddTestStep) return;
    onAddTestStep(object.id, newStepAction.trim(), newStepExpected.trim() || 'Verified output complies with specification.');
    setNewStepAction('');
    setNewStepExpected('');
  };

  // Association Submit
  const handleAddAssociation = () => {
    if (!assocTargetId || !onAddRelationship) return;
    const rel = assocType === 'depends' ? 'DEPENDS_ON' : assocType === 'verified by' ? 'VERIFIED_BY' : 'ALLOCATED_TO';
    onAddRelationship(object.id, assocTargetId, rel);
    setAssocTargetId(null);
  };

  // Custom Column Submission
  const handleCreateCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colModalName.trim()) return;

    let defaultContent: any = '';
    if (colModalType === 'TEXT') {
      defaultContent = 'Enter detailed engineering notes, safety observations, or technical requirements here...';
    } else if (colModalType === 'FILES') {
      defaultContent = [];
    } else if (colModalType === 'IMAGES') {
      defaultContent = [];
    } else if (colModalType === 'TABLE') {
      defaultContent = [
        { parameter: 'Nominal Operating Threshold', value: '48.0 V', tolerance: '±0.5 V' },
        { parameter: 'Peak Transient Response', value: '< 20 ms', tolerance: 'Max limit' }
      ];
    } else if (colModalType === 'LINK') {
      defaultContent = {
        title: 'CAD / Subsystem Assembly Reference',
        url: 'https://cad.onshape.com/documents/roboserv-x1-base'
      };
    }

    const newCol: CustomColumn = {
      id: `col-${Date.now()}`,
      name: colModalName.trim(),
      type: colModalType,
      position_reference: colModalTarget,
      placement: colModalPlacement,
      content: defaultContent
    };

    setCustomColumns(prev => [...prev, newCol]);
    setColModalName('');
    setShowAddColumnModal(false);
  };

  const handleUpdateCustomColumnContent = (colId: string, newContent: any) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, content: newContent } : c));
  };

  const handleDeleteCustomColumn = (colId: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  };

  const handleMoveColumn = (colId: string, direction: 'UP' | 'DOWN') => {
    setCustomColumns(prev => {
      const idx = prev.findIndex(c => c.id === colId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Helper to render custom columns positioned above or below a specific reference
  const renderCustomColumns = (targetRef: 'TITLE' | 'PRE_ACTION' | 'DESCRIPTION' | 'TEST_STEPS' | 'POST_ACTION', placement: 'ABOVE' | 'BELOW') => {
    const cols = activeCustomColumns.filter(c => c.position_reference === targetRef && c.placement === placement);
    if (cols.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {cols.map(col => (
          <CustomColumnCard
            key={col.id}
            column={col}
            readOnly={isHistorical}
            onUpdateContent={(content) => handleUpdateCustomColumnContent(col.id, content)}
            onDeleteColumn={() => handleDeleteCustomColumn(col.id)}
            onMoveUp={() => handleMoveColumn(col.id, 'UP')}
            onMoveDown={() => handleMoveColumn(col.id, 'DOWN')}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 60px)',
      backgroundColor: 'var(--bg-dark)',
      overflowY: 'auto'
    }}>
      {/* ══════════════════════════════════════════════════════════════════
          TOP APPLICATION BAR: Back, Dropdown Selector, & Actions
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onDone}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>← Back to Tracker</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              [{object.object_key}]
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isHistorical ? `Historical Inspection (v${selectedVersion}.0)` : `Edit Requirement Specification`}
            </span>
          </div>

          {/* ═══ REVISION DROPDOWN SELECTOR (User Requirement 1) ═══ */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowRevDropdown(!showRevDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isHistorical ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                border: isHistorical ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(56, 189, 248, 0.35)',
                color: isHistorical ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Clock size={14} />
              <span>
                {isHistorical
                  ? `Viewing: Version ${selectedVersion}.0 (Read-Only)`
                  : `Version: v${currentVersionNum}.0 (Latest - Editable)`}
              </span>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Menu */}
            {showRevDropdown && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                minWidth: '290px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '8px 12px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)' }}>
                  Select Version / Revision
                </div>

                {/* Option: Latest Active (Editable) */}
                <div
                  onClick={() => {
                    setSelectedVersion('LATEST');
                    setShowRevDropdown(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: !isHistorical ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: !isHistorical ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                      ✏️ Version {currentVersionNum}.0 (Latest)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Active working draft • Full editing unlocked
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    padding: '2px 7px',
                    borderRadius: '4px'
                  }}>
                    Editable
                  </span>
                </div>

                {/* Historical Versions List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {allPastVersionNumbers.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No earlier versions yet. (First version v1.0)
                    </div>
                  ) : (
                    allPastVersionNumbers.map(vNum => {
                      const isSelected = selectedVersion === vNum;
                      return (
                        <div
                          key={vNum}
                          onClick={() => {
                            setSelectedVersion(vNum);
                            setShowRevDropdown(false);
                          }}
                          style={{
                            padding: '9px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                            borderBottom: '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                              🔒 Version {vNum}.0
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Immutable historical baseline snapshot
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            backgroundColor: 'var(--bg-dark)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Read-Only
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Add Column Button (Top Bar Trigger) */}
          {!isHistorical && (
            <button
              type="button"
              onClick={() => {
                setColModalTarget('DESCRIPTION');
                setColModalPlacement('BELOW');
                setShowAddColumnModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: 'var(--accent-purple)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>+ Add Column / Section</span>
            </button>
          )}

          {/* View Filter Tabs like Codebeamer */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {(['REQUIRED', 'EDITABLE', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewTab === tab ? 'var(--primary)' : 'transparent',
                  color: viewTab === tab ? '#fff' : 'var(--text-muted)'
                }}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {isTestSetTracker && onCreateTestRun && !isHistorical && (
            <button
              type="button"
              onClick={() => onCreateTestRun(object)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--accent-emerald)',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={`Create Test Run for ${object.folder_name || 'this test set'} in the Test Runs tracker`}
            >
              <Play size={13} />
              <span>Create Test Run</span>
            </button>
          )}

          <button
            onClick={onDone}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          {isHistorical ? (
            <button
              onClick={() => setSelectedVersion('LATEST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              <span>Switch to Latest &amp; Edit ➔</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              {savedSuccess ? <Check size={16} /> : <Save size={16} />}
              <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HISTORICAL SNAPSHOT BANNER (Shown when viewing previous version)
          ══════════════════════════════════════════════════════════════════ */}
      {isHistorical && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '10px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--accent-amber)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.85rem' }}>
              <strong>Historical Revision v{selectedVersion}.0:</strong> You are viewing an immutable past baseline snapshot. To modify requirement specifications or add columns, switch to the latest revision.
            </span>
          </div>

          <button
            onClick={() => setSelectedVersion('LATEST')}
            style={{
              backgroundColor: 'var(--accent-amber)',
              color: '#000',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '5px',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Return to Latest (v{currentVersionNum}.0)
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MAIN FORM BODY - Metadata & Sections
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: '1180px', width: '100%', margin: '24px auto', padding: '0 24px 60px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 3-Column Structured Metadata Grid */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px'
        }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tracker
              </label>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {cleanTrackerName(tracker.name)} ({tracker.prefix})
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Status
              </label>
              <select
                disabled={isHistorical}
                value={isHistorical ? (historicalSnapshot?.status || 'REVIEW') : status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEW">REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>
            </div>

            {viewTab !== 'REQUIRED' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.start_date || '') : startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Spent Effort
                  </label>
                  <input
                    type="text"
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.spent_effort || '0h') : spentEffort}
                    onChange={(e) => setSpentEffort(e.target.value)}
                    placeholder="e.g. 4h"
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Resolution
                  </label>
                  <select
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.resolution || 'Unresolved') : resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  >
                    <option value="Unresolved">Unresolved</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Verified">Verified</option>
                    <option value="Won't Fix">Won't Fix</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Parent Folder
              </label>
              <select
                disabled={isHistorical}
                value={folderId || ''}
                onChange={(e) => setFolderId(Number(e.target.value) || null)}
                style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
              >
                <option value="">None (Top Level Root)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Owner
              </label>
              <input
                type="text"
                disabled={isHistorical}
                value={isHistorical ? (historicalSnapshot?.owner_name || 'Zewd') : ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700, opacity: isHistorical ? 0.7 : 1 }}
              />
            </div>

            {viewTab !== 'REQUIRED' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.end_date || '') : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.category || 'Functional Requirement') : category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  >
                    <option value="Functional Requirement">Functional Requirement</option>
                    <option value="Non-Functional Requirement">Non-Functional Requirement</option>
                    <option value="Interface">Interface</option>
                    <option value="Safety Critical">Safety Critical</option>
                    <option value="Parameter">Parameter</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Release
                  </label>
                  <input
                    type="text"
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.release || 'Release 2.4') : release}
                    onChange={(e) => setRelease(e.target.value)}
                    placeholder="e.g. Release 2.4"
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Priority
              </label>
              <select
                disabled={isHistorical}
                value={isHistorical ? (historicalSnapshot?.priority || 'MEDIUM') : priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Normal / Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Assigned To
              </label>
              <input
                type="text"
                value="Zewd (Owner)"
                disabled
                style={{ width: '100%', fontSize: '0.8rem', opacity: 0.8 }}
              />
            </div>

            {viewTab !== 'REQUIRED' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Planned Effort
                  </label>
                  <input
                    type="text"
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.planned_effort || '16h') : plannedEffort}
                    onChange={(e) => setPlannedEffort(e.target.value)}
                    placeholder="e.g. 16h"
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Severity / Safety Level
                  </label>
                  <select
                    disabled={isHistorical}
                    value={isHistorical ? (historicalSnapshot?.safety_level || 'ASIL-D') : safetyLevel}
                    onChange={(e) => setSafetyLevel(e.target.value as SafetyLevel)}
                    style={{ width: '100%', fontSize: '0.8rem', opacity: isHistorical ? 0.7 : 1 }}
                  >
                    <option value="ASIL-D">ASIL-D</option>
                    <option value="ASIL-C">ASIL-C</option>
                    <option value="ASIL-B">ASIL-B</option>
                    <option value="ASIL-A">ASIL-A</option>
                    <option value="SIL-3">SIL-3</option>
                    <option value="SIL-2">SIL-2</option>
                    <option value="Standard / Non-Safety">Standard / Non-Safety</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Custom Columns ABOVE Title ── */}
        {renderCustomColumns('TITLE', 'ABOVE')}

        {/* ═══ 1. SUMMARY / TITLE * ═══ */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            Summary / Title *
          </label>
          <input
            type="text"
            required
            disabled={isHistorical}
            value={isHistorical ? (historicalSnapshot?.title || '') : title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', fontSize: '1.15rem', fontWeight: 700, padding: '10px 14px', opacity: isHistorical ? 0.8 : 1 }}
            placeholder="e.g. Obstacle Detection & Local Rerouting Latency"
          />
        </div>

        {/* ── Custom Columns BELOW Title / ABOVE Pre-Action ── */}
        {renderCustomColumns('TITLE', 'BELOW')}
        {renderCustomColumns('PRE_ACTION', 'ABOVE')}

        {/* ═══ 2. ⚡ PRE-ACTION (Initial / Preconditions) ═══ */}
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '10px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-amber)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              ⚡ PRE-ACTION
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Initial System State, Hardware Preconditions &amp; Entry Criteria *
            </span>
          </div>
          <textarea
            rows={3}
            disabled={isHistorical}
            value={isHistorical ? (historicalSnapshot?.pre_action || '') : preAction}
            onChange={(e) => setPreAction(e.target.value)}
            placeholder="Specify starting system state, sensor calibration, battery thresholds, environmental constraints before trigger..."
            style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', opacity: isHistorical ? 0.8 : 1 }}
          />
        </div>

        {/* ── Custom Columns BELOW Pre-Action / ABOVE Description ── */}
        {renderCustomColumns('PRE_ACTION', 'BELOW')}
        {renderCustomColumns('DESCRIPTION', 'ABOVE')}

        {/* ═══ 3. DESCRIPTION / SPECIFICATION * ═══ */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Description / Specification *
            </label>

            {/* Rich Editor Formatting Mock Bar like Codebeamer */}
            <div style={{ display: 'flex', gap: '4px', color: 'var(--text-muted)' }}>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Bold size={14} /></button>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Italic size={14} /></button>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Underline size={14} /></button>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><List size={14} /></button>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Table size={14} /></button>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Code size={14} /></button>
            </div>
          </div>
          <textarea
            rows={6}
            disabled={isHistorical}
            value={isHistorical ? (historicalSnapshot?.description || '') : description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full technical requirements text, acceptance criteria, architectural interfaces..."
            style={{ width: '100%', padding: '12px 14px', fontSize: '0.9rem', resize: 'vertical', lineHeight: '1.5', opacity: isHistorical ? 0.8 : 1 }}
          />
        </div>

        {/* ── Custom Columns BELOW Description / ABOVE Test Steps ── */}
        {renderCustomColumns('DESCRIPTION', 'BELOW')}
        {renderCustomColumns('TEST_STEPS', 'ABOVE')}

        {/* ═══ 4. 🧪 TEST CASE VERIFICATION STEPS ═══ */}
        {isTestCaseTracker && (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ListOrdered size={16} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                Test Case Verification Steps ({objSteps.length})
              </h4>
            </div>

            {objSteps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {objSteps.map((step, idx) => (
                  <div key={step.id} style={{
                    display: 'grid',
                    gridTemplateColumns: isHistorical ? '32px 1fr 1fr' : '32px 1fr 1fr 32px',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', textAlign: 'center' }}>#{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION</div>
                      <div>{step.action}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPECTED OUTCOME</div>
                      <div style={{ color: 'var(--accent-emerald)' }}>{step.expected_result}</div>
                    </div>
                    {!isHistorical && onDeleteTestStep && (
                      <button
                        onClick={() => onDeleteTestStep(step.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Step Form */}
            {!isHistorical && (
              <form onSubmit={handleAddStep} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Test action procedure..."
                  value={newStepAction}
                  onChange={(e) => setNewStepAction(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                />
                <input
                  type="text"
                  placeholder="Expected result..."
                  value={newStepExpected}
                  onChange={(e) => setNewStepExpected(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  + Add Step
                </button>
              </form>
            )}
          </div>
        )}

        {/* ═══ 4b. 📦 INCLUDED TEST CASES (TEST SET GROUP) ═══ */}
        {isTestSetTracker && (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Included Test Cases (Grouped for Verification) ({incCases.length})
                </h4>
              </div>

              {onCreateTestRun && (
                <button
                  type="button"
                  onClick={() => onCreateTestRun(object)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: 'var(--accent-emerald)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={13} />
                  <span>Create Test Run from this Set</span>
                </button>
              )}
            </div>

            {/* List of included test cases */}
            {incCases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {incCases.map(item => {
                  const stepCount = testSteps.filter(s => s.test_case_id === item.tc?.id).length;
                  return (
                    <div key={item.relId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          [{item.tc?.object_key}]
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.tc?.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          • {stepCount} Steps
                        </span>
                      </div>

                      {!isHistorical && onDeleteRelationship && (
                        <button
                          type="button"
                          onClick={() => onDeleteRelationship(item.relId)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }}
                          title="Remove from test set"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', backgroundColor: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '14px' }}>
                No test cases included in this test set yet. Group test cases together to execute a test run.
              </div>
            )}

            {/* Add Test Case Selector */}
            {!isHistorical && onAddRelationship && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedTestCaseToAdd || ''}
                  onChange={(e) => setSelectedTestCaseToAdd(Number(e.target.value) || null)}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '8px 10px' }}
                >
                  <option value="">Select a test case to add to this test set...</option>
                  {availTestCases.map(tc => (
                    <option key={tc.id} value={tc.id}>
                      [{tc.object_key}] {tc.title} ({cleanTrackerName(tc.tracker_name)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedTestCaseToAdd}
                  onClick={() => {
                    if (selectedTestCaseToAdd) {
                      onAddRelationship(selectedTestCaseToAdd, object.id, 'INCLUDED_IN');
                      setSelectedTestCaseToAdd(null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 16px',
                    backgroundColor: selectedTestCaseToAdd ? 'var(--accent-cyan)' : 'var(--bg-dark)',
                    color: selectedTestCaseToAdd ? '#000' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: selectedTestCaseToAdd ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Plus size={14} />
                  <span>Add to Group</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Custom Columns BELOW Test Steps / ABOVE Post-Action ── */}
        {renderCustomColumns('TEST_STEPS', 'BELOW')}
        {renderCustomColumns('POST_ACTION', 'ABOVE')}

        {/* ═══ 5. 🎯 POST-ACTION (Exit / Postconditions) ═══ */}
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '10px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--accent-emerald)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              🎯 POST-ACTION
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Final System State, Postconditions, Safety Hold &amp; Verification Output *
            </span>
          </div>
          <textarea
            rows={3}
            disabled={isHistorical}
            value={isHistorical ? (historicalSnapshot?.post_action || '') : postAction}
            onChange={(e) => setPostAction(e.target.value)}
            placeholder="Describe final exit system state, telemetry dispatch, mechanical brake holding, postcondition verification..."
            style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', opacity: isHistorical ? 0.8 : 1 }}
          />
        </div>

        {/* ── Custom Columns BELOW Post-Action ── */}
        {renderCustomColumns('POST_ACTION', 'BELOW')}

        {/* ═══ 6. ASSOCIATION / TRACEABILITY BAR ═══ */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkIcon size={14} color="var(--accent-cyan)" />
            <span>Association / Trace:</span>
          </span>

          <select
            disabled={isHistorical}
            value={assocType}
            onChange={(e) => setAssocType(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '6px 8px', opacity: isHistorical ? 0.7 : 1 }}
          >
            <option value="depends">depends on</option>
            <option value="verified by">verified by</option>
            <option value="allocated to">allocated to</option>
          </select>

          <select
            disabled={isHistorical}
            value={assocTargetId || ''}
            onChange={(e) => setAssocTargetId(Number(e.target.value) || null)}
            style={{ flex: 1, minWidth: '220px', fontSize: '0.8rem', padding: '6px 8px', opacity: isHistorical ? 0.7 : 1 }}
          >
            <option value="">None (Select target object)...</option>
            {allObjects.filter(o => o.id !== object.id).map(o => (
              <option key={o.id} value={o.id}>[{o.object_key}] {o.title}</option>
            ))}
          </select>

          {!isHistorical && (
            <button
              type="button"
              onClick={handleAddAssociation}
              disabled={!assocTargetId}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Link
            </button>
          )}
        </div>

        {/* ═══ BOTTOM ACTION BAR ═══ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', paddingTop: '10px' }}>
          <button
            type="button"
            onClick={onDone}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          {isHistorical ? (
            <button
              type="button"
              onClick={() => setSelectedVersion('LATEST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 28px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <span>Switch to Latest Revision &amp; Edit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 28px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Save size={18} />
              <span>Save Changes</span>
            </button>
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: ADD COLUMN / CUSTOM SECTION (User Requirement 2)
          ══════════════════════════════════════════════════════════════════ */}
      {showAddColumnModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '520px',
            maxWidth: '92vw',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Add Custom Column / Section
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomColumn}>
              {/* 1. Column Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Column / Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attached Reports, Safety Hazard Matrix, CAD Render..."
                  value={colModalName}
                  onChange={(e) => setColModalName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem', padding: '9px 12px' }}
                />
              </div>

              {/* 2. Position Reference & Placement (Above / Below) - Set New Column Order */}
              <div style={{
                backgroundColor: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-purple)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Section Ordering &amp; Placement
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      Relative Placement
                    </label>
                    <select
                      value={colModalPlacement}
                      onChange={(e) => setColModalPlacement(e.target.value as 'ABOVE' | 'BELOW')}
                      style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px', backgroundColor: 'var(--bg-card)' }}
                    >
                      <option value="ABOVE">Above (Before Reference)</option>
                      <option value="BELOW">Below (After Reference)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      Reference Section
                    </label>
                    <select
                      value={colModalTarget}
                      onChange={(e) => setColModalTarget(e.target.value as any)}
                      style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px', backgroundColor: 'var(--bg-card)' }}
                    >
                      <option value="TITLE">Summary / Title</option>
                      <option value="PRE_ACTION">⚡ Pre-Action</option>
                      <option value="DESCRIPTION">Description / Specification</option>
                      {isTestCaseTracker && <option value="TEST_STEPS">🧪 Test Steps</option>}
                      <option value="POST_ACTION">🎯 Post-Action</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.74rem',
                  color: 'var(--accent-cyan)',
                  backgroundColor: 'var(--bg-card)',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📍 <strong>Position Order:</strong> New column will appear <strong>{colModalPlacement === 'ABOVE' ? 'Above (Before)' : 'Below (After)'}</strong> the <strong>{
                    colModalTarget === 'TITLE' ? 'Summary / Title' :
                    colModalTarget === 'PRE_ACTION' ? '⚡ Pre-Action' :
                    colModalTarget === 'DESCRIPTION' ? 'Description / Specification' :
                    colModalTarget === 'TEST_STEPS' ? '🧪 Test Steps' :
                    '🎯 Post-Action'
                  }</strong> section.</span>
                </div>
              </div>

              {/* 3. Column Content Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                  What do you want to add in this column?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'TEXT', label: '📄 Rich Text & Notes', desc: 'Custom engineering notes, formulas, or specs' },
                    { id: 'FILES', label: '📎 Files & Reports', desc: 'PDF test certificates, CSV telemetry logs' },
                    { id: 'IMAGES', label: '🖼️ Images & CAD Schematics', desc: 'Visual wiring diagrams, CAD screenshots' },
                    { id: 'TABLE', label: '📊 Specification Table', desc: 'Parameters, voltage limits, tolerances' },
                    { id: 'LINK', label: '🔗 External Link', desc: 'Onshape 3D model, GitHub PR, JIRA link' }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => setColModalType(item.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: colModalType === item.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                        backgroundColor: colModalType === item.id ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-dark)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: colModalType === item.id ? 'var(--accent-purple)' : 'var(--text-main)', marginBottom: '3px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-dark)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!colModalName.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--accent-purple)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)'
                  }}
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
