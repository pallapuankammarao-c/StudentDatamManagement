/**
 * students.js - Student Directory & Records Management (Search, Filters, Sort, Edit, Delete)
 */

let currentPage = 1;
let currentSort = 'created_at';
let currentOrder = 'desc';
let currentView = 'table'; // 'table' or 'grid'

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initModals();
  loadStudents();
});

function initFilters() {
  const searchInput = document.getElementById('filter-search');
  const courseSelect = document.getElementById('filter-course');
  const yearSelect = document.getElementById('filter-year');
  const statusSelect = document.getElementById('filter-status');
  const sortSelect = document.getElementById('filter-sort');
  const perPageSelect = document.getElementById('filter-per-page');
  const minMarksInput = document.getElementById('filter-min-marks');
  const maxMarksInput = document.getElementById('filter-max-marks');
  const resetBtn = document.getElementById('btn-reset-filters');
  const viewToggleBtns = document.querySelectorAll('.btn-view-toggle');

  let debounceTimer = null;
  const triggerReload = () => {
    currentPage = 1;
    loadStudents();
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(triggerReload, 300);
    });
  }

  [courseSelect, yearSelect, statusSelect, sortSelect, perPageSelect].forEach(el => {
    if (el) el.addEventListener('change', triggerReload);
  });

  [minMarksInput, maxMarksInput].forEach(el => {
    if (el) {
      el.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(triggerReload, 400);
      });
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (courseSelect) courseSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (minMarksInput) minMarksInput.value = '';
      if (maxMarksInput) maxMarksInput.value = '';
      if (sortSelect) sortSelect.value = 'created_at-desc';
      triggerReload();
    });
  }

  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      const tableView = document.getElementById('students-table-view');
      const gridView = document.getElementById('students-grid-view');
      if (currentView === 'grid') {
        if (tableView) tableView.style.display = 'none';
        if (gridView) gridView.style.display = 'grid';
      } else {
        if (tableView) tableView.style.display = 'block';
        if (gridView) gridView.style.display = 'none';
      }
    });
  });
}

