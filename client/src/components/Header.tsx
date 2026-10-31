import React, { useState } from 'react';
import { Bot, Search, Plus, FolderPlus, ChevronDown, Check, User, ShieldCheck, LogOut, Sparkles, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Project, User as UserType } from '../types/elm';
import { createNewTabHandlers } from '../utils/tabOpener';

interface HeaderProps {
  project: Project | null;
  projects: Project[];
  currentUser: UserType | null;
  onSelectProject: (p: Project) => void;
  onCreateProject: (data: { key: string; name: string; description?: string }) => void;
  onUpdateProject?: (id: number, updates: Partial<Project>) => void;
  onDeleteProject?: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLogout: () => void;
  onOpenAdminConsole?: () => void;
  onBackToProjects?: () => void;
  syncStatus?: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR';
  lastSyncedAt?: string | null;
  onForceSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projects,
  currentUser,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  searchQuery,
  setSearchQuery,
  onLogout,
  onOpenAdminConsole,
  onBackToProjects,
  syncStatus = 'SYNCED',
  lastSyncedAt,
  onForceSync
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !name.trim()) return;

    onCreateProject({
      key: key.trim().toUpperCase(),
      name: name.trim(),
      description: desc.trim()
    });

    setShowModal(false);
    setKey('');
    setName('');
    setDesc('');
  };

  const handleOpenEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(p);
    setEditKey(p.key);
    setEditName(p.name);
    setEditDesc(p.description || '');
    setShowEditModal(true);
    setShowDropdown(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editKey.trim() || !editName.trim()) return;

    if (onUpdateProject) {
      onUpdateProject(editingProject.id, {
        key: editKey.trim().toUpperCase(),
        name: editName.trim(),
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
    if (confirm(`Are you sure you want to delete project "${p.name}" (${p.key})? All associated trackers, requirements, and test data will be permanently removed.`)) {
      if (onDeleteProject) {
        onDeleteProject(p.id);
      }
    }
  };

  return (
    <header style={{
      height: '60px',
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          padding: '6px 12px',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 700,
          cursor: onBackToProjects ? 'pointer' : 'default'
        }}
        onClick={onBackToProjects}
        title={onBackToProjects ? 'Return to Projects Portal' : 'RoboServ ELM'}
        >
          <Bot size={22} />
          <span>RoboServ ELM</span>
        </div>

        {/* Back to All Projects Portal Button */}
        {onBackToProjects && (
          <button
            {...createNewTabHandlers({ view: 'PORTAL', label: 'All Projects Portal' }, onBackToProjects)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Return to Projects Page&#10;💡 [Ctrl + Right-Click] Open in new tab"
          >
            <ArrowLeft size={14} />
            <span>← All Projects</span>
          </button>
        )}

        {/* Project Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>{project ? project.name : 'Select Project'}</span>
            {project && <span className="badge badge-verified mono" style={{ fontSize: '0.7rem' }}>{project.key}</span>}
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              width: '360px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 200,
              padding: '8px'
            }}>
              {/* Back to Projects Portal Option in Dropdown */}
              {onBackToProjects && (
                <div
                  onClick={() => {
                    setShowDropdown(false);
                    onBackToProjects();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>← View All Projects Portal</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Engineering Workspaces ({projects.length})
                </span>
                {currentUser?.role === 'ADMIN_OWNER' && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>+ New Project</span>
                  </button>
                )}
              </div>

              {projects.map((p) => {
                const projTabHandlers = createNewTabHandlers(
                  {
                    projectKey: p.key.toLowerCase(),
                    view: 'DASHBOARD',
                    label: p.name
                  },
                  () => {
                    onSelectProject(p);
                    setShowDropdown(false);
                  }
                );

                return (
                  <div
                    key={p.id}
                    {...projTabHandlers}
                    title={`${p.name} (${p.key})\n💡 [Ctrl + Right-Click] Open in new tab`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: project?.id === p.id ? 'var(--bg-hover)' : 'transparent',
                      color: project?.id === p.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      marginBottom: '2px'
                    }}
                  >
                  <div style={{ flex: 1, overflow: 'hidden', paddingRight: '8px' }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name} <span className="mono" style={{ fontSize: '0.7rem', opacity: 0.8 }}>({p.key})</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.description || 'No description'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {project?.id === p.id && <Check size={16} color="var(--accent-cyan)" />}
                    {currentUser?.role === 'ADMIN_OWNER' && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(p, e)}
                          title="Edit project details"
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          <Pencil size={14} color="var(--accent-cyan)" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(p, e)}
                            title="Delete project"
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              padding: '4px',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
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
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: syncStatus === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : (syncStatus === 'SYNCING' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.12)'),
              border: `1px solid ${syncStatus === 'ERROR' ? 'rgba(239, 68, 68, 0.4)' : (syncStatus === 'SYNCING' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.35)')}`,
              color: syncStatus === 'ERROR' ? '#f87171' : (syncStatus === 'SYNCING' ? '#38bdf8' : '#34d399'),
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: syncStatus === 'SYNCING' ? '#38bdf8' : (syncStatus === 'ERROR' ? '#ef4444' : '#10b981'),
              boxShadow: syncStatus === 'SYNCING' ? '0 0 8px #38bdf8' : '0 0 6px #10b981'
            }} />
            {syncStatus === 'SYNCING' ? 'Syncing...' : (syncStatus === 'ERROR' ? 'Sync Error' : `Global Synced ${lastSyncedAt ? '• ' + lastSyncedAt : ''}`)}
          </button>
        )}

        {/* Search Input */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px', fontSize: '0.85rem' }}
          />
        </div>

        {/* User Profile / Role Indicator & Logout */}
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
              gap: '4px',
              marginTop: '2px'
            }}>
              {currentUser?.username === 'demo' ? '🎭 Demo Sandbox' : '👑 Zewd (Owner)'}
            </div>
          </div>

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
        </div>
      </div>

      {/* New Project Modal */}
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Create New Engineering Project</h3>

            <form onSubmit={handleSubmitCreate}>
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
                  placeholder="e.g. CLEAN"
                  className="mono"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Prefix used for items: CLEAN-SYS-001, CLEAN-RISK-001.
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="Engineering scope and details..."
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
                  Create & Initialize Project
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              Edit Project Details
            </h3>

            <form onSubmit={handleSubmitEdit}>
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
                  Project Key (Prefix) *
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
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                  }}
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
                  Save Project Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

