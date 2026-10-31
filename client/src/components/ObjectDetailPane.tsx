import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Link as LinkIcon, Trash2, ArrowRight, ArrowLeft, Plus, ListOrdered, FileText, Download, Paperclip, Layers, CheckSquare, UploadCloud, ExternalLink } from 'lucide-react';
import { EngineeringObject, RequirementType, SafetyLevel, TestSubProcess, Folder as FolderType, Relationship, TestStep, Artifact, Tracker } from '../types/elm';
import { SearchableItemSelect } from './SearchableItemSelect';

interface ObjectDetailPaneProps {
  objectId: number;
  object?: EngineeringObject;
  tracker?: Tracker;
  allObjects?: EngineeringObject[];
  folders?: FolderType[];
  relationships?: Relationship[];
  testSteps?: TestStep[];
  artifacts?: Artifact[];
  onClose: () => void;
  onUpdateObject: (id: number, updates: Partial<EngineeringObject>) => void;
  onDeleteObject?: (id: number) => void;
  onAddRelationship?: (source_id: number, target_id: number, type: string) => void;
  onDeleteRelationship?: (id: number) => void;
  onAddTestStep?: (test_case_id: number, action: string, expected_result: string) => void;
  onDeleteTestStep?: (id: number) => void;
  onAddArtifact?: (data: { object_id?: number; filename: string; category: any; file_size?: number; stored_path?: string }) => void;
  onDeleteArtifact?: (id: number) => void;
  onSelectForImpact?: (objId: number) => void;
  onNavigateToObject?: (objectId: number) => void;
}

