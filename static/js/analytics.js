/**
 * analytics.js - Deep Dive Analytics Page Visualizations
 */

let charts = {};

document.addEventListener('DOMContentLoaded', () => {
  loadAnalyticsPage();
  window.addEventListener('themeChanged', () => loadAnalyticsPage());
});

async function loadAnalyticsPage() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Analytics failed to load');
    const data = await res.json();

    updateAnalyticsKPIs(data.summary);
    renderAllCharts(data);
  } catch (err) {
    console.error('Analytics page error:', err);
    showToast('Failed to load full analytics data', 'error');
  }
}

function updateAnalyticsKPIs(summary) {
  if (!summary) return;
  document.getElementById('an-total-students').textContent = summary.total_students;
  document.getElementById('an-avg-marks').textContent = summary.average_marks + '%';
  document.getElementById('an-pass-rate').textContent = summary.pass_percentage + '%';
  document.getElementById('an-highest-marks').textContent = summary.highest_marks + '%';
  document.getElementById('an-lowest-marks').textContent = summary.lowest_marks + '%';
  document.getElementById('an-courses-count').textContent = summary.total_courses;
}

function getThemeConfig() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#0f172a',
    tooltipText: '#ffffff'
  };
}

function renderAllCharts(data) {
  const t = getThemeConfig();

  // Destroy existing charts to prevent canvas re-use errors
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};

  // 1. Performance Trend
  const ctxTrend = document.getElementById('anTrendChart')?.getContext('2d');
  if (ctxTrend && data.trend) {
    const gradient = ctxTrend.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    charts.trend = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: data.trend.labels,
        datasets: [{
          label: 'Average Score (%)',
          data: data.trend.avg,
          borderColor: '#4f46e5',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: t.tooltipBg }
        },
        scales: {
          x: { ticks: { color: t.textColor }, grid: { color: t.gridColor } },
          y: { min: 0, max: 100, ticks: { color: t.textColor }, grid: { color: t.gridColor } }
        }
      }
    });
  }

  // 2. Course Distribution
  const ctxCourse = document.getElementById('anCourseChart')?.getContext('2d');
  if (ctxCourse && data.course_counts) {
    charts.course = new Chart(ctxCourse, {
      type: 'doughnut',
      data: {
        labels: data.course_counts.labels,
        datasets: [{
          data: data.course_counts.values,
          backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111827' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: t.textColor, padding: 12, boxWidth: 10 } },
          tooltip: { backgroundColor: t.tooltipBg }
        }
      }
    });
  }

  // 3. Course Average Marks
  const ctxAvg = document.getElementById('anCourseAvgChart')?.getContext('2d');
  if (ctxAvg && data.avg_by_course) {
    charts.avg = new Chart(ctxAvg, {
      type: 'bar',
      data: {
        labels: data.avg_by_course.labels,
        datasets: [{
          label: 'Course Average (%)',
          data: data.avg_by_course.values,
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: t.tooltipBg } },
        scales: {
          x: { ticks: { color: t.textColor }, grid: { display: false } },
          y: { min: 0, max: 100, ticks: { color: t.textColor }, grid: { color: t.gridColor } }
        }
      }
    });
  }

  // 4. Marks Distribution
  const ctxMarks = document.getElementById('anMarksDistChart')?.getContext('2d');
  if (ctxMarks && data.distribution) {
    charts.marks = new Chart(ctxMarks, {
      type: 'bar',
      data: {
        labels: data.distribution.labels,
        datasets: [{
          label: 'Students',
          data: data.distribution.values,
          backgroundColor: ['#10b981', '#3b82f6', '#06b6d4', '#f59e0b', '#ef4444'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: t.tooltipBg } },
        scales: {
          x: { ticks: { color: t.textColor }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: t.textColor, stepSize: 1 }, grid: { color: t.gridColor } }
        }
      }
    });
  }

  // 5. Gender Ratio
  const ctxGender = document.getElementById('anGenderChart')?.getContext('2d');
  if (ctxGender && data.gender) {
    charts.gender = new Chart(ctxGender, {
      type: 'pie',
      data: {
        labels: data.gender.labels,
        datasets: [{
          data: data.gender.values,
          backgroundColor: ['#3b82f6', '#ec4899', '#a855f7'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111827' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: t.textColor, padding: 12, boxWidth: 10 } },
          tooltip: { backgroundColor: t.tooltipBg }
        }
      }
    });
  }

  // 6. Year-wise Enrollment
  const ctxYear = document.getElementById('anYearChart')?.getContext('2d');
  if (ctxYear && data.year) {
    charts.year = new Chart(ctxYear, {
      type: 'bar',
      data: {
        labels: data.year.labels,
        datasets: [{
          label: 'Enrollment',
          data: data.year.values,
          backgroundColor: '#06b6d4',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: t.tooltipBg } },
        scales: {
          x: { ticks: { color: t.textColor }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: t.textColor, stepSize: 1 }, grid: { color: t.gridColor } }
        }
      }
    });
  }
}
