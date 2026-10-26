import React from 'react';

export interface NewTabOptions {
  account?: string;
  projectKey?: string;
  projectId?: number;
  view?: string;
  trackerId?: number | string;
  trackerKey?: string;
  objectId?: number | string;
  objectKey?: string;
  label?: string;
}

/**
 * Builds a clean deep-link URL preserving current account, project,
 * view, tracker, and object parameters.
 */
export function buildDeepLink(opts: NewTabOptions): string {
  const url = new URL(window.location.origin + window.location.pathname);
  const currentParams = new URLSearchParams(window.location.search);

  // Preserve or override account (demo or zewd)
  const account = opts.account || currentParams.get('account') || 'zewd';
  if (account) {
    url.searchParams.set('account', account.toLowerCase());
  }

  // If opening portal, omit project/tracker/object
  if (opts.view === 'PORTAL') {
    url.searchParams.delete('project');
    url.searchParams.delete('view');
    url.searchParams.delete('tracker');
    url.searchParams.delete('object');
    return url.toString();
  }

  // Preserve or override project
  const project = opts.projectKey || currentParams.get('project') || 'robo';
  if (project) {
    url.searchParams.set('project', project.toLowerCase());
  }

  // View mode
  if (opts.view) {
    url.searchParams.set('view', opts.view.toLowerCase());
  }

  // Tracker identifier
  if (opts.trackerId !== undefined && opts.trackerId !== null) {
    url.searchParams.set('tracker', String(opts.trackerId));
  } else if (opts.trackerKey) {
    url.searchParams.set('tracker', opts.trackerKey);
  }

  // Object identifier
  if (opts.objectId !== undefined && opts.objectId !== null) {
    url.searchParams.set('object', String(opts.objectId));
  } else if (opts.objectKey) {
    url.searchParams.set('object', opts.objectKey);
  }

  return url.toString();
}

/**
 * Displays an ephemeral notification pill confirming the tab was opened.
 */
export function showTabToast(label?: string) {
  try {
    const existing = document.getElementById('new-tab-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'new-tab-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid #38bdf8';
    toast.style.borderRadius = '8px';
    toast.style.padding = '10px 16px';
    toast.style.color = '#fff';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.3)';
    toast.style.zIndex = '99999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.innerHTML = `
      <span style="color: #38bdf8; font-size: 1.1rem; line-height: 1;">↗</span>
      <span>Opened <strong>${label || 'interface'}</strong> in a new tab</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  } catch (e) {}
}

/**
 * Opens the target interface in a new browser tab.
 */
export function openInNewTab(opts: NewTabOptions) {
  const targetUrl = buildDeepLink(opts);
  try {
    const newWindow = window.open(targetUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    }
    showTabToast(opts.label || (opts.objectKey ? `[${opts.objectKey}]` : (opts.trackerKey || opts.view || 'interface')));
  } catch (e) {
    console.error('Failed to open new tab:', e);
  }
}

/**
 * Creates mouse event handlers to catch [Ctrl + Right Click],
 * [Ctrl + Left Click], and Middle Click, routing them to open in a new tab.
 * Regular clicks continue to trigger the normalClick callback.
 */
export function createNewTabHandlers(
  opts: NewTabOptions,
  normalClick?: (e: React.MouseEvent) => void
) {
  return {
    onContextMenu: (e: React.MouseEvent) => {
      // User specifically requested: [Ctrl + Right click] opens in a new tab!
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        openInNewTab(opts);
      }
    },
    onAuxClick: (e: React.MouseEvent) => {
      // Handle middle-click (button 1) or auxiliary click with Ctrl
      if (e.button === 1 || ((e.ctrlKey || e.metaKey) && e.button === 2)) {
        e.preventDefault();
        e.stopPropagation();
        openInNewTab(opts);
      }
    },
    onClick: (e: React.MouseEvent) => {
      // Handle Ctrl + Left Click
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        openInNewTab(opts);
        return;
      }
      if (normalClick) {
        normalClick(e);
      }
    }
  };
}
