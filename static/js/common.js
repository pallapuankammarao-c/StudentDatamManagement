/**
 * common.js - Global App Shell, Theme, Notifications & Search
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initGlobalSearch();
  initNotifications();
  initShareModal();
});

/* ==========================================================================
   THEME TOGGLE (DARK / LIGHT)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('app-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('app-theme', next);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('#theme-toggle-btn i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  // Dispatch custom event for Chart.js re-render if needed
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

/* ==========================================================================
   SIDEBAR & RESPONSIVE DRAWER
   ========================================================================== */
function initSidebar() {
  const toggleBtn = document.getElementById('menu-toggle-btn');
  const sidebar = document.querySelector('.app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
}

/* ==========================================================================
   GLOBAL SEARCH DROPDOWN
   ========================================================================== */
function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  let debounceTimeout = null;

  if (!searchInput || !dropdown) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();
    if (!query) {
      dropdown.classList.remove('show');
      dropdown.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        renderSearchResults(data.items || [], dropdown);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  searchInput.addEventListener('focus', () => {
    if (dropdown.children.length > 0) dropdown.classList.add('show');
  });
}

function renderSearchResults(items, container) {
  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fa-solid fa-magnifying-glass" style="margin-bottom: 0.5rem; display: block; font-size: 1.2rem;"></i>
        No matching students found
      </div>
    `;
    container.classList.add('show');
    return;
  }

  container.innerHTML = items.map(s => `
    <a href="/students/${encodeURIComponent(s.id)}" class="search-result-item">
      <div class="student-avatar" style="width: 32px; height: 32px; font-size: 0.75rem;">
        ${s.name.charAt(0)}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${escapeHtml(s.name)}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted);">
          ${escapeHtml(s.id)} · ${escapeHtml(s.course)} (Yr ${s.year}) · ${s.marks}%
        </div>
      </div>
      <span class="badge-status ${getStatusClass(s.status)}" style="font-size: 0.7rem; padding: 0.15rem 0.45rem;">
        ${s.status}
      </span>
    </a>
  `).join('');

  container.classList.add('show');
}

/* ==========================================================================
   NOTIFICATIONS BELL
   ========================================================================== */
function initNotifications() {
  const notifBtn = document.getElementById('notif-bell-btn');
  const notifDropdown = document.getElementById('notifications-dropdown');
  const notifList = document.getElementById('notifications-list');

  if (!notifBtn || !notifDropdown) return;

  notifBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isShowing = notifDropdown.classList.contains('show');
    if (!isShowing) {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        renderNotifications(data.items || [], notifList);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    }
    notifDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove('show');
    }
  });
}

function renderNotifications(items, container) {
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">All caught up! No alerts.</div>`;
    return;
  }
  container.innerHTML = items.map(n => `
    <div class="notification-item">
      <div class="notif-icon">
        <i class="fa-solid fa-${n.icon || 'bell'}"></i>
      </div>
      <div class="notif-content">
        <div class="notif-text">${escapeHtml(n.text)}</div>
        <div class="notif-time">${escapeHtml(n.time)}</div>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   PUBLIC SHARE MODAL & LINK COPYING
   ========================================================================== */
function initShareModal() {
  const modal = document.getElementById('share-modal');
  const openBtns = document.querySelectorAll('.btn-open-share');
  const closeBtns = document.querySelectorAll('.btn-close-share');
  const copyBtn = document.getElementById('copy-live-link-btn');
  const shareInput = document.getElementById('share-url-input');

  if (shareInput) {
    shareInput.value = window.location.origin;
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) modal.classList.add('show');
      if (shareInput) shareInput.value = window.location.origin;
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) modal.classList.remove('show');
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  }

  if (copyBtn && shareInput) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(shareInput.value).then(() => {
        showToast('Live link copied to clipboard! Share it with anyone.', 'success');
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Link';
        }, 2000);
      }).catch(() => {
        shareInput.select();
        document.execCommand('copy');
        showToast('Link copied!', 'success');
      });
    });
  }
}

/* ==========================================================================
   TOAST ALERTS
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'circle-check';
  if (type === 'error') icon = 'circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid fa-${icon}" style="font-size: 1.1rem; color: var(--${type === 'error' ? 'danger' : type});"></i>
    <span style="font-size: 0.88rem; flex: 1;">${escapeHtml(message)}</span>
    <button style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusClass(status) {
  switch (status) {
    case 'Excellent': return 'status-excellent';
    case 'Good': return 'status-good';
    case 'Average': return 'status-average';
    default: return 'status-needs-improvement';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Excellent': return '#10b981';
    case 'Good': return '#3b82f6';
    case 'Average': return '#f59e0b';
    default: return '#ef4444';
  }
}
