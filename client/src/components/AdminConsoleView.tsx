import React, { useState } from 'react';
import {
  Users,
  FolderPlus,
  FileCheck,
  ShieldCheck,
  UserPlus,
  Check,
  X,
  Plus,
  ArrowRight,
  Folder,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Pencil,
  Trash2
} from 'lucide-react';
import { User, Project, ProjectRequest, TrackerRequest, UserRole } from '../types/elm';
import { authService } from '../api/auth';

interface AdminConsoleViewProps {
  currentUser: User;
  projects: Project[];
  allObjects: any[];
  allTrackers: any[];
  onSelectProjectToInspect: (project: Project) => void;
  onCreateProject: (data: { key: string; name: string; description?: string }) => void;
  onUpdateProject?: (id: number, updates: Partial<Project>) => void;
  onDeleteProject?: (id: number) => void;
  onCreateTracker: (data: { name: string; key: string; type: string; enable_test_steps: boolean; enable_folders: boolean; category?: string }) => void;
  onRefreshData: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  currentUser,
  projects,
  allObjects,
  allTrackers,
  onSelectProjectToInspect,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTracker,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'REQUESTS' | 'PROJECTS' | 'AUDIT'>('REQUESTS');
  const [users, setUsers] = useState<User[]>(() => authService.getUsers());
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>(() => authService.getProjectRequests());
  const [trackerRequests, setTrackerRequests] = useState<TrackerRequest[]>(() => authService.getTrackerRequests());

  // Create User Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');

