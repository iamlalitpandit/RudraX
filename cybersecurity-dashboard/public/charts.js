/* ═══════════════════════════════════════════════════════════════════════════
   RudraX Army — Chart Initialization & Updates
   ═══════════════════════════════════════════════════════════════════════════ */

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size = 10;

// ─── Traffic Chart (Stacked Area) ────────────────────────────────────────────
let trafficChart;

function initTrafficChart() {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Inbound',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Outbound',
          data: [],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 8, padding: 8, font: { size: 9 } },
        },
        tooltip: {
          backgroundColor: '#1a1f2e',
          borderColor: '#2a3142',
          borderWidth: 1,
          titleFont: { size: 10 },
          bodyFont: { size: 9 },
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)} Mbps`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(42, 49, 66, 0.3)', drawBorder: false },
          ticks: { font: { size: 8 }, maxTicksLimit: 10 },
        },
        y: {
          grid: { color: 'rgba(42, 49, 66, 0.3)', drawBorder: false },
          ticks: {
            font: { size: 8 },
            callback: (val) => formatNumber(val) + ' Mbps',
          },
          beginAtZero: true,
        },
      },
    },
  });
}

function updateTrafficChart(history) {
  if (!trafficChart) return;
  const labels = history.map((t) => {
    const d = new Date(t.timestamp);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  trafficChart.data.labels = labels;
  trafficChart.data.datasets[0].data = history.map((t) => t.inbound);
  trafficChart.data.datasets[1].data = history.map((t) => t.outbound);
  trafficChart.update('none');
}

// ─── Auth Chart (Doughnut) ──────────────────────────────────────────────────
let authChart;

function initAuthChart() {
  const ctx = document.getElementById('authChart').getContext('2d');
  authChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Successful', 'Failed'],
      datasets: [
        {
          data: [85, 15],
          backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
          borderColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 8, padding: 6, font: { size: 9 } },
        },
        tooltip: {
          backgroundColor: '#1a1f2e',
          borderColor: '#2a3142',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

function updateAuthChart(attempts) {
  if (!authChart || !attempts.length) return;
  const total = attempts.length;
  const failed = attempts.filter((a) => !a.success).length;
  const success = total - failed;
  const successPct = total > 0 ? Math.round((success / total) * 100) : 0;
  const failPct = total > 0 ? Math.round((failed / total) * 100) : 0;
  authChart.data.datasets[0].data = [successPct, failPct];
  authChart.update('none');
}

// ─── Gauge Drawing ───────────────────────────────────────────────────────────
function drawGauge(canvasId, value, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 4;
  const radius = Math.min(w, h) / 2 - 12;

  ctx.clearRect(0, 0, w, h);

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = 'rgba(42, 49, 66, 0.5)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Value arc
  const pct = Math.min(value / 100, 1);
  const endAngle = Math.PI * 0.75 + pct * Math.PI * 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.75, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center text
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(value) + '%', cx, cy - 4);

  ctx.fillStyle = '#64748b';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText(label, cx, cy + 16);
}

function updateAllGauges(cpu, memory, disk, network) {
  const cpuColor = cpu > 80 ? '#ef4444' : cpu > 60 ? '#f97316' : '#22c55e';
  const memColor = memory > 80 ? '#ef4444' : memory > 60 ? '#f97316' : '#22c55e';
  const diskColor = disk > 85 ? '#ef4444' : disk > 70 ? '#f97316' : '#22c55e';
  const netPct = Math.min((network / 4000) * 100, 100);
  const netColor = netPct > 80 ? '#ef4444' : netPct > 60 ? '#f97316' : '#06b6d4';

  drawGauge('gaugeCpu', cpu, 'CPU', cpuColor);
  drawGauge('gaugeMemory', memory, 'RAM', memColor);
  drawGauge('gaugeDisk', disk, 'DISK', diskColor);
  drawGauge('gaugeNetwork', netPct, 'NET', netColor);
}

// ─── Init all charts ─────────────────────────────────────────────────────────
function initAllCharts() {
  initTrafficChart();
  initAuthChart();
}