async function loadStudents(page = currentPage) {
  currentPage = page;
  const params = new URLSearchParams();

  const q = document.getElementById('filter-search')?.value.trim();
  const course = document.getElementById('filter-course')?.value;
  const year = document.getElementById('filter-year')?.value;
  const status = document.getElementById('filter-status')?.value;
  const minMarks = document.getElementById('filter-min-marks')?.value;
  const maxMarks = document.getElementById('filter-max-marks')?.value;
  const sortVal = document.getElementById('filter-sort')?.value || 'created_at-desc';
  const perPage = document.getElementById('filter-per-page')?.value || 10;

  const [sort, order] = sortVal.split('-');
  currentSort = sort;
  currentOrder = order;

  if (q) params.set('q', q);
  if (course) params.set('course', course);
  if (year) params.set('year', year);
  if (status) params.set('status', status);
  if (minMarks) params.set('min', minMarks);
  if (maxMarks) params.set('max', maxMarks);
  params.set('sort', currentSort);
  params.set('order', currentOrder);
  params.set('page', currentPage);
  params.set('per_page', perPage);

  try {
    const res = await fetch(`/api/students?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    renderStudentList(data);
    renderPagination(data);
  } catch (err) {
    console.error('Students fetch error:', err);
    showToast('Failed to load students', 'error');
  }
}

function renderStudentList(data) {
  const tbody = document.getElementById('students-tbody');
  const grid = document.getElementById('students-grid-view');
  const countEl = document.getElementById('students-total-count');

  if (countEl) countEl.textContent = `${data.total} Students`;

  if (data.items.length === 0) {
    const emptyHtml = `
      <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted);">
        <i class="fa-solid fa-user-slash" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h4>No students match your criteria</h4>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">Try resetting your filters or search query.</p>
      </div>
    `;
    if (tbody) tbody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
    if (grid) grid.innerHTML = emptyHtml;
    return;
  }

  // Render Table rows
  if (tbody) {
    tbody.innerHTML = data.items.map(s => `
      <tr>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div>
              <div class="student-name">
                <a href="/students/${encodeURIComponent(s.id)}" style="color: inherit;">${escapeHtml(s.name)}</a>
              </div>
              <div class="student-id">${escapeHtml(s.id)}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--text-primary);">${escapeHtml(s.email)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(s.phone)}</div>
        </td>
        <td>
          <span class="badge-tag">${escapeHtml(s.course)}</span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Yr ${s.year} · ${escapeHtml(s.gender)}</div>
        </td>
        <td>
          <div class="score-cell">
            <span style="font-weight: 700; min-width: 44px;">${s.marks}%</span>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${s.marks}%; background: ${getStatusColor(s.status)};"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-status ${getStatusClass(s.status)}">
            <i class="fa-solid fa-circle" style="font-size: 0.45rem;"></i>
            ${s.status}
          </span>
        </td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
          ${s.created_at ? s.created_at.split(' ')[0] : '—'}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 0.35rem;">
            <a href="/students/${encodeURIComponent(s.id)}" class="btn btn-secondary btn-sm" title="View Profile">
              <i class="fa-solid fa-eye"></i>
            </a>
            <button class="btn btn-secondary btn-sm btn-edit-student" data-id="${escapeHtml(s.id)}" title="Edit">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-secondary btn-sm btn-delete-student" data-id="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" title="Delete" style="color: var(--danger);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Render Grid cards
  if (grid) {
    grid.innerHTML = data.items.map(s => `
      <div class="card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem;">
            <div class="student-avatar" style="width: 46px; height: 46px; font-size: 1.1rem;">
              ${s.name.charAt(0)}
            </div>
            <span class="badge-status ${getStatusClass(s.status)}">
              ${s.status}
            </span>
          </div>
          <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">
            <a href="/students/${encodeURIComponent(s.id)}" style="color: inherit;">${escapeHtml(s.name)}</a>
          </h3>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 0.75rem;">
            ${escapeHtml(s.id)} · ${escapeHtml(s.course)} (Year ${s.year})
          </div>
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.35rem;">
              <span style="color: var(--text-muted);">Score</span>
              <span style="font-weight: 700;">${s.marks}%</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${s.marks}%; background: ${getStatusColor(s.status)};"></div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
            <div><i class="fa-solid fa-envelope" style="width: 16px; color: var(--text-muted);"></i> ${escapeHtml(s.email)}</div>
            <div><i class="fa-solid fa-phone" style="width: 16px; color: var(--text-muted);"></i> ${escapeHtml(s.phone)}</div>
            <div><i class="fa-solid fa-location-dot" style="width: 16px; color: var(--text-muted);"></i> ${escapeHtml(s.address || '—')}</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1.25rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          <a href="/students/${encodeURIComponent(s.id)}" class="btn btn-secondary btn-sm" style="flex: 1;">
            Profile
          </a>
          <button class="btn btn-secondary btn-sm btn-edit-student" data-id="${escapeHtml(s.id)}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-student" data-id="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" style="color: var(--danger);">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  attachRowListeners();
}

function renderPagination(data) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  const { page, pages, total } = data;
  if (pages <= 1) {
    container.innerHTML = `<span style="font-size: 0.82rem; color: var(--text-muted);">Showing all ${total} records</span>`;
    return;
  }

  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 1rem;">
      <span style="font-size: 0.82rem; color: var(--text-muted);">
        Page ${page} of ${pages} (${total} total records)
      </span>
      <div style="display: flex; gap: 0.35rem;">
        <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="loadStudents(${page - 1})">
          <i class="fa-solid fa-chevron-left"></i> Prev
        </button>
  `;

  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || (p >= page - 1 && p <= page + 1)) {
      html += `
        <button class="btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}" onclick="loadStudents(${p})">
          ${p}
        </button>
      `;
    } else if (p === page - 2 || p === page + 2) {
      html += `<span style="padding: 0.35rem 0.5rem; color: var(--text-muted);">...</span>`;
    }
  }

  html += `
        <button class="btn btn-secondary btn-sm" ${page >= pages ? 'disabled' : ''} onclick="loadStudents(${page + 1})">
          Next <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/* ==========================================================================
   EDIT & DELETE MODALS
   ========================================================================== */
function initModals() {
  const deleteModal = document.getElementById('delete-confirm-modal');
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
  const editModal = document.getElementById('edit-student-modal');
  const editForm = document.getElementById('edit-student-form');

  // Cancel buttons
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      if (deleteModal) deleteModal.classList.remove('show');
      if (editModal) editModal.classList.remove('show');
    });
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      const sid = confirmDeleteBtn.getAttribute('data-id');
      if (!sid) return;

      try {
        const res = await fetch(`/api/students/${encodeURIComponent(sid)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete student');
        showToast('Student deleted successfully', 'success');
        if (deleteModal) deleteModal.classList.remove('show');
        loadStudents();
      } catch (err) {
        showToast('Could not delete student', 'error');
      }
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sid = document.getElementById('edit-student-id').value;
      const payload = {
        name: document.getElementById('edit-name').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        age: parseInt(document.getElementById('edit-age').value),
        gender: document.getElementById('edit-gender').value,
        course: document.getElementById('edit-course').value,
        department: document.getElementById('edit-department').value.trim(),
        year: parseInt(document.getElementById('edit-year').value),
        marks: parseFloat(document.getElementById('edit-marks').value),
        address: document.getElementById('edit-address').value.trim(),
      };

      try {
        const res = await fetch(`/api/students/${encodeURIComponent(sid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update student');
        }

        showToast('Student details updated!', 'success');
        if (editModal) editModal.classList.remove('show');
        loadStudents();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function attachRowListeners() {
  document.querySelectorAll('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.id;
      const name = btn.dataset.name;
      const deleteModal = document.getElementById('delete-confirm-modal');
      const deleteNameEl = document.getElementById('delete-student-name');
      const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

      if (deleteNameEl) deleteNameEl.textContent = `${name} (${sid})`;
      if (confirmDeleteBtn) confirmDeleteBtn.setAttribute('data-id', sid);
      if (deleteModal) deleteModal.classList.add('show');
    });
  });

  document.querySelectorAll('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sid = btn.dataset.id;
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(sid)}`);
        if (!res.ok) throw new Error('Student not found');
        const s = await res.json();

        document.getElementById('edit-student-id').value = s.id;
        document.getElementById('edit-student-id-display').textContent = s.id;
        document.getElementById('edit-name').value = s.name;
        document.getElementById('edit-email').value = s.email;
        document.getElementById('edit-phone').value = s.phone;
        document.getElementById('edit-age').value = s.age;
        document.getElementById('edit-gender').value = s.gender;
        document.getElementById('edit-course').value = s.course;
        document.getElementById('edit-department').value = s.department;
        document.getElementById('edit-year').value = s.year;
        document.getElementById('edit-marks').value = s.marks;
        document.getElementById('edit-address').value = s.address || '';

        const editModal = document.getElementById('edit-student-modal');
        if (editModal) editModal.classList.add('show');
      } catch (err) {
        showToast('Could not load student information', 'error');
      }
    });
  });
}
