import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Boxes,
  ShieldAlert,
  FlaskConical,
  GitCompare,
  GitBranch,
  FolderArchive,
  History,
  HardDrive,
  Plus,
  Trash2,
  FolderPlus,
  ListOrdered,
  Search,
  CheckSquare,
  AlertTriangle,
  X,
  Filter,
  Sparkles
} from 'lucide-react';
import { Tracker, User } from '../types/elm';
import { authService } from '../api/auth';
import { cleanTrackerName, getTrackerCategory, CANONICAL_CATEGORIES } from '../data/canonicalTrackers';
import { createNewTabHandlers } from '../utils/tabOpener';

export type ViewMode =
  | 'DASHBOARD'
  | 'TRACKER'
  | 'TRACEABILITY'
  | 'IMPACT'
  | 'TEST_EXECUTION'
  | 'RISK_MATRIX'
  | 'CHANGES'
  | 'BASELINES'
  | 'ARTIFACTS'
  | 'AUDIT';

interface SidebarProps {
  trackers: Tracker[];
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedTracker: Tracker | null;
  setSelectedTracker: (tracker: Tracker | null) => void;
  currentUser?: User | null;
  activeProjectId?: number;
  activeProjectName?: string;
  onCreateTracker?: (data: {
    name: string;
    key: string;
    type: string;
    enable_test_steps: boolean;
    enable_folders: boolean;
    description?: string;
    category?: string;
  }) => void;
  onDeleteTracker?: (id: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  trackers,
  activeView,
  setActiveView,
  selectedTracker,
  setSelectedTracker,
  currentUser,
  activeProjectId = 1,
  activeProjectName = 'RoboServ-X1 Autonomous Delivery Robot',
  onCreateTracker,
  onDeleteTracker
}) => {
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showTrackerRequestModal, setShowTrackerRequestModal] = useState(false);
  const [showProjectRequestModal, setShowProjectRequestModal] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Admin Direct Creation State
  const [trackerName, setTrackerName] = useState('');
  const [trackerKey, setTrackerKey] = useState('');
  const [trackerType, setTrackerType] = useState('REQUIREMENT');
  const [enableTestSteps, setEnableTestSteps] = useState(false);
  const [enableFolders, setEnableFolders] = useState(true);
  const [trackerDesc, setTrackerDesc] = useState('');

  // User Request State (Tracker)
  const [reqTrackerName, setReqTrackerName] = useState('');
  const [reqTrackerKey, setReqTrackerKey] = useState('');
  const [reqTrackerType, setReqTrackerType] = useState('REQUIREMENT');
  const [reqEnableTestSteps, setReqEnableTestSteps] = useState(false);
  const [reqEnableFolders, setReqEnableFolders] = useState(true);
  const [reqTrackerReason, setReqTrackerReason] = useState('');

  // User Request State (Project)
  const [reqProjName, setReqProjName] = useState('');
  const [reqProjKey, setReqProjKey] = useState('');
  const [reqProjDesc, setReqProjDesc] = useState('');
  const [reqProjReason, setReqProjReason] = useState('');

  const [trackerSearch, setTrackerSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const getTrackerIcon = (t: Tracker) => {
    if (getTrackerCategory(t) === 'Custom Trackers') {
      return <Sparkles size={15} color="#f97316" />;
    }
    switch (t.type) {
      case 'REQUIREMENT': return <FileText size={15} color="var(--accent-cyan)" />;
      case 'ARCHITECTURE': return <Boxes size={15} color="var(--accent-amber)" />;
      case 'RISK': return <ShieldAlert size={15} color="var(--accent-rose)" />;
      case 'TEST_CASE': return <FlaskConical size={15} color="var(--accent-emerald)" />;
      case 'TEST_SET': return <FlaskConical size={15} color="var(--accent-purple)" />;
      case 'TASK': return <CheckSquare size={15} color="#38bdf8" />;
      case 'DEFECT': return <AlertTriangle size={15} color="#f43f5e" />;
      case 'RELEASE': return <GitBranch size={15} color="#a855f7" />;
      case 'DOCUMENT': return <FileText size={15} color="#94a3b8" />;
      default: return <Sparkles size={15} color="#f97316" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerName.trim() || !trackerKey.trim() || !onCreateTracker) return;

    onCreateTracker({
      name: trackerName.trim(),
      key: trackerKey.trim(),
      type: trackerType,
      category: 'Custom Trackers',
      enable_test_steps: enableTestSteps,
      enable_folders: enableFolders,
      description: trackerDesc.trim()
    });

    setShowTrackerModal(false);
    setTrackerName('');
    setTrackerKey('');
    setTrackerType('REQUIREMENT');
    setEnableTestSteps(false);
    setEnableFolders(true);
    setTrackerDesc('');
  };

  const handleTrackerRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTrackerName.trim() || !reqTrackerKey.trim()) return;

    authService.submitTrackerRequest({
      project_id: activeProjectId,
      project_name: activeProjectName,
      requested_name: reqTrackerName.trim(),
      requested_key: reqTrackerKey.trim(),
      type: reqTrackerType,
      enable_test_steps: reqEnableTestSteps,
      enable_folders: reqEnableFolders,
      reason: reqTrackerReason.trim()
    });

    setShowTrackerRequestModal(false);
    setReqTrackerName('');
    setReqTrackerKey('');
    setReqTrackerReason('');
    setRequestSuccessMsg('Custom Tracker request submitted to Admin Owner!');
    setTimeout(() => setRequestSuccessMsg(''), 4000);
  };

  const handleProjectRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProjName.trim() || !reqProjKey.trim()) return;

    authService.submitProjectRequest({
      requested_name: reqProjName.trim(),
      key: reqProjKey.trim().toUpperCase(),
      description: reqProjDesc.trim(),
      reason: reqProjReason.trim()
    });

    setShowProjectRequestModal(false);
    setReqProjName('');
    setReqProjKey('');
    setReqProjDesc('');
    setReqProjReason('');
    setRequestSuccessMsg('New Project request submitted to Admin Owner!');
    setTimeout(() => setRequestSuccessMsg(''), 4000);
  };

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 60px)',
      overflowY: 'auto',
      padding: '16px 12px'
    }}>
      {requestSuccessMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: 'var(--accent-emerald)',
          padding: '8px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          {requestSuccessMsg}
        </div>
      )}

      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
        MAIN NAVIGATION
      </div>

      <button
        {...createNewTabHandlers({ view: 'DASHBOARD', label: 'Project Dashboard' }, () => { setActiveView('DASHBOARD'); setSelectedTracker(null); })}
        title="Project Dashboard&#10;💡 [Ctrl + Right-Click] Open in new tab"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'DASHBOARD' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'DASHBOARD' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.9rem',
          fontWeight: 500,
          marginBottom: '4px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <LayoutDashboard size={18} />
        <span>Project Dashboard</span>
      </button>

      {/* Project Request Button for Standard Users */}
      {currentUser?.role !== 'ADMIN_OWNER' && (
        <button
          onClick={() => setShowProjectRequestModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            color: 'var(--accent-cyan)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <FolderPlus size={14} />
          <span>+ Request New Project</span>
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '8px', paddingLeft: '8px', paddingRight: '4px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          ENGINEERING TRACKERS
        </span>

        {currentUser?.role === 'ADMIN_OWNER' ? (
          <button
            onClick={() => setShowTrackerModal(true)}
            title="Create Custom Engineering Tracker"
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <Plus size={12} />
            <span>+ New</span>
          </button>
        ) : (
          <button
            onClick={() => setShowTrackerRequestModal(true)}
            title="Request Custom Tracker from Admin Owner"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <Plus size={12} />
            <span>+ Request</span>
          </button>
        )}
      </div>

      {/* Tracker Search & Category Filter */}
      <div style={{ padding: '0 8px 10px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Search ${trackers.length} trackers...`}
            value={trackerSearch}
            onChange={(e) => setTrackerSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 24px 6px 26px',
              fontSize: '0.75rem',
              borderRadius: '5px',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              outline: 'none'
            }}
          />
          {trackerSearch && (
            <button
              onClick={() => setTrackerSearch('')}
              style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{
            fontSize: '0.72rem',
            padding: '5px 8px',
            borderRadius: '5px',
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Categories ({trackers.length})</option>
          {CANONICAL_CATEGORIES.map((cat, idx) => {
            const count = trackers.filter(t => getTrackerCategory(t) === cat).length;
            return (
              <option key={cat} value={cat}>Group {idx + 1}: {cat} ({count})</option>
            );
          })}
        </select>
      </div>

      {(() => {
        const filteredTrackers = trackers.filter(t => {
          const q = trackerSearch.trim().toLowerCase();
          const cleanName = cleanTrackerName(t.name).toLowerCase();
          const rawName = (t.name || '').toLowerCase();
          const key = (t.key || '').toLowerCase();
          const prefix = (t.prefix || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();

          const matchesSearch = !q ||
            cleanName.includes(q) ||
            rawName.includes(q) ||
            key.includes(q) ||
            prefix.includes(q) ||
            desc.includes(q);

          if (!matchesSearch) return false;
          if (selectedCategoryFilter === 'ALL') return true;
          return getTrackerCategory(t) === selectedCategoryFilter;
        });

        if (filteredTrackers.length === 0) {
          return (
            <div style={{ padding: '12px 10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No trackers match current filter.
            </div>
          );
        }

        return filteredTrackers.map((t) => {
          const cleanName = cleanTrackerName(t.name);
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '6px',
                backgroundColor: activeView === 'TRACKER' && selectedTracker?.id === t.id ? 'var(--bg-hover)' : 'transparent',
                marginBottom: '2px'
              }}
            >
              <button
                {...createNewTabHandlers(
                  {
                    view: 'TRACKER',
                    trackerId: t.id,
                    trackerKey: t.key,
                    label: cleanName
                  },
                  () => {
                    setSelectedTracker(t);
                    setActiveView('TRACKER');
                  }
                )}
                title={`${cleanName} (${t.key})\n💡 [Ctrl + Right-Click] Open in new tab`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: activeView === 'TRACKER' && selectedTracker?.id === t.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden'
                }}
              >
                {getTrackerIcon(t)}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName}</span>
              </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-dark)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-muted)' }}>
              {t.object_count || 0}
            </span>
            {onDeleteTracker && !['SYS-REQ', 'SW-REQ', 'ARCH', 'RISK', 'SYS-TST', 'TST-SET'].includes(t.key) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete custom tracker "${t.name}" and all its objects?`)) {
                    onDeleteTracker(t.id);
                  }
                }}
                title="Delete Custom Tracker"
                style={{ color: 'var(--accent-rose)', background: 'transparent', padding: '2px', cursor: 'pointer' }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
          );
        });
      })()}

      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '16px', marginBottom: '8px', paddingLeft: '8px' }}>
        LIFECYCLE & ANALYTICS
      </div>

      <button
        onClick={() => setActiveView('TRACEABILITY')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'TRACEABILITY' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'TRACEABILITY' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <GitCompare size={18} />
        <span>Traceability Matrix</span>
      </button>

      <button
        onClick={() => setActiveView('TEST_EXECUTION')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'TEST_EXECUTION' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'TEST_EXECUTION' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <FlaskConical size={18} />
        <span>Test Runner Suite</span>
      </button>

      <button
        onClick={() => setActiveView('RISK_MATRIX')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'RISK_MATRIX' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'RISK_MATRIX' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <ShieldAlert size={18} />
        <span>Risk & Hazard Matrix</span>
      </button>

      <button
        onClick={() => setActiveView('CHANGES')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'CHANGES' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'CHANGES' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <GitBranch size={18} />
        <span>Change Requests</span>
      </button>

      <button
        onClick={() => setActiveView('BASELINES')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'BASELINES' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'BASELINES' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <FolderArchive size={18} />
        <span>Baselines</span>
      </button>

      <button
        onClick={() => setActiveView('ARTIFACTS')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'ARTIFACTS' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'ARTIFACTS' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <HardDrive size={18} />
        <span>Files & Artifacts</span>
      </button>

      <button
        onClick={() => setActiveView('AUDIT')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: activeView === 'AUDIT' ? 'var(--bg-hover)' : 'transparent',
          color: activeView === 'AUDIT' ? 'var(--accent-cyan)' : 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '2px',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <History size={18} />
        <span>Audit Trail</span>
      </button>

      {/* Create Custom Tracker Modal */}
      {showTrackerModal && (
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
            width: '520px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} />
              <span>Create New Engineering Tracker</span>
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '16px',
              color: '#f97316',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              <Sparkles size={16} />
              <span>Target Category: <strong>Group 9 &mdash; Custom Trackers</strong> (All newly created custom trackers are stored here)</span>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Tracker Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={trackerName}
                  onChange={(e) => {
                    setTrackerName(e.target.value);
                    if (!trackerKey) {
                      const autoKey = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                      if (autoKey) setTrackerKey(`${autoKey}-`);
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="e.g. Hardware Requirements, Safety Hazards, ICD Specs"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Key Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    value={trackerKey}
                    onChange={(e) => setTrackerKey(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. HW-REQ-, INT-SPEC-"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Base Object Type
                  </label>
                  <select
                    value={trackerType}
                    onChange={(e) => {
                      setTrackerType(e.target.value);
                      if (e.target.value === 'TEST_CASE') {
                        setEnableTestSteps(true);
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="REQUIREMENT">Requirements Tracker</option>
                    <option value="TEST_CASE">Test Case Specification</option>
                    <option value="TEST_SET">Test Suite / Test Set</option>
                    <option value="ARCHITECTURE">Architecture System</option>
                    <option value="RISK">Risk & Hazard Tracker</option>
                    <option value="CUSTOM">Custom Engineering Spec</option>
                  </select>
                </div>
              </div>

              {/* Subparts & Test Steps Configuration Toggles */}
              <div style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '10px' }}>
                  Tracker Capabilities & Module Config
                </div>

                {/* Option 1: Enable Subparts / Folders */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  backgroundColor: 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  <input
                    type="checkbox"
                    checked={enableFolders}
                    onChange={(e) => setEnableFolders(e.target.checked)}
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderPlus size={14} color="var(--accent-cyan)" />
                      <span>Enable Subparts & Sub-folders</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Allows organizing objects inside this tracker into hierarchical sub-folders / sub-components.
                    </div>
                  </div>
                </label>

                {/* Option 2: Enable Step-by-Step Test Procedure Steps */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  <input
                    type="checkbox"
                    checked={enableTestSteps}
                    onChange={(e) => setEnableTestSteps(e.target.checked)}
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ListOrdered size={14} color="var(--accent-cyan)" />
                      <span>Enable Step-by-Step Test Procedure Steps</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Allows adding detailed test steps (Actions & Expected Results) to items in this tracker.
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={trackerDesc}
                  onChange={(e) => setTrackerDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="e.g. Hardware compliance & sensor wiring specifications..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTrackerModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600 }}
                >
                  Create Custom Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Request Custom Tracker Modal */}
      {showTrackerRequestModal && (
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
            width: '500px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} />
              <span>Request Custom Tracker from Admin Owner</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Standard engineers require Admin Owner approval to create new trackers. Submit your request below:
            </p>

            <form onSubmit={handleTrackerRequestSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Requested Tracker Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={reqTrackerName}
                  onChange={(e) => {
                    setReqTrackerName(e.target.value);
                    if (!reqTrackerKey) {
                      const autoKey = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                      if (autoKey) setReqTrackerKey(`${autoKey}-`);
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="e.g. CANbus Interface Specs"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Key Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqTrackerKey}
                    onChange={(e) => setReqTrackerKey(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. CAN-SPEC-"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Base Object Type
                  </label>
                  <select
                    value={reqTrackerType}
                    onChange={(e) => setReqTrackerType(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="REQUIREMENT">Requirements Tracker</option>
                    <option value="TEST_CASE">Test Case Specification</option>
                    <option value="TEST_SET">Test Suite / Test Set</option>
                    <option value="ARCHITECTURE">Architecture System</option>
                    <option value="RISK">Risk & Hazard Tracker</option>
                  </select>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reqEnableFolders}
                    onChange={(e) => setReqEnableFolders(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Subparts / Folders</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reqEnableTestSteps}
                    onChange={(e) => setReqEnableTestSteps(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Test Procedure Steps</span>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Reason for Request *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqTrackerReason}
                  onChange={(e) => setReqTrackerReason(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="Explain why this tracker is needed for your project workflow..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTrackerRequestModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--accent-amber)', color: '#000', fontWeight: 800 }}
                >
                  Submit Tracker Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Request New Project Modal */}
      {showProjectRequestModal && (
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
            width: '500px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={20} />
              <span>Request New Engineering Project</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Submitting a request sends it directly to the Admin Owner Command Center for provisioning.
            </p>

            <form onSubmit={handleProjectRequestSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Requested Project Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={reqProjName}
                  onChange={(e) => {
                    setReqProjName(e.target.value);
                    if (!reqProjKey) {
                      setReqProjKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="e.g. RoboServ-M2 Micro Delivery Bot"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={reqProjKey}
                  onChange={(e) => setReqProjKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. MICRO"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description / Scope
                </label>
                <textarea
                  rows={2}
                  value={reqProjDesc}
                  onChange={(e) => setReqProjDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="Engineering scope and sub-system focus..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Reason for Request *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reqProjReason}
                  onChange={(e) => setReqProjReason(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="Why is a dedicated project workspace needed?"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowProjectRequestModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'var(--accent-cyan)', color: '#000', fontWeight: 800 }}
                >
                  Submit Project Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
