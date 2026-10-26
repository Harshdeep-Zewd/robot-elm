import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  FolderArchive,
  ArrowUpRight,
  Search,
  X,
  FileText,
  Boxes,
  FlaskConical,
  CheckSquare,
  GitBranch,
  Sparkles
} from 'lucide-react';
import { ViewMode } from './Sidebar';
import { Project, Tracker, EngineeringObject, TestRun } from '../types/elm';
import { cleanTrackerName, getTrackerCategory, CANONICAL_CATEGORIES, CanonicalCategory } from '../data/canonicalTrackers';
import { createNewTabHandlers } from '../utils/tabOpener';

interface DashboardViewProps {
  project: Project;
  onNavigate: (view: ViewMode, tracker?: Tracker) => void;
  trackers: Tracker[];
  allObjects?: EngineeringObject[];
  testRuns?: TestRun[];
}

interface CategoryGroupDef {
  id: number;
  name: CanonicalCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  subtitle: string;
}

const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    id: 1,
    name: 'Requirements & Verification',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    icon: FileText,
    subtitle: 'Customer specifications, functional/system requirements, interface agreements, and verification criteria.'
  },
  {
    id: 2,
    name: 'Architecture & Hardware',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.28)',
    icon: Boxes,
    subtitle: 'System decomposition, electrical & mechanical designs, communication matrices, and HW/SW interfaces.'
  },
  {
    id: 3,
    name: 'Testing, Sets & Runs',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    icon: FlaskConical,
    subtitle: 'Test strategies, qualification plans, test cases with steps, test configurations, test sets, and runs.'
  },
  {
    id: 4,
    name: 'Safety & Risks',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.28)',
    icon: ShieldAlert,
    subtitle: 'Functional safety management plans, ISO 13482 safety cases, ASIL hazard matrices, and QA gates.'
  },
  {
    id: 5,
    name: 'Defects & Problems',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
    icon: AlertTriangle,
    subtitle: 'Defect logging, hardware failures, software bugs, Octane sync tickets, and root cause analysis.'
  },
  {
    id: 6,
    name: 'Tasks & Epics',
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.1)',
    borderColor: 'rgba(129, 140, 248, 0.28)',
    icon: CheckSquare,
    subtitle: 'Multi-sprint engineering epics, hardware/software development tasks, QA action items, and work packages.'
  },
  {
    id: 7,
    name: 'Changes & Releases',
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.28)',
    icon: GitBranch,
    subtitle: 'Engineering change requests (ECR), component BOMs, hardware revisions, and commercial system releases.'
  },
  {
    id: 8,
    name: 'Documents & Governance',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.28)',
    icon: FolderArchive,
    subtitle: 'Normative reference standards, minutes of meeting (MoM), stakeholder directories, and project RACI teams.'
  },
  {
    id: 9,
    name: 'Custom Trackers',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.28)',
    icon: Sparkles,
    subtitle: 'User-created custom engineering trackers, special inspection modules, and project-specific repositories.'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onNavigate,
  trackers,
  allObjects = [],
  testRuns = []
}) => {
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardCategory, setDashboardCategory] = useState<string>('ALL');

  const currentTrackerIds = trackers.map(t => t.id);
  const projectObjects = allObjects.filter(o => currentTrackerIds.includes(o.tracker_id));
  const reqs = projectObjects.filter(o => o.type === 'REQUIREMENT');
  const testCases = projectObjects.filter(o => o.type === 'TEST_CASE');
  const risks = projectObjects.filter(o => o.type === 'RISK' || o.object_key.includes('RISK'));
  const pRuns = testRuns.filter(r => r.project_id === project.id);
  const latestRun = pRuns.length > 0 ? pRuns[0] : null;

  // Filter trackers by search query
  const q = dashboardSearch.trim().toLowerCase();
  const searchMatchedTrackers = trackers.filter(t => {
    if (!q) return true;
    const cleanName = cleanTrackerName(t.name).toLowerCase();
    const rawName = (t.name || '').toLowerCase();
    const key = (t.key || '').toLowerCase();
    const prefix = (t.prefix || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return cleanName.includes(q) || rawName.includes(q) || key.includes(q) || prefix.includes(q) || desc.includes(q);
  });

  // Groups to display based on category filter
  const visibleGroups = CATEGORY_GROUPS.filter(group => {
    if (dashboardCategory === 'ALL') return true;
    return group.name === dashboardCategory;
  });

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 60px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {project.name}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {project.description || 'Systems Engineering Lifecycle Management Workspace'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigate('TRACEABILITY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <span>Traceability Matrix</span>
            <ArrowUpRight size={16} />
          </button>

          <button
            onClick={() => onNavigate('TEST_EXECUTION')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--accent-emerald)',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <span>Launch Test Runner</span>
            <Activity size={16} />
          </button>
        </div>
      </div>

      {/* Engineering Trackers Section */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {/* Title and Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-cyan)" />
              <span>Engineering Trackers</span>
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700
              }}>
                {trackers.length} Active in {project.key}
              </span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select any engineering tracker below to enter its dedicated 3-panel dashboard (Requirements, Pre/Post Actions, Traceability & Features).
            </p>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search across ${trackers.length} engineering trackers...`}
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 28px 8px 32px',
                fontSize: '0.84rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            {dashboardSearch && (
              <button
                onClick={() => setDashboardSearch('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={dashboardCategory}
            onChange={(e) => setDashboardCategory(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.84rem',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <option value="ALL">All Categories ({trackers.length} Trackers)</option>
            {CATEGORY_GROUPS.map(group => {
              const count = trackers.filter(t => getTrackerCategory(t) === group.name).length;
              return (
                <option key={group.name} value={group.name}>
                  Group {group.id}: {group.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Grouped Category Sections */}
        {(() => {
          let totalRendered = 0;

          const groupSections = visibleGroups.map((group) => {
            const groupTrackers = searchMatchedTrackers.filter(t => getTrackerCategory(t) === group.name);
            if (groupTrackers.length === 0) {
              if (dashboardCategory === group.name) {
                totalRendered++;
                const IconComponent = group.icon;
                return (
                  <div
                    key={group.id}
                    style={{
                      marginBottom: '32px',
                      backgroundColor: 'rgba(255, 255, 255, 0.015)',
                      border: `1px solid ${group.borderColor}`,
                      borderRadius: '10px',
                      padding: '20px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: `1px solid ${group.borderColor}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          backgroundColor: group.bgColor,
                          border: `1px solid ${group.borderColor}`,
                          color: group.color,
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}>
                          <IconComponent size={16} color={group.color} />
                          <span>Group {group.id}</span>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {group.name}
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                            {group.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-dark)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)'
                    }}>
                      <Sparkles size={30} color={group.color} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.85 }} />
                      <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        No {group.name} in this project yet
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Click <strong>"+ New"</strong> under Engineering Trackers in the left sidebar to create a custom tracker!
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }
            totalRendered += groupTrackers.length;

            const IconComponent = group.icon;

            return (
              <div
                key={group.id}
                style={{
                  marginBottom: '32px',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  border: `1px solid ${group.borderColor}`,
                  borderRadius: '10px',
                  padding: '20px'
                }}
              >
                {/* Group Section Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${group.borderColor}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: group.bgColor,
                      border: `1px solid ${group.borderColor}`,
                      color: group.color,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}>
                      <IconComponent size={16} color={group.color} />
                      <span>Group {group.id}</span>
                    </div>

                    <div>
                      <h3 style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: 0
                      }}>
                        <span>{group.name}</span>
                        <span style={{
                          fontSize: '0.72rem',
                          backgroundColor: group.bgColor,
                          color: group.color,
                          border: `1px solid ${group.borderColor}`,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700
                        }}>
                          {groupTrackers.length} Trackers
                        </span>
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                        {group.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subgrid of Numbered Tracker Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px'
                }}>
                  {groupTrackers.map((t, idx) => {
                    const count = allObjects.filter(o => o.tracker_id === t.id).length;
                    const cleanName = cleanTrackerName(t.name);
                    const itemNumber = `${group.id}.${idx + 1}`;

                    const cardTabHandlers = createNewTabHandlers(
                      {
                        projectKey: project.key.toLowerCase(),
                        view: 'TRACKER',
                        trackerId: t.id,
                        trackerKey: t.key,
                        label: cleanName
                      },
                      () => onNavigate('TRACKER', t)
                    );

                    return (
                      <div
                        key={t.id}
                        {...cardTabHandlers}
                        title={`${cleanName} (${t.key})\n💡 [Ctrl + Right-Click] Open in new tab`}
                        style={{
                          backgroundColor: 'var(--bg-dark)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '135px',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = group.color;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 18px ${group.bgColor}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* Group-specific item number (e.g. 1.1, 1.2...) */}
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: group.color,
                                backgroundColor: group.bgColor,
                                border: `1px solid ${group.borderColor}`,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                {itemNumber}
                              </span>

                              <span className="mono" style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {t.prefix || t.key}
                              </span>
                            </div>

                            <span style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: count > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'
                            }}>
                              {count} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>items</span>
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.3' }}>
                            {cleanName}
                          </h4>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.35', margin: 0 }}>
                            {t.description || `${t.type.replace(/_/g, ' ')} repository with full lifecycle traceability`}
                          </p>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '14px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase'
                          }}>
                            {t.type.replace(/_/g, ' ')}
                          </span>
                          <span style={{
                            fontSize: '0.74rem',
                            color: group.color,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <span>Open Tracker</span>
                            <ArrowUpRight size={13} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });

          if (totalRendered === 0) {
            return (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No engineering trackers found matching your search or category filter.
              </div>
            );
          }

          return <div>{groupSections}</div>;
        })()}
      </div>

      {/* Lifecycle & Verification Metrics */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
        Lifecycle & Verification Metrics
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Verification Coverage</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--accent-emerald)' }}>
            {reqs.length > 0 ? (testCases.length > 0 ? '100%' : '50%') : '0%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {reqs.length} Requirements & {testCases.length} Test Cases
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Safety Test Runs</span>
            <Activity size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--accent-cyan)' }}>
            {latestRun ? latestRun.overall_status : '0 Runs'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {latestRun ? `Latest: ${latestRun.name}` : 'No Test Runs launched yet'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Mitigated Risks</span>
            <ShieldAlert size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--accent-amber)' }}>
            {risks.length} Hazards
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {risks.length > 0 ? 'Hazards registered in Risk Matrix' : 'Zero hazards registered'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Active Trackers</span>
            <FolderArchive size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--accent-purple)' }}>
            {trackers.length} Trackers
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Configured for [{project.key}] Workspace
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Project Overview & Scope</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div><strong>Project Key:</strong> <span className="mono" style={{ color: 'var(--accent-cyan)' }}>[{project.key}]</span></div>
          <div><strong>Total Objects:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{projectObjects.length}</span></div>
          <div><strong>Total Test Runs:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{pRuns.length}</span></div>
          <div><strong>Owner:</strong> <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>👑 Zewd (Owner)</span></div>
        </div>
      </div>
    </div>
  );
};
