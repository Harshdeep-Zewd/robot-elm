import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Folder, FolderPlus, ChevronRight, ChevronDown, ListOrdered, Paperclip,
  CheckSquare, Trash2, Search, Save, ArrowRight, ArrowLeft, Link as LinkIcon,
  ShieldAlert, Activity, FileText, Download, CheckCircle2, AlertTriangle,
  Layers, UploadCloud, ExternalLink, X, Clock, User, ChevronUp, Play
} from 'lucide-react';
import {
  Tracker, Folder as FolderType, EngineeringObject, RequirementType,
  SafetyLevel, TestSubProcess, Relationship, TestStep, Artifact, CustomColumn
} from '../types/elm';
import { cleanTrackerName } from '../data/canonicalTrackers';
import { RequirementEditDashboard } from './RequirementEditDashboard';
import { EnterpriseCreateModal } from './EnterpriseCreateModal';
import { CustomColumnCard } from './CustomColumnCard';
import { createNewTabHandlers } from '../utils/tabOpener';

interface TrackerTableViewProps {
  tracker: Tracker;
  objects: EngineeringObject[];
  allObjects: EngineeringObject[];
  folders: FolderType[];
  allTrackers?: Tracker[];
  relationships: Relationship[];
  testSteps?: TestStep[];
  artifacts?: Artifact[];
  testRuns?: any[];
  onCreateFolder?: (tracker_id: number, name: string) => number | void;
  onCreateObject: (data: {
    tracker_id: number;
    folder_id?: number | null;
    title: string;
    description?: string;
    pre_action?: string;
    post_action?: string;
    requirement_type?: RequirementType;
    safety_level?: SafetyLevel;
    test_subprocess?: TestSubProcess;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    start_date?: string;
    end_date?: string;
    planned_effort?: string;
    spent_effort?: string;
    category?: string;
    resolution?: string;
    release?: string;
    owner_name?: string;
    test_step_action?: string;
    test_step_expected?: string;
    included_test_case_ids?: number[];
    metadata?: any;
  }) => number | void;
  onUpdateObject: (id: number, updates: Partial<EngineeringObject>) => void;
  onDeleteObject?: (id: number) => void;
  onAddRelationship: (source_id: number, target_id: number, type: string) => void;
  onDeleteRelationship: (id: number) => void;
  onAddTestStep?: (test_case_id: number, action: string, expected_result: string) => void;
  onDeleteTestStep?: (id: number) => void;
  onAddArtifact?: (data: { object_id?: number; filename: string; category: any; file_size?: number; stored_path?: string }) => void;
  onDeleteArtifact?: (id: number) => void;
  onSelectObjectForImpact?: (objId: number) => void;
  onCreateTestRun?: (testSet: EngineeringObject) => { newRunObj: EngineeringObject; newTestRun: any; testRunTracker: Tracker };
  onNavigateToTestRun?: (runId: number) => void;
  onNavigateTracker?: (tracker: Tracker, objectId?: number) => void;
  onNavigateView?: (view: any) => void;
  onBackToDashboard?: () => void;
}

