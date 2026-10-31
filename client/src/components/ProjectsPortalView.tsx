import React, { useState } from 'react';
import { Bot, Folder, Plus, ArrowRight, Layers, FileText, FlaskConical, Pencil, Trash2, Search, CheckCircle2, ShieldCheck, ExternalLink, LogOut } from 'lucide-react';
import { Project, Tracker, EngineeringObject, TestRun, User } from '../types/elm';
import { createNewTabHandlers } from '../utils/tabOpener';

interface ProjectsPortalViewProps {
  projects: Project[];
  allTrackers: Tracker[];
  allObjects: EngineeringObject[];
  testRuns: TestRun[];
  currentUser?: User | null;
  onLogout?: () => void;
  onSelectProject: (project: Project) => void;
  onCreateProject: (data: { key: string; name: string; description?: string }) => void;
  onUpdateProject?: (id: number, updates: Partial<Project>) => void;
  onDeleteProject?: (id: number) => void;
  syncStatus?: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR';
  lastSyncedAt?: string | null;
  onForceSync?: () => void;
}

export const ProjectsPortalView: React.FC<ProjectsPortalViewProps> = ({
  projects,
  allTrackers,
  allObjects,
  testRuns,
  currentUser,
  onLogout,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  syncStatus = 'SYNCED',
  lastSyncedAt,
  onForceSync
}) => {
  const [search, setSearch] = useState('');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [desc, setDesc] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.key.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    onCreateProject({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: desc.trim()
    });

    setName('');
    setKey('');
    setDesc('');
    setShowCreateModal(false);
  };

  const handleOpenEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(p);
    setEditName(p.name);
    setEditKey(p.key);
    setEditDesc(p.description || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim() || !editKey.trim()) return;

    if (onUpdateProject) {
      onUpdateProject(editingProject.id, {
        name: editName.trim(),
        key: editKey.trim().toUpperCase(),
        description: editDesc.trim()
      });
    }

    setShowEditModal(false);
    setEditingProject(null);
  };

  const handleDelete = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("Cannot delete the only remaining project.");
      return;
    }

    if (confirm(`Are you sure you want to delete project "${p.name}" (${p.key})?\nAll associated trackers, requirements, and test suites will be permanently removed.`)) {
      if (onDeleteProject) {
        onDeleteProject(p.id);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navbar */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: '6px 12px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 800
          }}>
            <Bot size={22} />
            <span style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>RoboServ ELM</span>
          </div>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            Engineering Workspaces Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Cloud Sync Status Indicator for Non-Demo */}
          {currentUser?.username !== 'demo' && (
            <button
              onClick={onForceSync}
              title={syncStatus === 'SYNCING' ? 'Synchronizing globally across all browsers...' : `Global Cloud Synchronized (${lastSyncedAt || 'Live'}). Click to sync now.`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                backgroundColor: syncStatus === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : (syncStatus === 'SYNCING' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.12)'),
                border: `1px solid ${syncStatus === 'ERROR' ? 'rgba(239, 68, 68, 0.4)' : (syncStatus === 'SYNCING' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.35)')}`,
                color: syncStatus === 'ERROR' ? '#f87171' : (syncStatus === 'SYNCING' ? '#38bdf8' : '#34d399'),
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: syncStatus === 'SYNCING' ? '#38bdf8' : (syncStatus === 'ERROR' ? '#ef4444' : '#10b981'),
                boxShadow: syncStatus === 'SYNCING' ? '0 0 8px #38bdf8' : '0 0 6px #10b981'
              }} />
              {syncStatus === 'SYNCING' ? 'Syncing...' : (syncStatus === 'ERROR' ? 'Sync Error' : `Global Synced ${lastSyncedAt ? '• ' + lastSyncedAt : ''}`)}
            </button>
          )}

          {/* User Badge & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '16px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentUser?.username === 'demo' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#000',
              fontSize: '0.85rem'
            }}>
              {currentUser?.username === 'demo' ? 'D' : 'Z'}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser?.name || (currentUser?.username === 'demo' ? 'Demo User' : 'Zewd')}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: currentUser?.username === 'demo' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {currentUser?.username === 'demo' ? '🎭 Demo Sandbox' : '👑 Zewd (Owner)'}
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out of Session"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-rose)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginLeft: '4px'
                }}
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Portal Body */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        flex: 1
      }}>
        {/* Hero & Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              Engineering Workspaces
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '650px' }}>
              Select an engineering project below to launch its dedicated lifecycle dashboard, requirement trackers, and test execution runner.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search Filter */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search projects by key or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {/* + New Project Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={18} />
              <span>+ New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {filteredProjects.map((p) => {
            const pTrackers = allTrackers.filter(t => t.project_id === p.id);
            const pTrackerIds = pTrackers.map(t => t.id);
            const pObjects = allObjects.filter(o => pTrackerIds.includes(o.tracker_id));
            const pRuns = testRuns.filter(r => r.project_id === p.id);
            const projTabHandlers = createNewTabHandlers(
              {
                projectKey: p.key.toLowerCase(),
                view: 'DASHBOARD',
                label: p.name
              },
              () => onSelectProject(p)
            );

            return (
              <div
                key={p.id}
                {...projTabHandlers}
                title={`${p.name} ([${p.key}])\n💡 [Ctrl + Right-Click] Open in new tab`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
              >
                <div>
                  {/* Card Header: Key Badge & Action Icons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="mono" style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      [{p.key}]
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => handleOpenEdit(p, e)}
                        title="Edit Project"
                        style={{
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '6px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        <Pencil size={14} color="var(--accent-cyan)" />
                      </button>

                      {projects.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(p, e)}
                          title="Delete Project"
                          style={{
                            backgroundColor: 'var(--bg-dark)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Project Title */}
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}>
                    {p.name}
                  </h3>

                  {/* Project Description */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginBottom: '20px',
                    minHeight: '38px',
                    lineHeight: '1.4'
                  }}>
                    {p.description || 'Systems Engineering Lifecycle Management workspace.'}
                  </p>

                  {/* Metrics Badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    backgroundColor: 'var(--bg-dark)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Trackers</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>{pTrackers.length}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Objects</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>{pObjects.length}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Test Runs</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>{pRuns.length}</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  {...projTabHandlers}
                  title="Open Project Dashboard&#10;💡 [Ctrl + Right-Click] Open in new tab"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    borderRadius: '8px',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Open Project Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}

          {/* Quick Create Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.03)',
              border: '2px dashed var(--border-color)',
              borderRadius: '14px',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: '260px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.03)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              color: 'var(--accent-cyan)'
            }}>
              <Plus size={24} />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Create New Project
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '220px' }}>
              Initialize a clean workspace with independent trackers and test runners.
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: 'var(--accent-cyan)' }}>
              Create New Engineering Project
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your new project will have completely isolated requirements, risks, and test execution runs.
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="e.g. RoboClean Autonomous Floor Scrubber V2"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  style={{ width: '100%' }}
                  className="mono"
                  placeholder="e.g. CLEAN"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Short 3-6 letter identifier used to prefix all requirements and test cases (e.g. CLEAN-SYS-001).
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Description
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                  placeholder="Briefly describe the engineering scope, safety classification, and system goals..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-dark)',
                    color: 'var(--text-main)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              Edit Project Details
            </h3>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Key *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  style={{ width: '100%' }}
                  className="mono"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Project Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-dark)',
                    color: 'var(--text-main)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