  // Create Project Modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projKey, setProjKey] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Edit Project Modal state
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjKey, setEditProjKey] = useState('');
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setEditProjKey(p.key);
    setEditProjName(p.name);
    setEditProjDesc(p.description || '');
    setShowEditProjectModal(true);
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editProjKey.trim() || !editProjName.trim()) return;
    if (onUpdateProject) {
      onUpdateProject(editingProject.id, {
        key: editProjKey.trim().toUpperCase(),
        name: editProjName.trim(),
        description: editProjDesc.trim()
      });
    }
    setShowEditProjectModal(false);
    setEditingProject(null);
    refreshAll();
  };

  const handleDeleteProjectClick = (p: Project) => {
    if (projects.length <= 1) {
      alert("Cannot delete the only remaining project.");
      return;
    }
    if (confirm(`Are you sure you want to delete project "${p.name}" (${p.key})? All associated trackers, requirements, and test data will be permanently deleted.`)) {
      if (onDeleteProject) {
        onDeleteProject(p.id);
      }
      setUsers(authService.getUsers());
      setProjectRequests(authService.getProjectRequests());
      setTrackerRequests(authService.getTrackerRequests());
    }
  };

  const refreshAll = () => {
    setUsers(authService.getUsers());
    setProjectRequests(authService.getProjectRequests());
    setTrackerRequests(authService.getTrackerRequests());
    onRefreshData();
  };

  const handleToggleUserStatus = (id: number) => {
    authService.toggleUserStatus(id);
    refreshAll();
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newName.trim()) return;

    authService.createUser({
      username: newUsername,
      email: newEmail,
      name: newName,
      password: newPassword.trim() || 'user123',
      role: newRole
    });

    setShowUserModal(false);
    setNewUsername('');
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    refreshAll();
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projKey.trim() || !projName.trim()) return;

    onCreateProject({
      key: projKey,
      name: projName,
      description: projDesc
    });

    setShowProjectModal(false);
    setProjKey('');
    setProjName('');
    setProjDesc('');
    refreshAll();
  };

  const handleApproveProjectRequest = (req: ProjectRequest) => {
    authService.resolveProjectRequest(req.id, true);
    onCreateProject({
      key: req.key,
      name: req.requested_name,
      description: req.description || `Provisioned for ${req.user_name}`
    });
    refreshAll();
  };

  const handleRejectProjectRequest = (req: ProjectRequest) => {
    authService.resolveProjectRequest(req.id, false);
    refreshAll();
  };

  const handleApproveTrackerRequest = (req: TrackerRequest) => {
    authService.resolveTrackerRequest(req.id, true);
    onCreateTracker({
      name: req.requested_name,
      key: req.requested_key,
      type: req.type,
      category: 'Custom Trackers',
      enable_test_steps: req.enable_test_steps,
      enable_folders: req.enable_folders
    });
    refreshAll();
  };

  const handleRejectTrackerRequest = (req: TrackerRequest) => {
    authService.resolveTrackerRequest(req.id, false);
    refreshAll();
  };

  const pendingProjectReqs = projectRequests.filter(r => r.status === 'PENDING');
  const pendingTrackerReqs = trackerRequests.filter(r => r.status === 'PENDING');
  const totalPending = pendingProjectReqs.length + pendingTrackerReqs.length;

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: 'calc(100vh - 60px)', backgroundColor: 'var(--bg-dark)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={16} />
              <span>ADMIN OWNER SUPERUSER HUB</span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
            Platform Governance & User Request Control Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage user accounts, approve project/tracker requests, and inspect live engineering workspaces across the site.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowUserModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--accent-cyan)',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} />
            <span>+ Create User Account</span>
          </button>

          <button
            onClick={() => setShowProjectModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={16} />
            <span>+ Provision New Project</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Registered Users</span>
            <Users size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--accent-cyan)' }}>
            {users.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {users.filter(u => u.status === 'ACTIVE').length} Active • {users.filter(u => u.status === 'SUSPENDED').length} Suspended
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Pending Requests</span>
            <FileCheck size={18} color={totalPending > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: totalPending > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            {totalPending}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {pendingProjectReqs.length} Projects • {pendingTrackerReqs.length} Trackers
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Active Projects</span>
            <Folder size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--accent-emerald)' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {allTrackers.length} Total Trackers Configured
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Engineering Objects</span>
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--accent-purple)' }}>
            {allObjects.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across all site trackers & projects
          </div>
        </div>
      </div>

      {/* Prominent Tab Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('REQUESTS')}
          style={{
            padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'REQUESTS' ? 'var(--accent-amber)' : 'var(--text-muted)',
            borderBottom: activeTab === 'REQUESTS' ? '3px solid var(--accent-amber)' : 'none',
            backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <FileCheck size={18} />
          <span>Pending Request Queue ({totalPending})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROJECTS')}
          style={{
            padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'PROJECTS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'PROJECTS' ? '3px solid var(--accent-cyan)' : 'none',
            backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <Folder size={18} />
          <span>Projects Directory & Live Inspector ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          style={{
            padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'USERS' ? 'var(--accent-emerald)' : 'var(--text-muted)',
            borderBottom: activeTab === 'USERS' ? '3px solid var(--accent-emerald)' : 'none',
            backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <Users size={18} />
          <span>User Directory & Access Control ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING REQUEST QUEUE */}
      {activeTab === 'REQUESTS' && (
        <div>
          {totalPending > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Project Requests */}
              {pendingProjectReqs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderPlus size={16} />
                    <span>Project Creation Requests ({pendingProjectReqs.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingProjectReqs.map(req => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {req.requested_name} <span className="mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>({req.key})</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Requested by <strong style={{ color: 'var(--accent-cyan)' }}>{req.user_name}</strong> • {new Date(req.created_at).toLocaleDateString()}
                          </div>
                          {req.reason && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '4px', fontStyle: 'italic' }}>
                              Reason: "{req.reason}"
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleRejectProjectRequest(req)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--accent-rose)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApproveProjectRequest(req)}
                            style={{
                              backgroundColor: 'var(--accent-emerald)',
                              color: '#000',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={14} />
                            <span>Approve & Provision Project</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracker Requests */}
              {pendingTrackerReqs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} />
                    <span>Custom Tracker Creation Requests ({pendingTrackerReqs.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingTrackerReqs.map(req => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {req.requested_name} <span className="mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>({req.requested_key})</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Target Project: <strong>{req.project_name}</strong> • Requested by <strong style={{ color: 'var(--accent-cyan)' }}>{req.user_name}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                            Config: Test Steps = {req.enable_test_steps ? 'YES' : 'NO'}, Subparts/Folders = {req.enable_folders ? 'YES' : 'NO'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleRejectTrackerRequest(req)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--accent-rose)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApproveTrackerRequest(req)}
                            style={{
                              backgroundColor: 'var(--accent-emerald)',
                              color: '#000',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={14} />
                            <span>Approve & Create Tracker</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <FileCheck size={36} color="var(--accent-emerald)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                All User Requests are Up to Date
              </div>
              <p style={{ fontSize: '0.85rem' }}>No pending project or custom tracker requests in queue.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECTS DIRECTORY & LIVE INSPECTOR */}
      {activeTab === 'PROJECTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {projects.map(p => {
            const pTrackers = allTrackers.filter(t => t.project_id === p.id);
            const pObjCount = allObjects.filter(o => pTrackers.some(t => t.id === o.tracker_id)).length;
            const assignedUsers = users.filter(u => u.assigned_project_ids.includes(p.id));

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {p.key}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pTrackers.length} Trackers • {pObjCount} Engineering Objects
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                    {p.description || 'Systems Engineering Lifecycle Workspace'}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Assigned Engineers ({assignedUsers.length}):{' '}
                    <strong style={{ color: 'var(--accent-cyan)' }}>
                      {assignedUsers.map(u => u.name.split(' ')[0]).join(', ') || 'Zewd'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => onSelectProjectToInspect(p)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <span>Inspect Project</span>
                    <ArrowRight size={16} />
                  </button>

                  {currentUser?.role === 'ADMIN_OWNER' && (
                    <>
                      <button
                        onClick={() => handleOpenEditProject(p)}
                        title="Edit project details"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-cyan)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Pencil size={15} />
                        <span>Edit</span>
                      </button>

                      {projects.length > 1 && (
                        <button
                          onClick={() => handleDeleteProjectClick(p)}
                          title="Delete project"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--accent-rose)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
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

      {/* TAB 3: USER DIRECTORY & ACCESS CONTROL */}
      {activeTab === 'USERS' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px', fontWeight: 700 }}>USERNAME & NAME</th>
                <th style={{ padding: '14px', fontWeight: 700 }}>EMAIL</th>
                <th style={{ padding: '14px', fontWeight: 700 }}>SYSTEM ROLE</th>
                <th style={{ padding: '14px', fontWeight: 700 }}>ASSIGNED PROJECTS</th>
                <th style={{ padding: '14px', fontWeight: 700 }}>STATUS</th>
                <th style={{ padding: '14px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSuperAdmin = u.role === 'ADMIN_OWNER';
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }} className="mono">@{u.username}</div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '14px' }}>
                      {u.role === 'ADMIN_OWNER' ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          👑 ADMIN OWNER
                        </span>
                      ) : u.role === 'DEMO' ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          🎭 DEMO SANDBOX
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          👤 STANDARD USER
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {projects.filter(p => u.assigned_project_ids.includes(p.id)).map(p => p.name.split(' ')[0]).join(', ') || 'All Projects'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {u.status === 'ACTIVE' ? (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem' }}>● ACTIVE</span>
                      ) : (
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.75rem' }}>● SUSPENDED</span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {!isSuperAdmin && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          style={{
                            backgroundColor: u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: u.status === 'ACTIVE' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                            border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {u.status === 'ACTIVE' ? <Lock size={12} /> : <Unlock size={12} />}
                          <span>{u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Create User Account */}
      {showUserModal && (
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
            width: '460px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              Create New User Account
            </h3>

            <form onSubmit={handleCreateUserSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="e.g. sarah_systems"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="e.g. Sarah Jenkins (Safety Engineer)"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="sarah@roboserv.io"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="Set account password (e.g. sarah123)"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="USER">Standard User (Single Project + Request Permission)</option>
                  <option value="DEMO">Demo Sandbox Account</option>
                  <option value="ADMIN_OWNER">Admin Owner (Full Superadmin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700 }}
                >
                  Create User Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Project */}
      {showProjectModal && (
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
            width: '460px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              Provision New Engineering Project
            </h3>

            <form onSubmit={handleCreateProjectSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={projKey}
                  onChange={(e) => setProjKey(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. AGV, DRONE, BOT"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="e.g. Autonomous Warehouse AGV Base"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  placeholder="Systems engineering lifecycle project details..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700 }}
                >
                  Provision Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Project */}
      {showEditProjectModal && editingProject && (
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
            width: '460px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              Edit Project Details
            </h3>

            <form onSubmit={handleSaveEditProject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={editProjKey}
                  onChange={(e) => setEditProjKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProjName}
                  onChange={(e) => setEditProjName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editProjDesc}
                  onChange={(e) => setEditProjDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setEditingProject(null);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
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