export const TrackerTableView: React.FC<TrackerTableViewProps> = ({
  tracker,
  objects,
  allObjects,
  folders,
  allTrackers = [],
  relationships,
  testSteps = [],
  artifacts = [],
  testRuns = [],
  onCreateFolder,
  onCreateObject,
  onUpdateObject,
  onDeleteObject,
  onAddRelationship,
  onDeleteRelationship,
  onAddTestStep,
  onDeleteTestStep,
  onAddArtifact,
  onDeleteArtifact,
  onSelectObjectForImpact,
  onCreateTestRun,
  onNavigateToTestRun,
  onNavigateTracker,
  onNavigateView,
  onBackToDashboard
}) => {
  // Navigation & Filter state
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const objParam = params.get('object');
      if (objParam) {
        const found = objects.find(o => String(o.id) === objParam || o.object_key.toLowerCase() === objParam.toLowerCase());
        if (found && found.folder_id) return found.folder_id;
      }
      const fParam = params.get('folder');
      if (fParam) return Number(fParam);
    } catch (e) {}
    return null;
  });

  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const objParam = params.get('object');
      if (objParam) {
        const found = objects.find(o => String(o.id) === objParam || o.object_key.toLowerCase() === objParam.toLowerCase());
        if (found) return found.id;
      }
    } catch (e) {}
    return objects.length > 0 ? objects[0].id : null;
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Folder Expansion State (Left Panel - Vertical series of folders with dropdowns)
  const [expandedFolderIds, setExpandedFolderIds] = useState<number[]>(() => {
    return folders.map(f => f.id);
  });
  const [isAllItemsExpanded, setIsAllItemsExpanded] = useState(true);

  // Requirement Dropdowns State (Middle Panel - Each requirement has its own dropdown)
  const [expandedReqIds, setExpandedReqIds] = useState<number[]>(() => {
    return objects.length > 0 ? [objects[0].id] : [];
  });

  // Local editing drafts for each expanded requirement
  const [drafts, setDrafts] = useState<Record<number, Partial<EngineeringObject>>>({});
  const [saveStatusMap, setSaveStatusMap] = useState<Record<number, boolean>>({});

  // Inline Test Steps state
  const [stepActionMap, setStepActionMap] = useState<Record<number, string>>({});
  const [stepExpectedMap, setStepExpectedMap] = useState<Record<number, string>>({});

  // Inline Test Set inclusion state
  const [addTestCaseIdMap, setAddTestCaseIdMap] = useState<Record<number, number | null>>({});

  // Create Object Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Link Relationship Modal State (Right Panel)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetObjId, setTargetObjId] = useState<number | null>(null);
  const [relType, setRelType] = useState<string>('VERIFIED_BY');

  // File Upload State (Right Panel)
  const [showFileModal, setShowFileModal] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'PDF' | 'CAD' | 'CSV' | 'OTHER'>('PDF');

  const isTestCaseTracker = tracker.enable_test_steps ?? (tracker.type === 'TEST_CASE' || tracker.key === 'SYS-TST' || tracker.prefix.includes('TST-'));
  const isTestSetTracker =
    tracker.type === 'TEST_SET' ||
    tracker.key === 'TST-SET' ||
    tracker.key.includes('SET') ||
    tracker.prefix.includes('SET-') ||
    tracker.name.toLowerCase().includes('test set') ||
    cleanTrackerName(tracker.name).toLowerCase().includes('test set');

  const isTestRunTracker =
    tracker.key === 'TR_GEN' ||
    tracker.key === 'SQTR' ||
    tracker.type === 'TEST_RUN' ||
    tracker.name.toLowerCase().includes('test run') ||
    cleanTrackerName(tracker.name).toLowerCase() === 'test runs';

  // Test Set Grouping Modal State
  const [managingTestSet, setManagingTestSet] = useState<EngineeringObject | null>(null);
  const [testCaseSearch, setTestCaseSearch] = useState('');

  // Created Run Feedback Toast State
  const [createdRunToast, setCreatedRunToast] = useState<{
    runName: string;
    trackerName: string;
    runObjId: number;
    runId: number;
    testRunTracker: Tracker;
  } | null>(null);

  // Set of Test Set IDs whose created test runs dropdown is currently open
  const [openRunsDropdownSetIds, setOpenRunsDropdownSetIds] = useState<Set<number>>(new Set());

  const toggleRunsDropdown = (testSetId: number) => {
    setOpenRunsDropdownSetIds(prev => {
      const next = new Set(prev);
      if (next.has(testSetId)) next.delete(testSetId);
      else next.add(testSetId);
      return next;
    });
  };

  const getTestRunsForSet = (testSet: EngineeringObject) => {
    // 1. Matched by test_set_id or test_set_key in testRuns array
    const matchedFromTestRuns = testRuns.filter(r =>
      r.test_set_id === testSet.id ||
      (r.test_set_key && (r.test_set_key === testSet.object_key || r.test_set_key === testSet.title))
    );

    // 2. Matched by EXECUTED_FROM relationship
    const runRelIds = relationships
      .filter(rel => rel.target_id === testSet.id && rel.relationship_type === 'EXECUTED_FROM')
      .map(rel => rel.source_id);

    // 3. Match from allObjects
    const runObjs = allObjects.filter(o =>
      runRelIds.includes(o.id) ||
      (o.type === 'TEST_RUN' && o.pre_action && o.pre_action.includes(testSet.object_key))
    );

    const allRunIds = Array.from(new Set<number>([
      ...matchedFromTestRuns.map(r => r.id),
      ...runRelIds,
      ...runObjs.map(o => o.id)
    ]));

    return allRunIds.map(runId => {
      const tr = matchedFromTestRuns.find(r => r.id === runId) || testRuns.find(r => r.id === runId);
      const obj = runObjs.find(o => o.id === runId) || allObjects.find(o => o.id === runId);
      return {
        id: runId,
        name: tr?.name || obj?.title || `Test Run #${runId}`,
        key: obj?.object_key || (tr?.test_set_key ? `${tr.test_set_key}-RUN` : `TR-${String(runId).slice(-3)}`),
        status: tr?.overall_status || (obj?.status as any) || 'NOT_RUN',
        tester_name: tr?.tester_name || obj?.owner_name || 'Zewd',
        started_at: tr?.started_at || obj?.created_at,
        config_name: tr?.config_name || 'RoboServ-X1 Hardware Configuration',
        software_version: tr?.software_version || 'v1.0.0-release'
      };
    });
  };

  const handleTriggerCreateTestRun = (testSet: EngineeringObject) => {
    if (!onCreateTestRun) return;

    const incRels = relationships.filter(r => r.target_id === testSet.id && r.relationship_type === 'INCLUDED_IN');
    if (incRels.length === 0) {
      const proceed = window.confirm(
        `This Test Set currently has 0 test cases added.\n\nWould you like to add test cases first, or create the Test Run anyway?`
      );
      if (!proceed) {
        setManagingTestSet(testSet);
        return;
      }
    }

    const res = onCreateTestRun(testSet);
    if (res) {
      setCreatedRunToast({
        runName: res.newTestRun.name,
        trackerName: res.testRunTracker.name,
        runObjId: res.newRunObj.id,
        runId: res.newTestRun.id,
        testRunTracker: res.testRunTracker
      });
    }
  };

  // Filter items in Left Panel and Middle Panel
  let filteredObjects = objects;
  if (selectedFolderId !== null) {
    filteredObjects = filteredObjects.filter(o => o.folder_id === selectedFolderId);
  }
  if (statusFilter) {
    filteredObjects = filteredObjects.filter(o => o.status === statusFilter);
  }
  if (search.trim()) {
    const s = search.toLowerCase();
    filteredObjects = filteredObjects.filter(o =>
      o.object_key.toLowerCase().includes(s) ||
      o.title.toLowerCase().includes(s) ||
      o.description.toLowerCase().includes(s) ||
      (o.pre_action && o.pre_action.toLowerCase().includes(s)) ||
      (o.post_action && o.post_action.toLowerCase().includes(s))
    );
  }

  // Ensure an active object is selected
  useEffect(() => {
    if (filteredObjects.length > 0) {
      if (!selectedObjectId || !filteredObjects.some(o => o.id === selectedObjectId)) {
        setSelectedObjectId(filteredObjects[0].id);
      }
    } else {
      setSelectedObjectId(null);
    }
  }, [filteredObjects, tracker.id]);

  // Deep-link direct scroll and expansion on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const objParam = params.get('object');
      if (objParam) {
        const found = objects.find(o => String(o.id) === objParam || o.object_key.toLowerCase() === objParam.toLowerCase());
        if (found) {
          setTimeout(() => {
            scrollToRequirementCard(found, found.folder_id);
          }, 150);
        }
      }
    } catch (e) {}
  }, [tracker.id]);

  // Keep folder expansions updated if new folders are added
  useEffect(() => {
    setExpandedFolderIds(prev => {
      const allIds = folders.map(f => f.id);
      return Array.from(new Set([...prev, ...allIds]));
    });
  }, [folders.length]);

  const toggleFolderDropdown = (folderId: number) => {
    setExpandedFolderIds(prev =>
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  const toggleRequirementDropdown = (objId: number) => {
    setSelectedObjectId(objId);
    setExpandedReqIds(prev =>
      prev.includes(objId) ? prev.filter(id => id !== objId) : [...prev, objId]
    );
  };

  const expandAllRequirements = () => {
    setExpandedReqIds(filteredObjects.map(o => o.id));
  };

  const collapseAllRequirements = () => {
    setExpandedReqIds([]);
  };

  /**
   * Smoothly scrolls to the requirement card in the middle panel,
   * ensures it is expanded, selected, and visually highlighted.
   */
  const scrollToRequirementCard = (obj: EngineeringObject, sourceFolderId?: number | null) => {
    // 1. Ensure object will be visible in the middle panel
    if (sourceFolderId === null) {
      if (selectedFolderId !== null) {
        setSelectedFolderId(null);
      }
    } else if (sourceFolderId !== undefined && sourceFolderId !== null) {
      if (selectedFolderId !== sourceFolderId) {
        setSelectedFolderId(sourceFolderId);
      }
    } else if (selectedFolderId !== null && obj.folder_id !== selectedFolderId) {
      setSelectedFolderId(null);
    }

    // 2. Clear filters that would otherwise hide this object
    if (statusFilter && obj.status !== statusFilter) {
      setStatusFilter('');
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchesSearch = obj.object_key.toLowerCase().includes(s) ||
        obj.title.toLowerCase().includes(s) ||
        obj.description.toLowerCase().includes(s);
      if (!matchesSearch) {
        setSearch('');
      }
    }

    // 3. Mark selected object and ensure it is expanded
    setSelectedObjectId(obj.id);
    setExpandedReqIds(prev => prev.includes(obj.id) ? prev : [...prev, obj.id]);

    // 4. Smooth scroll to the requirement card in the middle panel and pulse highlight
    const executeScroll = (attempt = 0) => {
      const cardEl = document.getElementById(`req-card-${obj.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease';
        cardEl.style.borderColor = 'var(--accent-cyan)';
        cardEl.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.45), 0 8px 30px rgba(56, 189, 248, 0.35)';
        cardEl.style.transform = 'translateY(-2px)';
        setTimeout(() => {
          if (cardEl) {
            cardEl.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.15)';
            cardEl.style.transform = 'none';
          }
        }, 1500);
      } else if (attempt < 8) {
        setTimeout(() => executeScroll(attempt + 1), 50);
      }
    };

    setTimeout(() => executeScroll(0), 40);
  };

  // Get current draft or fallback to object state
  const getDraft = (obj: EngineeringObject) => {
    return {
      title: drafts[obj.id]?.title ?? obj.title,
      pre_action: drafts[obj.id]?.pre_action ?? (obj.pre_action || ''),
      description: drafts[obj.id]?.description ?? (obj.description || ''),
      owner_name: drafts[obj.id]?.owner_name ?? (obj.owner_name || 'Zewd'),
      post_action: drafts[obj.id]?.post_action ?? (obj.post_action || ''),
      status: drafts[obj.id]?.status ?? obj.status,
      safety_level: drafts[obj.id]?.safety_level ?? (obj.safety_level || 'ASIL-D'),
      priority: drafts[obj.id]?.priority ?? (obj.priority || 'MEDIUM'),
      requirement_type: drafts[obj.id]?.requirement_type ?? (obj.requirement_type || 'Functional Requirement'),
      test_subprocess: drafts[obj.id]?.test_subprocess ?? (obj.test_subprocess || 'System Testing')
    };
  };

  const updateDraft = (objId: number, field: string, value: any) => {
    setDrafts(prev => ({
      ...prev,
      [objId]: {
        ...prev[objId],
        [field]: value
      }
    }));
  };

  const handleSaveRequirement = (obj: EngineeringObject) => {
    const draft = getDraft(obj);
    onUpdateObject(obj.id, {
      title: draft.title?.trim(),
      pre_action: draft.pre_action?.trim(),
      description: draft.description?.trim(),
      owner_name: draft.owner_name?.trim(),
      post_action: draft.post_action?.trim(),
      status: draft.status,
      safety_level: draft.safety_level,
      priority: draft.priority,
      requirement_type: draft.requirement_type,
      test_subprocess: draft.test_subprocess
    });

    setSaveStatusMap(prev => ({ ...prev, [obj.id]: true }));
    setTimeout(() => {
      setSaveStatusMap(prev => ({ ...prev, [obj.id]: false }));
    }, 2500);
  };

  // Add Step for Test Cases
  const handleAddTestStepForObj = (objId: number, e: React.FormEvent) => {
    e.preventDefault();
    const action = stepActionMap[objId]?.trim();
    const expected = stepExpectedMap[objId]?.trim() || 'Verified output complies with requirements specification.';
    if (!action || !onAddTestStep) return;

    onAddTestStep(objId, action, expected);
    setStepActionMap(prev => ({ ...prev, [objId]: '' }));
    setStepExpectedMap(prev => ({ ...prev, [objId]: '' }));
  };

  // Add Test Case to Test Set
  const handleAddTestCaseToSetForObj = (setId: number, e: React.FormEvent) => {
    e.preventDefault();
    const tcId = addTestCaseIdMap[setId];
    if (!tcId || !onAddRelationship) return;
    onAddRelationship(tcId, setId, 'INCLUDED_IN');
    setAddTestCaseIdMap(prev => ({ ...prev, [setId]: null }));
  };


  // Create Folder Submit
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !onCreateFolder) return;
    const createdId = onCreateFolder(tracker.id, newFolderName.trim());
    if (typeof createdId === 'number') {
      setSelectedFolderId(createdId);
      setExpandedFolderIds(prev => [...prev, createdId]);
    }
    setNewFolderName('');
    setShowFolderModal(false);
  };

  // Right Panel: Active Object Data
  const activeObject = allObjects.find(o => o.id === selectedObjectId);
  const outgoingLinks = activeObject ? relationships.filter(r => r.source_id === activeObject.id) : [];
  const incomingLinks = activeObject ? relationships.filter(r => r.target_id === activeObject.id) : [];
  const activeObjectFiles = activeObject ? artifacts.filter(a => a.object_id === activeObject.id) : [];

  // Create Link Submit (Right Panel)
  const handleCreateLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObject || !targetObjId || !onAddRelationship) return;
    onAddRelationship(activeObject.id, targetObjId, relType);
    setShowLinkModal(false);
    setTargetObjId(null);
  };

  // Dedicated Edit Dashboard State (Point 3)
  const [editingObject, setEditingObject] = useState<EngineeringObject | null>(null);

  // File Upload Submit (Right Panel)
  const handleFileUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObject || !newFilename.trim() || !onAddArtifact) return;

    onAddArtifact({
      object_id: activeObject.id,
      filename: newFilename.trim(),
      category: newFileCategory,
      file_size: Math.floor(Math.random() * 5000000) + 500000,
      stored_path: `/artifacts/${newFilename.trim()}`
    });

    setNewFilename('');
    setShowFileModal(false);
  };

  // Enterprise Create Save handler (supports Save & Save and New)
  const handleEnterpriseSave = (data: any, closeAfter: boolean) => {
    const newId = onCreateObject({
      tracker_id: data.tracker_id,
      folder_id: data.folder_id,
      title: data.title,
      description: data.description,
      pre_action: data.pre_action,
      post_action: data.post_action,
      safety_level: data.safety_level,
      priority: data.priority,
      requirement_type: data.requirement_type,
      start_date: data.start_date,
      end_date: data.end_date,
      planned_effort: data.planned_effort,
      spent_effort: data.spent_effort,
      category: data.category,
      resolution: data.resolution,
      release: data.release,
      owner_name: data.owner_name
    });

    if (newId && data.association && onAddRelationship) {
      onAddRelationship(newId as number, data.association.target_id, data.association.type);
    }

    if (closeAfter) {
      setShowCreateModal(false);
    }
  };

  // Dedicated Requirement Edit Dashboard View (Point 3)
  if (editingObject) {
    const liveEditingObject = allObjects.find(o => o.id === editingObject.id) || editingObject;
    return (
      <RequirementEditDashboard
        object={liveEditingObject}
        tracker={tracker}
        allObjects={allObjects}
        folders={folders}
        relationships={relationships}
        testSteps={testSteps}
        artifacts={artifacts}
        testRuns={testRuns}
        onNavigateToTestRun={onNavigateToTestRun}
        onUpdateObject={(id, updates) => {
          onUpdateObject(id, updates);
          setEditingObject(prev => prev ? { ...prev, ...updates } : null);
        }}
        onAddTestStep={onAddTestStep}
        onDeleteTestStep={onDeleteTestStep}
        onAddRelationship={onAddRelationship}
        onDeleteRelationship={onDeleteRelationship}
        onCreateTestRun={handleTriggerCreateTestRun}
        onDone={() => setEditingObject(null)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }}>
      {/* ══════════════════════════════════════════════════════════════════
          TOP NAV BAR: Back to Dashboard & Tracker Identity
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        height: '52px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Back Button to Dashboard (Point 1) */}
          {onBackToDashboard && (
            <button
              {...createNewTabHandlers({ view: 'DASHBOARD', label: 'Project Dashboard' }, onBackToDashboard)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--accent-cyan)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Return to Project Dashboard&#10;💡 [Ctrl + Right-Click] Open in new tab"
            >
              <ArrowLeft size={15} />
              <span>← Back to Dashboard</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="mono" style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 8px',
              borderRadius: '5px'
            }}>
              {tracker.prefix || tracker.key}
            </span>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {cleanTrackerName(tracker.name)} Dashboard
            </h1>
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600
            }}>
              {objects.length} Total Objects
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Plus size={16} />
            <span>+ New Requirement</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3-PANEL SPLIT WORKSPACE
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ──────────────────────────────────────────────────────────────────
            LEFT PANEL: Folders in Series (Top to Down) with Dropdowns (Point 2)
            ────────────────────────────────────────────────────────────────── */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Bar & Add Folder Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search requirements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  paddingRight: '8px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  flex: 1,
                  marginRight: '8px',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEW">REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>

              <button
                onClick={() => setShowFolderModal(true)}
                title="Create Folder"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-cyan)',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={14} />
                <span>+ Folder</span>
              </button>
            </div>
          </div>

          {/* Vertical Folder Tree with Dropdown Contents (Point 2) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

              {/* All Items Option */}
              <div style={{
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: selectedFolderId === null ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => {
                    setSelectedFolderId(null);
                    setIsAllItemsExpanded(prev => !prev);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: selectedFolderId === null ? 'var(--accent-cyan)' : 'var(--text-main)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAllItemsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Folder size={16} color="var(--accent-cyan)" />
                    <span>All Items ({objects.length})</span>
                  </div>
                </div>

                {isAllItemsExpanded && (
                  <div style={{ padding: '4px 8px 8px 24px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)' }}>
                    {objects
                      .filter(obj => {
                        if (statusFilter && obj.status !== statusFilter) return false;
                        if (search.trim()) {
                          const s = search.toLowerCase();
                          return obj.object_key.toLowerCase().includes(s) ||
                                 obj.title.toLowerCase().includes(s) ||
                                 obj.description.toLowerCase().includes(s);
                        }
                        return true;
                      })
                      .map(obj => {
                        const isSelected = selectedObjectId === obj.id;
                        const objTabHandlers = createNewTabHandlers(
                          {
                            view: 'TRACKER',
                            trackerId: tracker.id,
                            objectId: obj.id,
                            objectKey: obj.object_key,
                            label: `[${obj.object_key}] ${obj.title}`
                          },
                          () => scrollToRequirementCard(obj, null)
                        );
                        return (
                          <div
                            key={obj.id}
                            {...objTabHandlers}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                              borderLeft: isSelected ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                            title={`[${obj.object_key}] ${obj.title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                          >
                            <span className="mono" style={{ fontSize: '0.72rem', opacity: 0.85 }}>[{obj.object_key}]</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj.title}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Folders List in Series (Top to Down) */}
              {folders.map(folder => {
                const folderObjects = objects.filter(o => o.folder_id === folder.id);
                const isExpanded = expandedFolderIds.includes(folder.id);
                const isFolderActive = selectedFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    style={{
                      borderRadius: '6px',
                      border: isFolderActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      backgroundColor: isFolderActive ? 'rgba(56, 189, 248, 0.06)' : 'var(--bg-card)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Folder Header - Click toggles dropdown */}
                    <div
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        toggleFolderDropdown(folder.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isFolderActive ? 'var(--accent-cyan)' : 'var(--text-main)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Folder size={16} color={isFolderActive ? 'var(--accent-cyan)' : 'var(--accent-amber)'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {folder.name}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: 'var(--bg-dark)',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        color: 'var(--text-muted)'
                      }}>
                        {folderObjects.length}
                      </span>
                    </div>

                    {/* Folder Dropdown: Requirements List */}
                    {isExpanded && (
                      <div style={{
                        padding: '6px 8px 8px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        borderTop: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-dark)'
                      }}>
                        {folderObjects.length === 0 ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                            Empty folder
                          </div>
                        ) : (
                          folderObjects.map(obj => {
                            const isSelected = selectedObjectId === obj.id;
                            const objTabHandlers = createNewTabHandlers(
                              {
                                view: 'TRACKER',
                                trackerId: tracker.id,
                                objectId: obj.id,
                                objectKey: obj.object_key,
                                label: `[${obj.object_key}] ${obj.title}`
                              },
                              () => scrollToRequirementCard(obj, folder.id)
                            );
                            return (
                              <div
                                key={obj.id}
                                {...objTabHandlers}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                  borderLeft: isSelected ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                                  fontSize: '0.78rem',
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`[${obj.object_key}] ${obj.title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                              >
                                <span className="mono" style={{ fontSize: '0.72rem', opacity: 0.85 }}>[{obj.object_key}]</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj.title}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            MIDDLE PANEL: Sequential Requirements with Dropdowns (Point 3)
            ────────────────────────────────────────────────────────────────── */}
        <div
          id="middle-requirements-panel"
          style={{
            flex: 1,
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            padding: '24px 28px',
            backgroundColor: 'var(--bg-dark)',
            display: 'flex',
            flexDirection: 'column'
        }}>
          {/* Top Control Bar for Requirements Sequence */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {selectedFolderId !== null
                  ? `Requirements in Folder: ${folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}`
                  : `All Requirements in ${cleanTrackerName(tracker.name)}`}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Showing {filteredObjects.length} requirements in sequential order • Click any requirement card to toggle its specification dropdown
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={expandAllRequirements}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAllRequirements}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Sequential List of Requirements (Each with its own Dropdown) */}
          {filteredObjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FileText size={42} style={{ opacity: 0.3, marginBottom: '14px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                No Requirements Found
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Click below to create a new requirement in this tracker.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                + Add Requirement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredObjects.map(obj => {
                const isExpanded = expandedReqIds.includes(obj.id);
                const isSelected = selectedObjectId === obj.id;
                const draft = getDraft(obj);
                const objSteps = testSteps.filter(s => s.test_case_id === obj.id);

                // Included test cases if test set
                const incRels = relationships.filter(r => r.target_id === obj.id && r.relationship_type === 'INCLUDED_IN');
                const incCases = incRels.map(r => ({ relId: r.id, tc: allObjects.find(o => o.id === r.source_id) })).filter(i => i.tc);
                const availCases = allObjects.filter(o =>
                  (o.type === 'TEST_CASE' || o.object_key.startsWith('SYS-TST')) &&
                  !incRels.some(r => r.source_id === o.id)
                );

                const renderObjCustomColumns = (targetRef: 'TITLE' | 'PRE_ACTION' | 'DESCRIPTION' | 'TEST_STEPS' | 'POST_ACTION', placement: 'ABOVE' | 'BELOW') => {
                  const cols = (obj.custom_columns || []).filter(c => c.position_reference === targetRef && c.placement === placement);
                  if (cols.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cols.map(col => (
                        <CustomColumnCard key={col.id} column={col} readOnly={true} />
                      ))}
                    </div>
                  );
                };

                const reqTabHandlers = createNewTabHandlers(
                  {
                    view: 'TRACKER',
                    trackerId: tracker.id,
                    objectId: obj.id,
                    objectKey: obj.object_key,
                    label: `[${obj.object_key}] ${obj.title}`
                  },
                  () => toggleRequirementDropdown(obj.id)
                );

                return (
                  <div
                    key={obj.id}
                    id={`req-card-${obj.id}`}
                    style={{
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* ═══ Header Bar (The card in the Green Box) - Click toggles Dropdown ═══ */}
                    <div
                      {...reqTabHandlers}
                      title={`[${obj.object_key}] ${obj.title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                      style={{
                        padding: '12px 18px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                        {isExpanded ? (
                          <ChevronDown size={18} color="var(--accent-cyan)" />
                        ) : (
                          <ChevronRight size={18} color="var(--text-muted)" />
                        )}

                        <span className="mono" style={{
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: 'var(--accent-cyan)',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '5px'
                        }}>
                          [{obj.object_key}]
                        </span>

                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {obj.title}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          v{obj.version}.0
                        </span>

                        {/* Dedicated Edit Dashboard Link (Point 2 & 3 - Beside Version Tag) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingObject(obj);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: 'var(--accent-cyan)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Open dedicated Requirement Edit Dashboard"
                        >
                          <span>✏️ Edit / Update ↗</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Status Badge (Updated in Yellow Box) */}
                        {(() => {
                          const matchingRun = isTestRunTracker ? testRuns.find(r => r.id === obj.id) : null;
                          const effectiveStatus = (isTestRunTracker && matchingRun?.overall_status) ? matchingRun.overall_status : (obj.status || 'NOT_RUN');
                          const norm = (effectiveStatus || '').toUpperCase();
                          
                          let bg = 'rgba(148, 163, 184, 0.15)';
                          let color = 'var(--text-muted)';
                          let border = '1px solid rgba(148, 163, 184, 0.3)';
                          
                          if (norm === 'PASS' || norm === 'APPROVED') {
                            bg = 'rgba(16, 185, 129, 0.2)';
                            color = '#10b981';
                            border = '1px solid rgba(16, 185, 129, 0.5)';
                          } else if (norm === 'FAIL') {
                            bg = 'rgba(239, 68, 68, 0.2)';
                            color = '#ef4444';
                            border = '1px solid rgba(239, 68, 68, 0.5)';
                          } else if (norm === 'BLOCKED') {
                            bg = 'rgba(245, 158, 11, 0.2)';
                            color = '#f59e0b';
                            border = '1px solid rgba(245, 158, 11, 0.5)';
                          } else if (norm === 'IN_PROGRESS' || norm === 'REVIEW') {
                            bg = 'rgba(56, 189, 248, 0.2)';
                            color = '#38bdf8';
                            border = '1px solid rgba(56, 189, 248, 0.5)';
                          }

                          return (
                            <span
                              className={`badge badge-${norm.toLowerCase().replace(/_/g, '-')}`}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '4px',
                                backgroundColor: bg,
                                color: color,
                                border: border,
                                letterSpacing: '0.03em'
                              }}
                            >
                              {effectiveStatus}
                            </span>
                          );
                        })()}

                        {/* Safety Level */}
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-cyan)'
                        }}>
                          {obj.safety_level || 'ASIL-D'}
                        </span>

                        {/* Owner Badge */}
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--accent-amber)',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          👤 {obj.owner_name || 'Zewd'}
                        </span>

                        {/* Quick Open in Console for Test Runs */}
                        {isTestRunTracker && (onNavigateToTestRun || onNavigateView) && (() => {
                          const matchingRun = testRuns.find(r => r.id === obj.id);
                          const targetId = matchingRun ? matchingRun.id : obj.id;
                          const runTabHandlers = createNewTabHandlers({
                            projectKey: tracker.prefix?.split('-')[0]?.toLowerCase() || 'robo',
                            view: 'test_execution',
                            runId: targetId,
                            label: obj.title || `Test Run #${targetId}`
                          }, (e) => {
                            e.stopPropagation();
                            if (onNavigateToTestRun) {
                              onNavigateToTestRun(targetId);
                            } else if (onNavigateView) {
                              onNavigateView('TEST_EXECUTION');
                            }
                          });
                          return (
                            <button
                              type="button"
                              {...runTabHandlers}
                              title="Open in Test Execution Console&#10;💡 [Ctrl + Click] or [Ctrl + Right-Click] Open in new tab"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(2, 132, 199, 0.3)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0369a1'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                            >
                              <Play size={12} fill="#ffffff" />
                              <span>Open in Console</span>
                            </button>
                          );
                        })()}

                        {/* Delete Button */}
                        {onDeleteObject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete requirement ${obj.object_key}?`)) {
                                onDeleteObject(obj.id);
                              }
                            }}
                            title="Delete"
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ═══ Dropdown Contents (Reveals when clicked / expanded - Pure Inspection View) ═══ */}
                    {isExpanded && (
                      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-dark)' }}>

                        {/* Custom Columns ABOVE Title */}
                        {renderObjCustomColumns('TITLE', 'ABOVE')}

                        {/* 1. Requirement Title Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                              Requirement Title
                            </span>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                              {obj.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => setEditingObject(obj)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: 'var(--accent-cyan)',
                              padding: '5px 12px',
                              borderRadius: '5px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <span>✏️ Edit / Update ↗</span>
                          </button>
                        </div>

                        {/* Custom Columns BELOW Title / ABOVE Pre-Action */}
                        {renderObjCustomColumns('TITLE', 'BELOW')}
                        {renderObjCustomColumns('PRE_ACTION', 'ABOVE')}

                        {/* 2. ⚡ Pre-Action (Initial / Preconditions) - Read Only Callout */}
                        <div style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.05)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '8px',
                          padding: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: 'var(--accent-amber)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800
                            }}>
                              ⚡ PRE-ACTION
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Initial System State, Hardware Preconditions &amp; Entry Criteria
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'var(--bg-card)',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}>
                            {obj.pre_action ? obj.pre_action : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pre-action specified. Click Edit / Update to add preconditions.</span>}
                          </div>
                        </div>

                        {/* Custom Columns BELOW Pre-Action / ABOVE Description */}
                        {renderObjCustomColumns('PRE_ACTION', 'BELOW')}
                        {renderObjCustomColumns('DESCRIPTION', 'ABOVE')}

                        {/* 3. Description (Detailed Specification) */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
                            Detailed Specification &amp; Description
                          </label>
                          <div style={{
                            fontSize: '0.88rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.55',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'var(--bg-card)',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)'
                          }}>
                            {obj.description ? obj.description : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</span>}
                          </div>
                        </div>

                        {/* 4. Metadata Badges Row */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '10px',
                          backgroundColor: 'var(--bg-card)',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              👤 Owner
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                              {obj.owner_name || 'Zewd'}
                            </span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Status
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: obj.status === 'APPROVED' ? 'var(--accent-emerald)' : obj.status === 'REVIEW' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                              {obj.status}
                            </span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Safety Level
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                              {obj.safety_level || 'ASIL-D'}
                            </span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Priority
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {obj.priority || 'MEDIUM'}
                            </span>
                          </div>
                          {obj.category && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Category
                              </span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {obj.category}
                              </span>
                            </div>
                          )}
                          {obj.release && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Release
                              </span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {obj.release}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Custom Columns BELOW Description / ABOVE Test Steps */}
                        {renderObjCustomColumns('DESCRIPTION', 'BELOW')}
                        {renderObjCustomColumns('TEST_STEPS', 'ABOVE')}

                        {/* 5. 🧪 Test Steps (if Test Case tracker) */}
                        {isTestCaseTracker && (
                          <div style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '14px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ListOrdered size={16} color="var(--accent-cyan)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  Test Steps ({objSteps.length})
                                </span>
                              </div>
                              <button
                                onClick={() => setEditingObject(obj)}
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--accent-cyan)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Edit Steps ↗
                              </button>
                            </div>

                            {objSteps.length === 0 ? (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                                No test steps defined for this test case. Click Edit / Update to add steps.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {objSteps.map((step, idx) => (
                                  <div key={step.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '28px 1fr 1fr',
                                    gap: '10px',
                                    alignItems: 'center',
                                    backgroundColor: 'var(--bg-dark)',
                                    border: '1px solid var(--border-color)',
                                    padding: '8px 10px',
                                    borderRadius: '5px',
                                    fontSize: '0.8rem'
                                  }}>
                                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', textAlign: 'center' }}>#{idx + 1}</span>
                                    <div>{step.action}</div>
                                    <div style={{ color: 'var(--accent-emerald)' }}>{step.expected_result}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* If Test Set tracker: Grouped Test Cases for Verification */}
                        {isTestSetTracker && (() => {
                          const setRuns = getTestRunsForSet(obj);
                          const isRunsOpen = openRunsDropdownSetIds.has(obj.id);

                          return (
                          <div style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  Included Test Cases ({incCases.length})
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                  • Group of test cases to verify
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Button / Dropdown Toggle for Created Test Runs */}
                                <button
                                  type="button"
                                  onClick={() => toggleRunsDropdown(obj.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: isRunsOpen ? 'rgba(56, 189, 248, 0.22)' : setRuns.length > 0 ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-dark)',
                                    border: `1px solid ${isRunsOpen || setRuns.length > 0 ? 'rgba(56, 189, 248, 0.45)' : 'var(--border-color)'}`,
                                    color: isRunsOpen || setRuns.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={`Click to view details of ${setRuns.length} Test Run${setRuns.length === 1 ? '' : 's'} created from this Test Set`}
                                >
                                  <Activity size={13} />
                                  <span>Test Runs ({setRuns.length})</span>
                                  <ChevronDown
                                    size={13}
                                    style={{
                                      transform: isRunsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s ease'
                                    }}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setManagingTestSet(obj)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    color: 'var(--accent-cyan)',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Add or remove test cases in this test set"
                                >
                                  <Plus size={13} />
                                  <span>Add Test Cases</span>
                                </button>

                                {onCreateTestRun && (
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerCreateTestRun(obj)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      color: 'var(--accent-emerald)',
                                      padding: '5px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title={`Create Test Run for ${obj.title || obj.object_key} in the single Test Runs tracker`}
                                  >
                                    <Play size={13} />
                                    <span>Create Test Run</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Test Runs Details Dropdown Section */}
                            {isRunsOpen && (
                              <div style={{
                                marginBottom: '16px',
                                backgroundColor: 'var(--bg-dark)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={15} color="var(--accent-cyan)" />
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                      Test Runs Created from [{obj.object_key}] ({setRuns.length})
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    All execution runs created from this test set
                                  </span>
                                </div>

                                {setRuns.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {setRuns.map(run => (
                                      <div
                                        key={run.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '10px 14px',
                                          borderRadius: '6px',
                                          backgroundColor: 'var(--bg-card)',
                                          border: '1px solid var(--border-color)',
                                          gap: '12px',
                                          flexWrap: 'wrap'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '2px 7px', borderRadius: '4px' }}>
                                            {run.key}
                                          </span>
                                          <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                              {run.name}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                                              <span>Tester: <strong>{run.tester_name}</strong></span>
                                              <span>•</span>
                                              <span>Date: {run.started_at ? new Date(run.started_at).toLocaleString() : 'Recent'}</span>
                                              <span>•</span>
                                              <span>Config: {run.config_name}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span className={`badge badge-${(run.status || 'NOT_RUN').toLowerCase().replace(/_/g, '-')}`}>
                                            {run.status || 'NOT_RUN'}
                                          </span>

                                          <button
                                            type="button"
                                            {...createNewTabHandlers({
                                              projectKey: tracker.prefix?.split('-')[0]?.toLowerCase() || 'robo',
                                              view: 'test_execution',
                                              runId: run.id,
                                              label: run.name || `Test Run #${run.id}`
                                            }, () => {
                                              if (onNavigateToTestRun) {
                                                onNavigateToTestRun(run.id);
                                              } else if (onNavigateView) {
                                                onNavigateView('TEST_EXECUTION');
                                              }
                                            })}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '5px',
                                              padding: '5px 12px',
                                              borderRadius: '6px',
                                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                              border: '1px solid rgba(16, 185, 129, 0.4)',
                                              color: 'var(--accent-emerald)',
                                              fontSize: '0.75rem',
                                              fontWeight: 700,
                                              cursor: 'pointer'
                                            }}
                                            title="Open this Test Run in the Execution dashboard&#10;💡 [Ctrl + Click] or [Ctrl + Right-Click] Open in new tab"
                                          >
                                            <Play size={12} />
                                            <span>Execute / View Run ↗</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{
                                    padding: '16px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: '6px',
                                    border: '1px dashed var(--border-color)'
                                  }}>
                                    No test runs have been created from this test set yet. Click <strong>"Create Test Run"</strong> above to generate the first run in the single Test Runs tracker.
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {incCases.length === 0 ? (
                                <div style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--text-muted)',
                                  padding: '16px',
                                  textAlign: 'center',
                                  backgroundColor: 'var(--bg-dark)',
                                  borderRadius: '6px',
                                  border: '1px dashed var(--border-color)'
                                }}>
                                  <div>No test cases added to this test set yet.</div>
                                  <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>
                                    Group test cases together to execute a structured test run.
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setManagingTestSet(obj)}
                                    style={{
                                      marginTop: '10px',
                                      backgroundColor: 'var(--accent-cyan)',
                                      color: '#000',
                                      border: 'none',
                                      borderRadius: '5px',
                                      padding: '6px 14px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    + Add Test Cases to Group
                                  </button>
                                </div>
                              ) : (
                                incCases.map(item => {
                                  const stepCount = testSteps.filter(s => s.test_case_id === item.tc?.id).length;
                                  return (
                                    <div
                                      key={item.relId}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: 'var(--bg-dark)',
                                        border: '1px solid var(--border-color)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.82rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                        <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 800, flexShrink: 0 }}>
                                          [{item.tc?.object_key}]
                                        </span>
                                        <span style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {item.tc?.title}
                                        </span>
                                        <span style={{
                                          fontSize: '0.68rem',
                                          color: 'var(--text-muted)',
                                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          flexShrink: 0
                                        }}>
                                          {stepCount} {stepCount === 1 ? 'Step' : 'Steps'}
                                        </span>
                                        {item.tc?.status && (
                                          <span className={`badge badge-${item.tc.status.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                                            {item.tc.status}
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteRelationship(item.relId);
                                        }}
                                        title="Remove test case from this test set"
                                        style={{
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          borderRadius: '4px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ); })()}

                        {/* If Test Run tracker: Execution Test Run Summary */}
                        {isTestRunTracker && (
                          <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.04)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            borderRadius: '8px',
                            padding: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Play size={16} color="var(--accent-emerald)" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  Execution Test Run
                                </span>
                                {(() => {
                                  const matchingRun = testRuns.find(r => r.id === obj.id);
                                  const effectiveStatus = matchingRun?.overall_status || obj.status || 'NOT_RUN';
                                  return (
                                    <span className={`badge badge-${effectiveStatus.toLowerCase().replace(/_/g, '-')}`}>
                                      {effectiveStatus}
                                    </span>
                                  );
                                })()}
                              </div>

                              {(onNavigateToTestRun || onNavigateView) && (() => {
                                const matchingRun = testRuns.find(r => r.id === obj.id);
                                const targetId = matchingRun ? matchingRun.id : obj.id;
                                const consoleTabHandlers = createNewTabHandlers({
                                  projectKey: tracker.prefix?.split('-')[0]?.toLowerCase() || 'robo',
                                  view: 'test_execution',
                                  runId: targetId,
                                  label: obj.title || `Test Run #${targetId}`
                                }, () => {
                                  if (onNavigateToTestRun) {
                                    onNavigateToTestRun(targetId);
                                  } else if (onNavigateView) {
                                    onNavigateView('TEST_EXECUTION');
                                  }
                                });
                                return (
                                  <button
                                    type="button"
                                    {...consoleTabHandlers}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      backgroundColor: '#0284c7',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '6px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Open in Test Execution Console&#10;💡 [Ctrl + Click] or [Ctrl + Right-Click] Open in new tab"
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0369a1'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                                  >
                                    <Play size={14} fill="#ffffff" />
                                    <span>Open in Test Execution Console</span>
                                  </button>
                                );
                              })()}
                            </div>

                            {(() => {
                              const execRel = relationships.find(r => r.source_id === obj.id && r.relationship_type === 'EXECUTED_FROM');
                              const origSet = execRel ? allObjects.find(o => o.id === execRel.target_id) : null;
                              return origSet ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Originating Test Set: <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>[{origSet.object_key}]</strong> {origSet.title}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {/* Custom Columns BELOW Test Steps / ABOVE Post-Action */}
                        {renderObjCustomColumns('TEST_STEPS', 'BELOW')}
                        {renderObjCustomColumns('POST_ACTION', 'ABOVE')}

                        {/* 6. 🎯 Post-Action (Exit / Postconditions) - Read Only Callout */}
                        <div style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '8px',
                          padding: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: 'var(--accent-emerald)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800
                            }}>
                              🎯 POST-ACTION
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Final Exit State, Postconditions, Safety Hold &amp; Verification Output
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'var(--bg-card)',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            {obj.post_action ? obj.post_action : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No post-action specified. Click Edit / Update to add postconditions.</span>}
                          </div>
                        </div>

                        {/* Custom Columns BELOW Post-Action */}
                        {renderObjCustomColumns('POST_ACTION', 'BELOW')}

                        {/* 7. Bottom Navigation Info Bar (No Save Changes button as requested) */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)'
                        }}>
                          <span>
                            Inspection View • To update title, pre-action, post-action, or test steps, click <strong>Edit / Update ↗</strong>.
                          </span>
                          <button
                            onClick={() => setEditingObject(obj)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: 'var(--accent-cyan)',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            <span>✏️ Open Edit Dashboard ↗</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT PANEL: Features, Traceability & Artifacts
            ────────────────────────────────────────────────────────────────── */}
        <div style={{
          width: '380px',
          flexShrink: 0,
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '22px'
        }}>
          {!activeObject ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Layers size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.85rem' }}>Select or expand a requirement to view its traceability and features.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Requirement Badge Header */}
              <div style={{
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                padding: '12px 14px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  ACTIVE INSPECTION ITEM
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                  <span className="mono" style={{ color: 'var(--accent-cyan)', marginRight: '6px' }}>[{activeObject.object_key}]</span>
                  {activeObject.title}
                </div>
              </div>

              {/* Quick Actions for Test Sets */}
              {isTestSetTracker && (() => {
                const setRuns = getTestRunsForSet(activeObject);
                const isRunsOpen = openRunsDropdownSetIds.has(activeObject.id);
                return (
                  <div style={{
                    backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Test Set Verification Group
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {relationships.filter(r => r.target_id === activeObject.id && r.relationship_type === 'INCLUDED_IN').length} Cases
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                      <span>Test Runs Created:</span>
                      <strong style={{ color: setRuns.length > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {setRuns.length} Run{setRuns.length === 1 ? '' : 's'}
                      </strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setManagingTestSet(activeObject)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: 'var(--accent-cyan)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                        <span>Add Cases</span>
                      </button>

                      {onCreateTestRun && (
                        <button
                          type="button"
                          onClick={() => handleTriggerCreateTestRun(activeObject)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: 'var(--accent-emerald)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Play size={12} />
                          <span>Run Set</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRunsDropdown(activeObject.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: isRunsOpen ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: isRunsOpen ? 'var(--accent-cyan)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Activity size={12} />
                      <span>{isRunsOpen ? 'Hide Runs Details' : `View ${setRuns.length} Test Runs`}</span>
                      <ChevronDown size={12} style={{ transform: isRunsOpen ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </div>
                );
              })()}

              {/* Quick Action for Test Runs */}
              {isTestRunTracker && (onNavigateToTestRun || onNavigateView) && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '12px 14px',
                  borderRadius: '8px'
                }}>
                  {(() => {
                    const matchingRun = activeObject ? testRuns.find(r => r.id === activeObject.id) : null;
                    const effectiveStatus = matchingRun?.overall_status || activeObject?.status || 'NOT_RUN';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status in Tracker:</span>
                        <span className={`badge badge-${effectiveStatus.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                          {effectiveStatus}
                        </span>
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Execution Test Run ready for step-by-step verification.
                  </div>
                  {(() => {
                    const matchingRun = activeObject ? testRuns.find(r => r.id === activeObject.id) : null;
                    const targetId = matchingRun ? matchingRun.id : (activeObject?.id || 0);
                    const consoleDrawerHandlers = createNewTabHandlers({
                      projectKey: tracker.prefix?.split('-')[0]?.toLowerCase() || 'robo',
                      view: 'test_execution',
                      runId: targetId,
                      label: activeObject?.title || `Test Run #${targetId}`
                    }, () => {
                      if (onNavigateToTestRun && activeObject) {
                        onNavigateToTestRun(targetId);
                      } else if (onNavigateView) {
                        onNavigateView('TEST_EXECUTION');
                      }
                    });
                    return (
                      <button
                        type="button"
                        {...consoleDrawerHandlers}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Open in Test Execution Console&#10;💡 [Ctrl + Click] or [Ctrl + Right-Click] Open in new tab"
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0369a1'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                      >
                        <Play size={14} fill="#ffffff" />
                        <span>Open in Test Execution Console</span>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Section 1: Traceability & Relationships */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={15} color="var(--accent-cyan)" />
                    <span>Traceability & Links ({outgoingLinks.length + incomingLinks.length})</span>
                  </h3>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--accent-cyan)',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} />
                    <span>+ Link</span>
                  </button>
                </div>

                {outgoingLinks.length === 0 && incomingLinks.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '6px' }}>
                    No traceability links established. Click "+ Link" to allocate architecture, verify with test cases, or mitigate hazards.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {outgoingLinks.map(rel => {
                      const targetObj = allObjects.find(o => o.id === rel.target_id);
                      return (
                        <div key={rel.id} style={{
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: 'var(--accent-cyan)',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}>
                              ➔ {rel.relationship_type.replace(/_/g, ' ')}
                            </span>
                            <button
                              onClick={() => onDeleteRelationship(rel.id)}
                              style={{ border: 'none', background: 'transparent', color: 'var(--accent-rose)', cursor: 'pointer' }}
                              title="Delete Link"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            <span className="mono" style={{ color: 'var(--accent-cyan)', marginRight: '6px' }}>[{targetObj?.object_key || 'OBJ'}]</span>
                            {targetObj?.title || 'Linked Target'}
                          </div>
                        </div>
                      );
                    })}

                    {incomingLinks.map(rel => {
                      const sourceObj = allObjects.find(o => o.id === rel.source_id);
                      return (
                        <div key={rel.id} style={{
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: 'var(--accent-amber)',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}>
                              ⬅ {rel.relationship_type.replace(/_/g, ' ')} by
                            </span>
                            <button
                              onClick={() => onDeleteRelationship(rel.id)}
                              style={{ border: 'none', background: 'transparent', color: 'var(--accent-rose)', cursor: 'pointer' }}
                              title="Delete Link"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            <span className="mono" style={{ color: 'var(--accent-amber)', marginRight: '6px' }}>[{sourceObj?.object_key || 'OBJ'}]</span>
                            {sourceObj?.title || 'Source Object'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Attached CAD / PDFs / Logs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={15} color="var(--accent-purple)" />
                    <span>Attached Files ({activeObjectFiles.length})</span>
                  </h3>
                  <button
                    onClick={() => setShowFileModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: 'var(--accent-purple)',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} />
                    <span>+ File</span>
                  </button>
                </div>

                {activeObjectFiles.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '6px' }}>
                    No files attached to this requirement.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeObjectFiles.map(file => (
                      <div key={file.id} style={{
                        backgroundColor: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.filename}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {file.category} • {(file.file_size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>

                        {onDeleteArtifact && (
                          <button
                            onClick={() => onDeleteArtifact(file.id)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--accent-rose)', cursor: 'pointer' }}
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Version & Governance Trail */}
              <div style={{
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Clock size={13} />
                  <span>Version & Governance Trail</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div><strong>Current Revision:</strong> <span className="mono">v{activeObject.version}.0</span></div>
                  <div><strong>Created:</strong> {new Date(activeObject.created_at).toLocaleDateString()}</div>
                  <div><strong>Author:</strong> 👑 Zewd (Owner)</div>
                  <div><strong>Safety Classification:</strong> {activeObject.safety_level}</div>
                </div>
              </div>

              {/* Section 4: Quick Impact Analysis Link */}
              {onSelectObjectForImpact && (
                <button
                  onClick={() => onSelectObjectForImpact(activeObject.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    color: 'var(--accent-cyan)',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Activity size={15} />
                  <span>Run Traceability Impact Analysis →</span>
                </button>
              )}

            </div>
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS: Create Object, Folder, Link, File
          ══════════════════════════════════════════════════════════════════ */}

      {/* 1. Codebeamer Enterprise Create Requirement / Test Case Modal (Point 1) */}
      <EnterpriseCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tracker={tracker}
        folders={folders}
        allObjects={allObjects}
        selectedFolderId={selectedFolderId}
        onSave={handleEnterpriseSave}
      />

      {/* 2. Create Folder Modal */}
      {showFolderModal && (
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
            width: '400px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-cyan)' }}>
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolderSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. Navigation Subsystem Specs"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Link Relationship Modal (Right Panel) */}
      {showLinkModal && activeObject && (
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
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              Link Traceability Relationship
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Connect <strong>[{activeObject.object_key}]</strong> to upstream architecture, verification test cases, or safety hazards.
            </p>

            <form onSubmit={handleCreateLinkSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Relationship Type
                </label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="VERIFIED_BY">VERIFIED_BY (Test Cases)</option>
                  <option value="ALLOCATED_TO">ALLOCATED_TO (Architecture)</option>
                  <option value="MITIGATED_BY">MITIGATED_BY (Risk / Safety)</option>
                  <option value="DERIVED_TO">DERIVED_TO (Subsystem Reqs)</option>
                  <option value="DEPENDS_ON">DEPENDS_ON (General Dependency)</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Target Engineering Object *
                </label>
                <select
                  required
                  value={targetObjId || ''}
                  onChange={(e) => setTargetObjId(Number(e.target.value) || null)}
                  style={{ width: '100%' }}
                >
                  <option value="">Select target object to trace...</option>
                  {allObjects.filter(o => o.id !== activeObject.id).map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.object_key}] {o.title} ({o.type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetObjId}
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Establish Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Attach File Modal (Right Panel) */}
      {showFileModal && activeObject && (
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
            width: '440px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px' }}>
              Attach File to [{activeObject.object_key}]
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upload CAD models (.step), test logs, or technical specification PDFs.
            </p>

            <form onSubmit={handleFileUploadSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Filename *
                </label>
                <input
                  type="text"
                  required
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. Nav2_LocalPlanner_Bench_Results.pdf"
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="PDF">PDF Specification</option>
                  <option value="CAD">CAD / STEP Assembly</option>
                  <option value="CSV">CSV / Excel Telemetry</option>
                  <option value="OTHER">Other Technical Attachment</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFilename.trim()}
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--accent-purple)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Attach File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Group Test Cases into Test Set Modal */}
      {managingTestSet && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            width: '780px',
            maxWidth: '92vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-sidebar)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    [{managingTestSet.object_key}]
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Group Test Cases into Test Set
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Select test cases across the project to group into <strong>{managingTestSet.title}</strong>
                </p>
              </div>

              <button
                onClick={() => setManagingTestSet(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-dark)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search test cases by key, title, folder..."
                  value={testCaseSearch}
                  onChange={(e) => setTestCaseSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem', height: '36px' }}
                />
              </div>
            </div>

            {/* Test Cases List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const currentSetRels = relationships.filter(r => r.target_id === managingTestSet.id && r.relationship_type === 'INCLUDED_IN');
                const candidateTestCases = allObjects.filter(o =>
                  o.id !== managingTestSet.id &&
                  (
                    o.type === 'TEST_CASE' ||
                    o.object_key.startsWith('SYS-TST') ||
                    o.object_key.includes('-TST') ||
                    o.object_key.includes('-TC') ||
                    o.tracker_name.toLowerCase().includes('test case') ||
                    testSteps.some(s => s.test_case_id === o.id)
                  )
                ).filter(o => {
                  if (!testCaseSearch.trim()) return true;
                  const s = testCaseSearch.toLowerCase();
                  return o.object_key.toLowerCase().includes(s) ||
                         o.title.toLowerCase().includes(s) ||
                         (o.folder_name && o.folder_name.toLowerCase().includes(s)) ||
                         (o.tracker_name && o.tracker_name.toLowerCase().includes(s));
                });

                if (candidateTestCases.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No test cases match your search query.
                    </div>
                  );
                }

                return candidateTestCases.map(tc => {
                  const existingRel = currentSetRels.find(r => r.source_id === tc.id);
                  const isIncluded = Boolean(existingRel);
                  const stepCount = testSteps.filter(s => s.test_case_id === tc.id).length;

                  return (
                    <div
                      key={tc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: isIncluded ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-dark)',
                        border: isIncluded ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="mono" style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: 'var(--accent-cyan)'
                          }}>
                            [{tc.object_key}]
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {tc.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {tc.folder_name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Folder size={11} /> {tc.folder_name}
                            </span>
                          )}
                          <span>• Tracker: {cleanTrackerName(tc.tracker_name)}</span>
                          <span>• {stepCount} Procedure {stepCount === 1 ? 'Step' : 'Steps'}</span>
                          {tc.status && (
                            <span className={`badge badge-${tc.status.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.62rem' }}>
                              {tc.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isIncluded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--accent-emerald)',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              <CheckCircle2 size={13} />
                              <span>Included</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (existingRel) onDeleteRelationship(existingRel.id);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: 'var(--accent-rose)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Remove from test set"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onAddRelationship(tc.id, managingTestSet.id, 'INCLUDED_IN');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={13} />
                            <span>Add to Set</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-sidebar)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {(() => {
                const count = relationships.filter(r => r.target_id === managingTestSet.id && r.relationship_type === 'INCLUDED_IN').length;
                return (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Currently grouped: <strong style={{ color: 'var(--accent-cyan)' }}>{count} Test {count === 1 ? 'Case' : 'Cases'}</strong> in this Test Set
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px' }}>
                {onCreateTestRun && (
                  <button
                    type="button"
                    onClick={() => {
                      const setObj = managingTestSet;
                      setManagingTestSet(null);
                      handleTriggerCreateTestRun(setObj);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: 'var(--accent-emerald)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={13} />
                    <span>Create Test Run from this Set</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setManagingTestSet(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Test Run Created Success Toast / Modal */}
      {createdRunToast && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            width: '500px',
            padding: '26px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                borderRadius: '50%',
                padding: '6px',
                display: 'flex'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Test Run Created!
              </h3>
            </div>

            <div style={{ backgroundColor: 'var(--bg-dark)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Test Run Name
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {createdRunToast.runName}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Created in single tracker: <strong style={{ color: 'var(--accent-emerald)' }}>{createdRunToast.trackerName}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
              This test run is organized in the central <strong>{createdRunToast.trackerName}</strong> tracker and populated with all test cases ready for execution.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCreatedRunToast(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-dark)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Close
              </button>

              {onNavigateTracker && (
                <button
                  type="button"
                  onClick={() => {
                    const tr = createdRunToast.testRunTracker;
                    const objId = createdRunToast.runObjId;
                    setCreatedRunToast(null);
                    onNavigateTracker(tr, objId);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Go to Test Runs Tracker</span>
                </button>
              )}

              {onNavigateView && (
                <button
                  type="button"
                  {...createNewTabHandlers({
                    projectKey: tracker?.prefix?.split('-')[0]?.toLowerCase() || 'robo',
                    view: 'test_execution',
                    runId: createdRunToast.runId,
                    label: createdRunToast.runName || `Test Run #${createdRunToast.runId}`
                  }, () => {
                    setCreatedRunToast(null);
                    if (onNavigateToTestRun && createdRunToast.runId) {
                      onNavigateToTestRun(createdRunToast.runId);
                    } else {
                      onNavigateView('TEST_EXECUTION');
                    }
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Open in Execution Console&#10;💡 [Ctrl + Click] or [Ctrl + Right-Click] Open in new tab"
                >
                  <Play size={13} />
                  <span>Open in Execution Console</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
