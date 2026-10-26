import React, { useState } from 'react';
import { GitCompare, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Tracker, EngineeringObject, Relationship } from '../types/elm';
import { createNewTabHandlers } from '../utils/tabOpener';

interface TraceabilityMatrixViewProps {
  trackers: Tracker[];
  allObjects: EngineeringObject[];
  relationships: Relationship[];
  onAddRelationship: (source_id: number, target_id: number, type: string) => void;
  onDeleteRelationship: (id: number) => void;
}

export const TraceabilityMatrixView: React.FC<TraceabilityMatrixViewProps> = ({
  trackers,
  allObjects,
  relationships,
  onAddRelationship,
  onDeleteRelationship
}) => {
  const [sourceTrackerId, setSourceTrackerId] = useState<number>(trackers[0]?.id || 1);
  const [targetTrackerId, setTargetTrackerId] = useState<number>(trackers[4]?.id || trackers[0]?.id || 5);

  const activeSourceId = trackers.some(t => t.id === sourceTrackerId) ? sourceTrackerId : (trackers[0]?.id || 0);
  const activeTargetId = trackers.some(t => t.id === targetTrackerId) ? targetTrackerId : (trackers[4]?.id || trackers[0]?.id || 0);

  const sources = allObjects.filter(o => o.tracker_id === activeSourceId);
  const targets = allObjects.filter(o => o.tracker_id === activeTargetId);

  const hasLink = (sourceId: number, targetId: number) => {
    return relationships.some(r => r.source_id === sourceId && r.target_id === targetId);
  };

  const getRelationship = (sourceId: number, targetId: number) => {
    return relationships.find(r => r.source_id === sourceId && r.target_id === targetId);
  };

  const toggleLink = (sourceId: number, targetId: number) => {
    const existing = getRelationship(sourceId, targetId);
    if (existing) {
      onDeleteRelationship(existing.id);
    } else {
      onAddRelationship(sourceId, targetId, 'VERIFIED_BY');
    }
  };

  // Coverage statistics
  const unverifiedReqs = allObjects.filter(o =>
    o.type === 'REQUIREMENT' &&
    !relationships.some(r => r.source_id === o.id && r.relationship_type === 'VERIFIED_BY')
  );

  const orphanTests = allObjects.filter(o =>
    o.type === 'TEST_CASE' &&
    !relationships.some(r => r.target_id === o.id && r.relationship_type === 'VERIFIED_BY')
  );

  const unmitigatedRisks = allObjects.filter(o =>
    o.type === 'RISK' &&
    !relationships.some(r => r.source_id === o.id && r.relationship_type === 'MITIGATED_BY')
  );

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 60px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bidirectional Traceability Matrix</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time relationship mapping & verification coverage matrix across unique object IDs
          </p>
        </div>

        {/* Tracker Selectors */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <select value={activeSourceId} onChange={(e) => setSourceTrackerId(Number(e.target.value))}>
            {trackers.map(t => <option key={t.id} value={t.id}>Source: {t.name}</option>)}
          </select>

          <ArrowRight size={16} color="var(--text-muted)" />

          <select value={activeTargetId} onChange={(e) => setTargetTrackerId(Number(e.target.value))}>
            {trackers.map(t => <option key={t.id} value={t.id}>Target: {t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Coverage Alerts Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="var(--accent-emerald)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>Requirement Verification</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
              {unverifiedReqs.length === 0 ? '100% Requirements Verified' : `${unverifiedReqs.length} Unverified Requirements`}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GitCompare size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Test Case Allocation</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
              {orphanTests.length === 0 ? 'All Test Cases Mapped to Reqs' : `${orphanTests.length} Tests Without Requirements`}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={24} color="var(--accent-amber)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>Risk Mitigation Coverage</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
              {unmitigatedRisks.length === 0 ? 'All Risks Have Mitigations' : `${unmitigatedRisks.length} Unmitigated Hazards`}
            </div>
          </div>
        </div>
      </div>

      {/* 2D Matrix Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflowX: 'auto' }}>
        {sources.length > 0 && targets.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', minWidth: '220px' }}>
                  SOURCE \ TARGET
                </th>
                {targets.map((target) => {
                  const targetHandlers = createNewTabHandlers({
                    view: 'TRACKER',
                    trackerId: target.tracker_id,
                    objectId: target.id,
                    objectKey: target.object_key,
                    label: `[${target.object_key}] ${target.title}`
                  });
                  return (
                    <th
                      key={target.id}
                      {...targetHandlers}
                      title={`[${target.object_key}] ${target.title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                      style={{ padding: '12px', fontSize: '0.8rem', minWidth: '130px', cursor: 'pointer' }}
                    >
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }} className="mono">{target.object_key}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                        {target.title}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const sourceHandlers = createNewTabHandlers({
                  view: 'TRACKER',
                  trackerId: source.tracker_id,
                  objectId: source.id,
                  objectKey: source.object_key,
                  label: `[${source.object_key}] ${source.title}`
                });
                return (
                  <tr key={source.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td
                      {...sourceHandlers}
                      title={`[${source.object_key}] ${source.title}\n💡 [Ctrl + Right-Click] Open in new tab`}
                      style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }} className="mono">{source.object_key}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{source.title}</div>
                    </td>
                  {targets.map((target) => {
                    const isLinked = hasLink(source.id, target.id);
                    return (
                      <td
                        key={target.id}
                        onClick={() => toggleLink(source.id, target.id)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          backgroundColor: isLinked ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        {isLinked ? (
                          <div style={{ display: 'inline-flex', padding: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', color: '#000' }}>
                            <Check size={14} />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--border-color)', fontSize: '1.2rem' }}>•</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No engineering items found in the selected trackers. Create items in both trackers to render the 2D matrix.
          </div>
        )}
      </div>
    </div>
  );
};
