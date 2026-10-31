import React, { useEffect, useState, useRef } from 'react';
import { FolderArchive, Plus, CheckCircle2, FileText, GitCompare } from 'lucide-react';
import { api } from '../api/client';
import { Baseline } from '../types/elm';

export const BaselinesView: React.FC = () => {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [versionTag, setVersionTag] = useState('');
  const [desc, setDesc] = useState('');

  // Resizable Sidebar width state (persisted to localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('roboserv_baselines_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 200 && parsed <= 550) return parsed;
      }
    } catch (e) {}
    return 300;
  });

  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(e.clientX, 550));
      sidebarWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('roboserv_baselines_sidebar_width', String(sidebarWidthRef.current));
      } catch (e) {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    loadBaselines();
  }, []);

  const loadBaselines = () => {
    api.getBaselines().then((data) => {
      setBaselines(data);
      if (data.length > 0) {
        api.getBaselineDetail(data[0].id).then(setSelectedBaseline);
      }
    }).catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createBaseline({
      project_id: 1,
      name,
      version_tag: versionTag,
      description: desc,
      created_by: 1
    });
    setShowCreateModal(false);
    setName('');
    setVersionTag('');
    setDesc('');
    loadBaselines();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Sidebar List */}
      <div style={{ width: `${sidebarWidth}px`, flexShrink: 0, backgroundColor: 'var(--bg-sidebar)', padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Baselines & Freezes</span>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--primary)', color: '#fff' }}
          >
            + Freeze
          </button>
        </div>

        {baselines.map((b) => (
          <div
            key={b.id}
            onClick={() => api.getBaselineDetail(b.id).then(setSelectedBaseline)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: selectedBaseline?.id === b.id ? 'var(--bg-hover)' : 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '8px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{b.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }} className="mono">{b.version_tag}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Frozen items: {b.item_count || 4}
            </div>
          </div>
        ))}
      </div>

      {/* RESIZER SPLITTER */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onDoubleClick={() => {
          setSidebarWidth(300);
          try { localStorage.setItem('roboserv_baselines_sidebar_width', '300'); } catch (e) {}
        }}
        title="Drag with mouse cursor to resize Sidebar (Double-click to reset)"
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? 'var(--accent-cyan)' : 'transparent',
          borderRight: isResizing ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
          transition: 'background-color 0.15s ease',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.35)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '32px',
          borderRadius: '2px',
          backgroundColor: isResizing ? 'var(--accent-cyan)' : 'var(--text-muted)',
          opacity: 0.6
        }} />
      </div>

      {/* Main Detail Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--bg-dark)' }}>
        {selectedBaseline ? (
          <div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-verified mono" style={{ fontSize: '0.8rem' }}>{selectedBaseline.version_tag}</span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '4px' }}>{selectedBaseline.name}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedBaseline.description}</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Created by: {selectedBaseline.author_name || 'Alex Chen'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px' }}>Frozen Snapshot Objects</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>OBJECT KEY</th>
                  <th style={{ padding: '12px 16px' }}>TITLE</th>
                  <th style={{ padding: '12px 16px' }}>FROZEN VERSION</th>
                  <th style={{ padding: '12px 16px' }}>STATUS AT FREEZE</th>
                </tr>
              </thead>
              <tbody>
                {selectedBaseline.items?.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }} className="mono">{item.object_key}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.title}</td>
                    <td style={{ padding: '12px 16px' }} className="mono">v{item.snapshot_version}</td>
                    <td style={{ padding: '12px 16px' }}><span className="badge badge-approved">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px' }}>Select a baseline snapshot to inspect</div>
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '450px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Create Engineering Baseline Freeze</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Baseline Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} placeholder="e.g. Navigation Release V1.2 Freeze" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Version Tag</label>
                <input type="text" required value={versionTag} onChange={(e) => setVersionTag(e.target.value)} style={{ width: '100%' }} placeholder="e.g. v1.2-nav-approved" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: '100%' }} placeholder="Reason for baseline freeze..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600 }}>Freeze Baseline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