export const ObjectDetailPane: React.FC<ObjectDetailPaneProps> = ({
  objectId,
  object,
  tracker,
  allObjects = [],
  folders = [],
  relationships = [],
  testSteps = [],
  artifacts = [],
  onClose,
  onUpdateObject,
  onDeleteObject,
  onAddRelationship,
  onDeleteRelationship,
  onAddTestStep,
  onDeleteTestStep,
  onAddArtifact,
  onDeleteArtifact,
  onSelectForImpact,
  onNavigateToObject
}) => {
  const isTestCase = tracker?.enable_test_steps ?? (object?.type === 'TEST_CASE' || object?.object_key.startsWith('SYS-TST'));
  const isTestSet = object?.type === 'TEST_SET' || object?.object_key.startsWith('TST-SET');
  const isArchitecture = object?.type === 'ARCHITECTURE';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STEPS' | 'TEST_CASES' | 'TRACEABILITY' | 'FILES' | 'VERSIONS'>(
    isTestSet ? 'TEST_CASES' : isArchitecture ? 'FILES' : isTestCase ? 'STEPS' : 'OVERVIEW'
  );

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reqType, setReqType] = useState<RequirementType>('Functional Requirement');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>('ASIL-D');
  const [testProcess, setTestProcess] = useState<TestSubProcess>('System Testing');
  const [folderId, setFolderId] = useState<number | null>(null);

  // Active object being inspected inside detail pane
  const [currentInspectId, setCurrentInspectId] = useState<number>(objectId);

  useEffect(() => {
    setCurrentInspectId(objectId);
  }, [objectId]);

  const activeObject = allObjects.find(o => o.id === currentInspectId) || object;

  // Link Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetObjId, setTargetObjId] = useState<number | null>(null);
  const [relType, setRelType] = useState<string>('VERIFIED_BY');

  // Test Step state
  const [newAction, setNewAction] = useState('');
  const [newExpectedResult, setNewExpectedResult] = useState('');

  // Add Test Case to Test Set state
  const [addTestCaseId, setAddTestCaseId] = useState<number | null>(null);

  // File Attachment State
  const [newFilename, setNewFilename] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'PDF' | 'CAD' | 'CSV' | 'OTHER'>('PDF');
  const [inspectorSelectedFile, setInspectorSelectedFile] = useState<File | null>(null);
  const [inspectorStoredPath, setInspectorStoredPath] = useState<string>('');
  const [inspectorFileSize, setInspectorFileSize] = useState<number>(0);

  const inspectorFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeObject) {
      setTitle(activeObject.title);
      setDesc(activeObject.description || '');
      setStatus(activeObject.status);
      setPriority(activeObject.priority);
      setReqType(activeObject.requirement_type || 'Functional Requirement');
      setSafetyLevel(activeObject.safety_level || 'ASIL-D');
      setTestProcess(activeObject.test_subprocess || 'System Testing');
      setFolderId(activeObject.folder_id || null);
    }
  }, [activeObject]);

  if (!activeObject) return null;

  const caseSteps = testSteps.filter(s => s.test_case_id === activeObject.id);
  const objectFiles = artifacts.filter(a => a.object_id === activeObject.id);
  const selectedFolder = folders.find(f => f.id === folderId);

  const outgoingLinks = relationships.filter(r => r.source_id === activeObject.id);
  const incomingLinks = relationships.filter(r => r.target_id === activeObject.id);

  // Included Test Cases inside Test Set (via INCLUDED_IN relationship where target is this Test Set)
  const includedTestCaseRels = relationships.filter(r => r.target_id === activeObject.id && r.relationship_type === 'INCLUDED_IN');
  const includedTestCases = includedTestCaseRels.map(r => {
    const tcObj = allObjects.find(o => o.id === r.source_id);
    return { relId: r.id, tcObj };
  }).filter(item => item.tcObj !== undefined);

  // Available Test Cases not yet included in this Test Set
  const availableTestCases = allObjects.filter(o =>
    (o.type === 'TEST_CASE' || o.object_key.startsWith('SYS-TST')) &&
    !includedTestCaseRels.some(r => r.source_id === o.id)
  );

  const handleSave = () => {
    onUpdateObject(activeObject.id, {
      title: title.trim(),
      description: desc.trim(),
      status,
      priority,
      requirement_type: reqType,
      safety_level: safetyLevel,
      test_subprocess: testProcess,
      folder_id: folderId,
      folder_name: selectedFolder?.name || null
    });
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetObjId || !onAddRelationship) return;
    onAddRelationship(activeObject.id, targetObjId, relType);
    setShowLinkModal(false);
    setTargetObjId(null);
  };

  const handleAddTestCaseToSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTestCaseId || !onAddRelationship) return;
    onAddRelationship(addTestCaseId, activeObject.id, 'INCLUDED_IN');
    setAddTestCaseId(null);
  };

  const handleCreateTestStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim() || !newExpectedResult.trim() || !onAddTestStep) return;
    onAddTestStep(activeObject.id, newAction.trim(), newExpectedResult.trim());
    setNewAction('');
    setNewExpectedResult('');
  };

  const handleInspectorFileSelect = (file: File) => {
    setInspectorSelectedFile(file);
    setNewFilename(file.name);
    setInspectorFileSize(file.size);

    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith('.pdf')) setNewFileCategory('PDF');
    else if (nameLower.endsWith('.step') || nameLower.endsWith('.stl') || nameLower.endsWith('.dwg') || nameLower.endsWith('.dxf') || nameLower.endsWith('.cad')) setNewFileCategory('CAD');
    else if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.csv')) setNewFileCategory('CSV');
    else setNewFileCategory('OTHER');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setInspectorStoredPath(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInspectorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleInspectorFileSelect(e.target.files[0]);
    }
  };

  const handleAttachFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilename.trim() || !onAddArtifact) return;

    onAddArtifact({
      object_id: activeObject.id,
      filename: newFilename.trim(),
      category: newFileCategory,
      file_size: inspectorFileSize || undefined,
      stored_path: inspectorStoredPath || undefined
    });

    setNewFilename('');
    setInspectorSelectedFile(null);
    setInspectorStoredPath('');
    setInspectorFileSize(0);
  };

  const handleDownload = (art: Artifact) => {
    if (art.stored_path && (art.stored_path.startsWith('data:') || art.stored_path.startsWith('blob:'))) {
      const link = document.createElement('a');
      link.href = art.stored_path;
      link.download = art.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `=======================================================
ROBOSERV ELM SYSTEM ARTIFACT DOCUMENT
Filename: ${art.filename}
Record Key: ${art.object_key || 'DOC'}
Record Title: ${art.object_title || 'Attached Record File'}
Category: ${art.category}
Uploaded By: ${art.uploader_name || 'Zewd'}
Created At: ${art.created_at}
=======================================================

Systems Engineering & ISO 13482 Safety Compliance Spec for Autonomous Restaurant Delivery Robot (RoboServ-X1).
Author: Zewd (Lead Systems Engineer)
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = art.filename.includes('.') ? art.filename : `${art.filename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  return (
    <div style={{
      width: '490px',
      backgroundColor: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex: 50
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {activeObject.object_key}
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              v{activeObject.version}
            </span>
            {currentInspectId !== objectId && (
              <button
                onClick={() => setCurrentInspectId(objectId)}
                style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'transparent', fontWeight: 700 }}
              >
                ⬅ Back to Test Set
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tracker: <strong style={{ color: 'var(--text-main)' }}>{activeObject.tracker_name || activeObject.type}</strong>
          </div>
        </div>

        <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent' }}>
          <X size={20} />
        </button>
      </div>

      {/* Prominent Tab Navigation Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)' }}>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
            color: activeTab === 'OVERVIEW' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'OVERVIEW' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
          }}
        >
          Overview
        </button>

        {isTestSet && (
          <button
            onClick={() => setActiveTab('TEST_CASES')}
            style={{
              flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
              color: activeTab === 'TEST_CASES' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'TEST_CASES' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
            }}
          >
            Test Cases ({includedTestCases.length})
          </button>
        )}

        {isTestCase && (
          <button
            onClick={() => setActiveTab('STEPS')}
            style={{
              flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
              color: activeTab === 'STEPS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'STEPS' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
            }}
          >
            Steps ({caseSteps.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('FILES')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
            color: activeTab === 'FILES' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'FILES' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
          }}
        >
          Files ({objectFiles.length})
        </button>

        <button
          onClick={() => setActiveTab('TRACEABILITY')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
            color: activeTab === 'TRACEABILITY' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'TRACEABILITY' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
          }}
        >
          Traceability ({outgoingLinks.length + incomingLinks.length})
        </button>

        <button
          onClick={() => setActiveTab('VERSIONS')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600,
            color: activeTab === 'VERSIONS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'VERSIONS' ? '2px solid var(--accent-cyan)' : 'none', background: 'transparent'
          }}
        >
          Versions
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeTab === 'OVERVIEW' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>

            <div style={{ backgroundColor: 'var(--bg-dark)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created By Author</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Zewd</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  REQUIREMENT TYPE
                </label>
                <select value={reqType} onChange={(e) => setReqType(e.target.value as any)} style={{ width: '100%', fontSize: '0.8rem' }}>
                  <option value="Functional Requirement">Functional Requirement</option>
                  <option value="Non-Functional Requirement">Non-Functional Requirement</option>
                  <option value="Variable">Variable</option>
                  <option value="Parameter">Parameter</option>
                  <option value="Folder">Folder</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PARENT FOLDER
                </label>
                <select value={folderId || ''} onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', fontSize: '0.8rem' }}>
                  <option value="">No Parent Folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  SAFETY LEVEL (ASIL/SIL)
                </label>
                <select value={safetyLevel} onChange={(e) => setSafetyLevel(e.target.value as any)} style={{ width: '100%', fontSize: '0.8rem' }}>
                  <option value="ASIL-D">ASIL-D (Highest Safety)</option>
                  <option value="ASIL-C">ASIL-C</option>
                  <option value="ASIL-B">ASIL-B</option>
                  <option value="ASIL-A">ASIL-A</option>
                  <option value="SIL-3">SIL-3</option>
                  <option value="SIL-2">SIL-2</option>
                  <option value="SIL-1">SIL-1</option>
                  <option value="Standard / Non-Safety">Standard / Non-Safety</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  TEST-SUB PROCESS
                </label>
                <select value={testProcess} onChange={(e) => setTestProcess(e.target.value as any)} style={{ width: '100%', fontSize: '0.8rem' }}>
                  <option value="System Testing">System Testing</option>
                  <option value="Integration Testing">Integration Testing</option>
                  <option value="SW Testing">SW Testing</option>
                  <option value="Unit Testing">Unit Testing</option>
                  <option value="HIL Testing">HIL (Hardware-in-Loop)</option>
                  <option value="Black-Box Testing">Black-Box Testing</option>
                  <option value="Grey-Box Testing">Grey-Box Testing</option>
                  <option value="White-Box Testing">White-Box Testing</option>
                  <option value="Field Testing">Field Testing</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  STATUS
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="OUTDATED">OUTDATED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PRIORITY
                </label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                DESCRIPTION & RATIONALE
              </label>
              <textarea
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '16px'
              }}
            >
              <Save size={16} />
              <span>Save & Create Version (v{activeObject.version + 1})</span>
            </button>

            {onDeleteObject && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${activeObject.object_key} "${activeObject.title}"? This will also remove associated test steps, traceability links, and attached files.`)) {
                      onDeleteObject(activeObject.id);
                      onClose();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--accent-rose)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Record ({activeObject.object_key})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Included Test Cases Tab (ONLY for Test Sets) */}
        {activeTab === 'TEST_CASES' && (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-cyan)" />
              <span>Included Test Cases in Suite ({includedTestCases.length})</span>
            </div>

            {/* List of Included Test Cases */}
            <div style={{ marginBottom: '24px' }}>
              {includedTestCases.length > 0 ? (
                includedTestCases.map(({ relId, tcObj }) => {
                  if (!tcObj) return null;
                  const tcSteps = testSteps.filter(s => s.test_case_id === tcObj.id);

                  return (
                    <div
                      key={tcObj.id}
                      onClick={() => setCurrentInspectId(tcObj.id)}
                      style={{
                        backgroundColor: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {tcObj.object_key}
                          </span>
                          {onNavigateToObject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToObject(tcObj.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: 'var(--accent-cyan)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title={`Open test case [${tcObj.object_key}]`}
                            >
                              <ExternalLink size={10} />
                              <span>Open</span>
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {tcSteps.length} Steps
                          </span>
                          {onDeleteRelationship && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRelationship(relId);
                              }}
                              style={{ color: 'var(--accent-rose)', background: 'transparent' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {tcObj.title}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tcObj.description}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '8px', fontWeight: 700 }}>
                        ➔ Click to View & Run Specific Test Case Details
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', borderRadius: '8px' }}>
                  No test cases included in this test set suite yet. Select a test case below to add it.
                </div>
              )}
            </div>

            {/* Add Test Case to Suite Selector */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-cyan)' }}>
                + Add System Test Case to Suite
              </div>

              {availableTestCases.length > 0 ? (
                <form onSubmit={handleAddTestCaseToSetSubmit}>
                  <div style={{ marginBottom: '12px' }}>
                    <SearchableItemSelect
                      items={availableTestCases}
                      selectedId={addTestCaseId}
                      onSelect={(id) => setAddTestCaseId(id)}
                      placeholder="Search test case to include by ID or title..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!addTestCaseId}
                    style={{
                      width: '100%', padding: '8px', borderRadius: '6px',
                      backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >
                    + Attach Test Case to Test Set
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All available System Test Cases are already included in this Test Set.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files & Attachments Tab */}
        {activeTab === 'FILES' && (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={18} color="var(--accent-cyan)" />
              <span>Attached Documents & Files (.pdf, .xlsx, .docx, CAD)</span>
            </div>

            {/* Attached Files List */}
            <div style={{ marginBottom: '24px' }}>
              {objectFiles.length > 0 ? (
                objectFiles.map(art => (
                  <div
                    key={art.id}
                    style={{
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <FileText size={24} color="var(--accent-cyan)" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '270px' }}>
                          {art.filename}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{art.category}</span> • {formatFileSize(art.file_size)} • Uploaded by {art.uploader_name || 'Zewd'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDownload(art)}
                        style={{
                          color: 'var(--accent-cyan)',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                      {onDeleteArtifact && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove attached file "${art.filename}"?`)) {
                              onDeleteArtifact(art.id);
                            }
                          }}
                          title="Delete File Attachment"
                          style={{
                            color: 'var(--accent-rose)',
                            backgroundColor: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', borderRadius: '8px' }}>
                  No files attached to this record yet. Upload or attach a .pdf, .xlsx, .docx, or CAD model below.
                </div>
              )}
            </div>

            {/* Attach File Form */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-cyan)' }}>
                + Attach New Document / File from PC
              </div>

              <form onSubmit={handleAttachFileSubmit}>
                {/* Native File Dropzone & PC Browser Button */}
                <div
                  onClick={() => inspectorFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleInspectorFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: '2px dashed var(--accent-cyan)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: inspectorSelectedFile ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={inspectorFileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleInspectorInputChange}
                  />
                  <UploadCloud size={28} color="var(--accent-cyan)" style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {inspectorSelectedFile ? `Selected: ${inspectorSelectedFile.name}` : 'Browse File from PC'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {inspectorSelectedFile ? `Size: ${formatFileSize(inspectorSelectedFile.size)}` : 'Click or drop .pdf, .xlsx, .step, .docx file'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Document Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    placeholder="e.g. System_Architecture_Schematic_v2.pdf"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Document Category
                  </label>
                  <select
                    value={newFileCategory}
                    onChange={(e) => setNewFileCategory(e.target.value as any)}
                    style={{ width: '100%' }}
                  >
                    <option value="PDF">PDF Document (.pdf)</option>
                    <option value="CSV">Excel Spreadsheet (.xlsx / .csv)</option>
                    <option value="OTHER">Word Document (.docx)</option>
                    <option value="CAD">CAD 3D Assembly (.step / .stl)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '8px', borderRadius: '6px',
                    backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.85rem'
                  }}
                >
                  + Attach File (Uploader: Zewd)
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step-by-Step Test Procedure Tab */}
        {activeTab === 'STEPS' && (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListOrdered size={18} color="var(--accent-cyan)" />
              <span>Test Case Procedure Steps ({caseSteps.length})</span>
            </div>

            {/* List of Test Steps */}
            <div style={{ marginBottom: '24px' }}>
              {caseSteps.length > 0 ? (
                caseSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    style={{
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        STEP {idx + 1}
                      </span>
                      {onDeleteTestStep && (
                        <button onClick={() => onDeleteTestStep(step.id)} style={{ color: 'var(--accent-rose)', background: 'transparent' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Action / Instruction
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                        {step.action}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                        Expected Result
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                        {step.expected_result}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', borderRadius: '8px' }}>
                  No test steps created yet. Add your first Action & Expected Result below.
                </div>
              )}
            </div>

            {/* Add New Step Form */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-cyan)' }}>
                + Add Step #{caseSteps.length + 1}
              </div>

              <form onSubmit={handleCreateTestStep}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Action *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    placeholder="e.g. Accelerate base to 1.5 m/s and trigger wireless e-stop..."
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Expected Result *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newExpectedResult}
                    onChange={(e) => setNewExpectedResult(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    placeholder="e.g. Robot mechanical brakes engage, stopping base within <= 0.35m."
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '8px', borderRadius: '6px',
                    backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.85rem'
                  }}
                >
                  + Add Test Step to Procedure
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Traceability & Object Links Tab */}
        {activeTab === 'TRACEABILITY' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Object Traceability Engine</span>
              <button
                onClick={() => setShowLinkModal(true)}
                style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '4px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Link Object ID</span>
              </button>
            </div>

            {/* Outgoing Links */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRight size={14} />
                <span>FORWARD TRACEABILITY (OUTGOING ATTACHMENTS)</span>
              </div>

              {outgoingLinks.length > 0 ? (
                outgoingLinks.map(rel => {
                  const target = allObjects.find(o => o.id === rel.target_id);
                  return (
                    <div key={rel.id} style={{ backgroundColor: 'var(--bg-dark)', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        onClick={() => target && onNavigateToObject && onNavigateToObject(target.id)}
                        style={{ cursor: target && onNavigateToObject ? 'pointer' : 'default', flex: 1 }}
                        title={target ? `Click to open [${target.object_key}] ${target.title}` : undefined}
                      >
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700 }}>{rel.relationship_type}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '5px' }} className="mono">
                          <span>{target?.object_key}</span>
                          {target && <ExternalLink size={12} />}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{target?.title}</div>
                      </div>
                      {onDeleteRelationship && (
                        <button onClick={() => onDeleteRelationship(rel.id)} style={{ color: 'var(--accent-rose)', background: 'transparent' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                  No outgoing links. Click "+ Link Object ID" to attach a test case or downstream item.
                </div>
              )}
            </div>

            {/* Incoming Links */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} />
                <span>BACKWARD TRACEABILITY (INCOMING ATTACHMENTS)</span>
              </div>

              {incomingLinks.length > 0 ? (
                incomingLinks.map(rel => {
                  const source = allObjects.find(o => o.id === rel.source_id);
                  return (
                    <div key={rel.id} style={{ backgroundColor: 'var(--bg-dark)', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        onClick={() => source && onNavigateToObject && onNavigateToObject(source.id)}
                        style={{ cursor: source && onNavigateToObject ? 'pointer' : 'default', flex: 1 }}
                        title={source ? `Click to open [${source.object_key}] ${source.title}` : undefined}
                      >
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>{rel.relationship_type} BY</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '5px' }} className="mono">
                          <span>{source?.object_key}</span>
                          {source && <ExternalLink size={12} />}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{source?.title}</div>
                      </div>
                      {onDeleteRelationship && (
                        <button onClick={() => onDeleteRelationship(rel.id)} style={{ color: 'var(--accent-rose)', background: 'transparent' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                  No incoming links attached.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'VERSIONS' && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>
              REVISION HISTORY (AUTHOR: ZEWD)
            </div>
            <div style={{ backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '8px', marginBottom: '10px', borderLeft: '3px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span className="mono">Version {activeObject.version} (Current)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Author: Zewd</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px' }}>{activeObject.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                Type: {activeObject.requirement_type || 'Functional Requirement'} | Safety: {activeObject.safety_level || 'ASIL-D'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Linking Object IDs */}
      {showLinkModal && (
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
            width: '450px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
              Link <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{activeObject.object_key}</span> to Target Object ID
            </h3>

            <form onSubmit={handleCreateLink}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Relationship Type
                </label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="VERIFIED_BY">VERIFIED_BY (Req ➔ Test Case)</option>
                  <option value="MITIGATED_BY">MITIGATED_BY (Risk ➔ Requirement)</option>
                  <option value="DERIVED_TO">DERIVED_TO (Sys Req ➔ SW Req)</option>
                  <option value="ALLOCATED_TO">ALLOCATED_TO (Req ➔ Architecture)</option>
                  <option value="INCLUDED_IN">INCLUDED_IN (Test Case ➔ Test Set)</option>
                  <option value="EXECUTED_AS">EXECUTED_AS (Test Set ➔ Test Run)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Select Target Object ID *
                </label>
                <SearchableItemSelect
                  items={allObjects}
                  selectedId={targetObjId}
                  onSelect={(id) => setTargetObjId(id)}
                  excludeId={activeObject.id}
                  placeholder="Search target requirement, test case, or item..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetObjId}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600 }}
                >
                  Link Objects Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
