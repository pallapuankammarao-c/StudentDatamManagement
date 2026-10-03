/**
 * dashboard.js - Live Analytics Dashboard & Interactive Visualizations
 */

let trendChart = null;
let courseDoughnutChart = null;
let marksDistChart = null;
let courseAvgChart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  const refreshBtn = document.getElementById('refresh-dashboard-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.querySelector('i').classList.add('fa-spin');
      loadDashboardData().finally(() => {
        setTimeout(() => refreshBtn.querySelector('i').classList.remove('fa-spin'), 600);
      });
    });
  }

  window.addEventListener('themeChanged', () => {
    // Re-render charts with updated theme colors
    loadDashboardData();
  });
});

async function loadDashboardData() {
  try {
    const [analyticsRes, studentsRes] = await Promise.all([
      fetch('/api/analytics'),
      fetch('/api/students?per_page=6&sort=created_at&order=desc')
    ]);

    if (!analyticsRes.ok) throw new Error('Failed to load analytics');

    const analytics = await analyticsRes.json();
    const students = await studentsRes.json();

    updateMetrics(analytics.summary);
    renderCharts(analytics);
    renderLeaderboard(analytics.top_students || []);
    renderRecentStudents(students.items || []);

    const updatedEl = document.getElementById('last-updated-text');
    if (updatedEl) {
      updatedEl.textContent = 'Updated just now: ' + new Date().toLocaleTimeString();
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to refresh dashboard data', 'error');
  }
}

/* ==========================================================================
   METRIC COUNTERS ANIMATION
   ========================================================================== */
function updateMetrics(summary) {
  if (!summary) return;

  animateCounter('stat-total-students', summary.total_students, '');
  animateCounter('stat-avg-marks', summary.average_marks, '%');
  animateCounter('stat-pass-rate', summary.pass_percentage, '%');
  animateCounter('stat-highest-marks', summary.highest_marks, '%');
  animateCounter('stat-total-courses', summary.total_courses, '');
}

function animateCounter(id, target, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;

  const start = parseFloat(el.getAttribute('data-value') || 0);
  el.setAttribute('data-value', target);
  const duration = 800;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * ease;
    el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

/* ==========================================================================
   CHART.JS VISUALIZATIONS
   ========================================================================== */
function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#0f172a',
    tooltipText: '#ffffff'
  };
}

function renderCharts(data) {
  const theme = getChartThemeColors();

  // 1. Performance Trend Chart
  const trendCtx = document.getElementById('trendChart')?.getContext('2d');
  if (trendCtx && data.trend && data.trend.labels) {
    if (trendChart) trendChart.destroy();

    const gradient = trendCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: data.trend.labels,
        datasets: [{
          label: 'Average Marks (%)',
          data: data.trend.avg,
          borderColor: '#6366f1',
          borderWidth: 3,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          backgroundColor: gradient,
          tension: 0.38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }

  // 2. Course Distribution Doughnut
  const courseCtx = document.getElementById('courseDoughnutChart')?.getContext('2d');
  if (courseCtx && data.course_counts) {
    if (courseDoughnutChart) courseDoughnutChart.destroy();

    const palette = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

    courseDoughnutChart = new Chart(courseCtx, {
      type: 'doughnut',
      data: {
        labels: data.course_counts.labels,
        datasets: [{
          data: data.course_counts.values,
          backgroundColor: palette.slice(0, data.course_counts.labels.length),
          borderWidth: 3,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111827' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              boxWidth: 12,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 12,
            cornerRadius: 8
          }
        }
      }
    });
  }

  // 3. Marks Distribution Bar Chart
  const marksCtx = document.getElementById('marksDistChart')?.getContext('2d');
  if (marksCtx && data.distribution) {
    if (marksDistChart) marksDistChart.destroy();

    marksDistChart = new Chart(marksCtx, {
      type: 'bar',
      data: {
        labels: data.distribution.labels.map(l => l.split(' ')[0]),
        datasets: [{
          label: 'Students Count',
          data: data.distribution.values,
          backgroundColor: [
            '#10b981', // Excellent
            '#3b82f6', // Very Good
            '#06b6d4', // Good
            '#f59e0b', // Average
            '#ef4444'  // Needs Improvement
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } },
            grid: { color: theme.gridColor }
          }
        }
      }
    });
  }

  // 4. Course Average Marks Bar Chart
  const avgCtx = document.getElementById('courseAvgChart')?.getContext('2d');
  if (avgCtx && data.avg_by_course) {
    if (courseAvgChart) courseAvgChart.destroy();

    courseAvgChart = new Chart(avgCtx, {
      type: 'bar',
      data: {
        labels: data.avg_by_course.labels,
        datasets: [{
          label: 'Average Score (%)',
          data: data.avg_by_course.values,
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }
}

/* ==========================================================================
   LEADERBOARD & RECENT STUDENTS
   ========================================================================== */
function renderLeaderboard(topStudents) {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  if (topStudents.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No students recorded yet.</div>`;
    return;
  }

  container.innerHTML = topStudents.map((s, idx) => {
    let rankClass = 'rank-other';
    let rankIcon = idx + 1;
    if (idx === 0) {
      rankClass = 'rank-1';
      rankIcon = '<i class="fa-solid fa-crown" style="color: #ca8a04;"></i>';
    } else if (idx === 1) {
      rankClass = 'rank-2';
      rankIcon = '<i class="fa-solid fa-medal" style="color: #64748b;"></i>';
    } else if (idx === 2) {
      rankClass = 'rank-3';
      rankIcon = '<i class="fa-solid fa-award" style="color: #b45309;"></i>';
    }

    return `
      <div class="leader-item">
        <div class="rank-badge ${rankClass}">
          ${rankIcon}
        </div>
        <div class="student-avatar" style="width: 36px; height: 36px;">
          ${s.name.charAt(0)}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            <a href="/students/${encodeURIComponent(s.id)}" style="color: inherit;">${escapeHtml(s.name)}</a>
          </div>
          <div style="font-size: 0.73rem; color: var(--text-muted);">
            ${escapeHtml(s.id)} · ${escapeHtml(s.course)} (Yr ${s.year})
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--primary);">
            ${s.marks}%
          </div>
          <span class="badge-status ${getStatusClass(s.status)}" style="font-size: 0.68rem; padding: 0.1rem 0.45rem;">
            ${s.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentStudents(students) {
  const tbody = document.getElementById('recent-students-tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No students found</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td>
        <div class="student-cell">
          <div class="student-avatar">${s.name.charAt(0)}</div>
          <div>
            <div class="student-name">
              <a href="/students/${encodeURIComponent(s.id)}">${escapeHtml(s.name)}</a>
            </div>
            <div class="student-id">${escapeHtml(s.id)}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="badge-tag">${escapeHtml(s.course)}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.25rem;">Yr ${s.year}</span>
      </td>
      <td>
        <div class="score-cell">
          <span style="font-weight: 700; min-width: 42px;">${s.marks}%</span>
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
      <td style="text-align: right;">
        <a href="/students/${encodeURIComponent(s.id)}" class="btn btn-secondary btn-sm" title="View Profile">
          <i class="fa-solid fa-eye"></i> View
        </a>
      </td>
    </tr>
  `).join('');
}
