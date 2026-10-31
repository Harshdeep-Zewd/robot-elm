import React, { useState } from 'react';
import {
  X, Save, Plus, ArrowRight, ShieldAlert, Clock, User, FileText,
  Link as LinkIcon, Bold, Italic, Underline, List, Table, Image, Code
} from 'lucide-react';
import {
  Tracker, Folder as FolderType, EngineeringObject, RequirementType,
  SafetyLevel, TestSubProcess
} from '../types/elm';
import { cleanTrackerName } from '../data/canonicalTrackers';
import { SearchableItemSelect } from './SearchableItemSelect';

interface EnterpriseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: Tracker;
  folders: FolderType[];
  allObjects: EngineeringObject[];
  selectedFolderId?: number | null;
  onSave: (data: {
    tracker_id: number;
    folder_id?: number | null;
    title: string;
    description?: string;
    pre_action?: string;
    post_action?: string;
    requirement_type?: RequirementType;
    safety_level?: SafetyLevel;
    safety_framework?: string;
    safety_justification?: string;
    acceptance_criteria?: string;
    verification_method?: 'Inspection' | 'Analysis' | 'Demonstration' | 'Test';
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
    association?: {
      target_id: number;
      type: string;
    };
  }, closeAfter: boolean) => void;
}

export const EnterpriseCreateModal: React.FC<EnterpriseCreateModalProps> = ({
  isOpen,
  onClose,
  tracker,
  folders,
  allObjects,
  selectedFolderId = null,
  onSave
}) => {
  if (!isOpen) return null;

  // View Filter: [Required] | [Editable] | [All] (matches Codebeamer style in Image 1)
  const [viewFilter, setViewFilter] = useState<'REQUIRED' | 'EDITABLE' | 'ALL'>('ALL');

  // Form Fields
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [spentEffort, setSpentEffort] = useState('0h');
  const [plannedEffort, setPlannedEffort] = useState('16h');
  const [resolution, setResolution] = useState('Unresolved');
  const [folderId, setFolderId] = useState<number | null>(selectedFolderId);
  const [ownerName, setOwnerName] = useState('Zewd');
  const [assignedTo, setAssignedTo] = useState('Zewd');
  const [category, setCategory] = useState('Functional Requirement');
  const [release, setRelease] = useState('Release 2.4');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>('Safety-Related');
  const [safetyFramework, setSafetyFramework] = useState('ISO 13482 (Service Robots)');
  const [safetyJustification, setSafetyJustification] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'Inspection' | 'Analysis' | 'Demonstration' | 'Test'>('Test');
  const [preAction, setPreAction] = useState('');
  const [description, setDescription] = useState('');
  const [postAction, setPostAction] = useState('');

  // Association / Link
  const [assocType, setAssocType] = useState('depends');
  const [assocTargetId, setAssocTargetId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle('');
    setPreAction('');
    setDescription('');
    setPostAction('');
    setSafetyJustification('');
    setAcceptanceCriteria('');
    setAssocTargetId(null);
  };

  const isRequirement = tracker.type === 'REQUIREMENT' || tracker.key.includes('REQ') || ['STK-REQ', 'SYS-REQ', 'HW-REQ', 'SW-REQ', 'QREQ'].includes(tracker.key);
  const isTestCase = Boolean(tracker.enable_test_steps) || tracker.type === 'TEST_CASE' || tracker.key === 'TC' || tracker.key === 'SYS-TST' || tracker.prefix.includes('TC-') || tracker.prefix.includes('TST-');

  const handleSaveInternal = (closeAfter: boolean) => {
    if (!title.trim()) {
      alert("Validation Error: Summary / Title is required!");
      return;
    }

    // MANDATORY REQUIREMENT FIELD RULE
    if (isRequirement) {
      if (!safetyLevel || !['Safety-Related', 'Non-Safety-Related', 'Safety Relevance Under Assessment'].includes(safetyLevel as any)) {
        alert("Validation Error: Safety Level is MANDATORY for all requirement records!\n\nPlease select one of:\n• Safety-Related\n• Non-Safety-Related\n• Safety Relevance Under Assessment");
        return;
      }
    }

    // MANDATORY TEST CASE FIELDS RULE
    if (isTestCase) {
      if (!preAction.trim()) {
        alert("Validation Error: Preconditions are MANDATORY for all Test Cases!");
        return;
      }
      if (!description.trim()) {
        alert("Validation Error: Test Steps & Expected Results are MANDATORY for all Test Cases!");
        return;
      }
      if (!postAction.trim()) {
        alert("Validation Error: Post-Actions are MANDATORY for all Test Cases!");
        return;
      }
    }

    const relMap: Record<string, string> = {
      'depends': 'DEPENDS_ON',
      'verified by': 'VERIFIED_BY',
      'allocated to': 'ALLOCATED_TO',
      'mitigated by': 'MITIGATED_BY'
    };

    onSave({
      tracker_id: tracker.id,
      folder_id: folderId,
      title: title.trim(),
      description: description.trim(),
      pre_action: preAction.trim(),
      post_action: postAction.trim(),
      safety_level: safetyLevel,
      safety_framework: safetyLevel === 'Safety-Related' ? safetyFramework : undefined,
      safety_justification: safetyJustification.trim() || undefined,
      acceptance_criteria: acceptanceCriteria.trim() || undefined,
      verification_method: verificationMethod,
      priority: priority,
      requirement_type: category as RequirementType,
      start_date: startDate,
      end_date: endDate,
      planned_effort: plannedEffort,
      spent_effort: spentEffort,
      category: category,
      resolution: resolution,
      release: release,
      owner_name: ownerName.trim(),
      association: assocTargetId ? {
        target_id: assocTargetId,
        type: relMap[assocType] || 'DEPENDS_ON'
      } : undefined
    }, closeAfter);

    if (!closeAfter) {
      resetForm();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        width: '1100px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden'
      }}>
        {/* ═══ Header Bar (Codebeamer style) ═══ */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="mono" style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              {tracker.prefix || tracker.key}
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              New {cleanTrackerName(tracker.name).replace(/s$/, '')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Filter Tabs: [Required] [Editable] [All] */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {(['REQUIRED', 'EDITABLE', 'ALL'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setViewFilter(tab)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: viewFilter === tab ? 'var(--primary)' : 'transparent',
                    color: viewFilter === tab ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Top Action Buttons */}
            <button
              type="button"
              onClick={() => handleSaveInternal(true)}
              style={{
                backgroundColor: 'var(--accent-emerald)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSaveInternal(false)}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Save &amp; New
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ═══ Scrollable Body ═══ */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Metadata Grid (3 Columns like Codebeamer Image 1) */}
          {viewFilter !== 'REQUIRED' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px 24px',
              backgroundColor: 'var(--bg-dark)',
              padding: '18px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              {/* Column 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Tracker
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cleanTrackerName(tracker.name)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', backgroundColor: 'var(--bg-card)', opacity: 0.85 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Spent effort
                  </label>
                  <input
                    type="text"
                    value={spentEffort}
                    onChange={(e) => setSpentEffort(e.target.value)}
                    placeholder="e.g. 0h"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="Unresolved">Unresolved</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Column 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Parent Folder
                  </label>
                  <select
                    value={folderId || ''}
                    onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="">-- None (Tracker Root) --</option>
                    {(() => {
                      const renderFolderOptions = (parentId: number | null = null, depth = 0): React.ReactNode[] => {
                        const childFolders = folders.filter(f => (parentId === null ? (!f.parent_id || !folders.some(p => p.id === f.parent_id)) : f.parent_id === parentId));
                        return childFolders.flatMap(f => [
                          <option key={f.id} value={f.id}>
                            {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '↳ ' : '📁 '}{f.name}
                          </option>,
                          ...renderFolderOptions(f.id, depth + 1)
                        ]);
                      };
                      return renderFolderOptions(null, 0);
                    })()}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Owner
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', color: 'var(--accent-amber)', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="Functional Requirement">Functional Requirement</option>
                    <option value="Non-Functional Requirement">Non-Functional Requirement</option>
                    <option value="Safety Requirement">Safety Requirement</option>
                    <option value="Performance Constraint">Performance Constraint</option>
                    <option value="Hardware Architecture">Hardware Architecture</option>
                    <option value="Software Unit Test">Software Unit Test</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Release
                  </label>
                  <input
                    type="text"
                    value={release}
                    onChange={(e) => setRelease(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Assigned to
                  </label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Planned effort
                  </label>
                  <input
                    type="text"
                    value={plannedEffort}
                    onChange={(e) => setPlannedEffort(e.target.value)}
                    placeholder="e.g. 16h"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Safety Level {isRequirement && <span style={{ color: 'var(--accent-rose)' }}>* (Mandatory)</span>}
                  </label>
                  <select
                    value={safetyLevel}
                    onChange={(e) => setSafetyLevel(e.target.value as SafetyLevel)}
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      padding: '6px 10px',
                      border: isRequirement ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)'
                    }}
                  >
                    <option value="Safety-Related">Safety-Related</option>
                    <option value="Non-Safety-Related">Non-Safety-Related</option>
                    <option value="Safety Relevance Under Assessment">Safety Relevance Under Assessment</option>
                  </select>
                </div>

                {safetyLevel === 'Safety-Related' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Safety Framework / Standard
                      </label>
                      <select
                        value={safetyFramework}
                        onChange={(e) => setSafetyFramework(e.target.value)}
                        style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                      >
                        <option value="ISO 13482 (Service Robots)">ISO 13482 (Service Robots)</option>
                        <option value="ISO 13849-1 (PL a-e)">ISO 13849-1 (Performance Level)</option>
                        <option value="IEC 62061 (SIL 1-3)">IEC 62061 (Functional Safety)</option>
                        <option value="UL 3100 (AGV / AMR Safety)">UL 3100 (AMR Safety)</option>
                        <option value="Custom / Other">Custom / Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Safety Justification / Hazard Link
                      </label>
                      <input
                        type="text"
                        value={safetyJustification}
                        onChange={(e) => setSafetyJustification(e.target.value)}
                        placeholder="e.g. Collision hazard control via tactile bumper and E-stop"
                        style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══ Summary / Title * ═══ */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Summary / Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LIDAR Optical Window Self-Cleaning & Obstacle Detection"
              style={{
                width: '100%',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          {/* ═══ ⚡ Pre-Action * (Initial System State / Hardware Preconditions) ═══ */}
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: 'var(--accent-amber)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                ⚡ PRE-ACTION
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Initial System State, Sensor Calibration, Hardware Preconditions &amp; Trigger Criteria
              </span>
            </div>
            <textarea
              rows={3}
              value={preAction}
              onChange={(e) => setPreAction(e.target.value)}
              placeholder="Specify initial operating mode, battery voltage thresholds, calibration baseline, safe zone clearance..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--text-main)',
                resize: 'vertical',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* ═══ Description / Specification * ═══ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Description / Specification <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>

              {/* Mock Rich Text Toolbar */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-dark)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <button type="button" title="Bold" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><Bold size={13} /></button>
                <button type="button" title="Italic" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><Italic size={13} /></button>
                <button type="button" title="Underline" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><Underline size={13} /></button>
                <span style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />
                <button type="button" title="Bullet List" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><List size={13} /></button>
                <button type="button" title="Table" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><Table size={13} /></button>
                <button type="button" title="Code" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}><Code size={13} /></button>
              </div>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete engineering requirements specification, signal formulas, performance tolerances..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                resize: 'vertical',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* ═══ 🎯 Post-Action * (Final Exit State / Verification Criteria) ═══ */}
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                🎯 POST-ACTION
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Final Exit System State, Postconditions, Telemetry Logging &amp; Safety Holding
              </span>
            </div>
            <textarea
              rows={3}
              value={postAction}
              onChange={(e) => setPostAction(e.target.value)}
              placeholder="Specify mechanical brake lock, CAN bus telemetry heartbeat, verified postcondition criteria..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--text-main)',
                resize: 'vertical',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* ═══ Associations / Traceability Link Bar ═══ */}
          <div style={{
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LinkIcon size={14} />
              <span>Associations:</span>
            </span>

            <select
              value={assocType}
              onChange={(e) => setAssocType(e.target.value)}
              style={{ fontSize: '0.78rem', padding: '5px 8px' }}
            >
              <option value="depends">depends on</option>
              <option value="verified by">verified by</option>
              <option value="allocated to">allocated to</option>
              <option value="mitigated by">mitigated by</option>
            </select>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchableItemSelect
                items={allObjects}
                selectedId={assocTargetId}
                onSelect={(id) => setAssocTargetId(id)}
                placeholder="Search target requirement or item..."
              />
            </div>
          </div>
        </div>

        {/* ═══ Bottom Action Bar (Image 1 style) ═══ */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveInternal(false)}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Save &amp; New
          </button>
          <button
            type="button"
            onClick={() => handleSaveInternal(true)}
            style={{
              padding: '7px 22px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-emerald)',
              color: '#fff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
