/* ═══════════════════════════════════════════════════════════════════════════
   RudraX Army — Utility Functions
   ═══════════════════════════════════════════════════════════════════════════ */

function getSeverityColor(severity) {
  const map = {
    critical: '#ff0040',
    high: '#ff6b00',
    medium: '#ffaa00',
    low: '#22c55e',
    info: '#3b82f6',
    warning: '#eab308',
  };
  return map[severity] || '#64748b';
}

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTimestampShort(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatThroughput(bps) {
  if (bps >= 1000) return (bps / 1000).toFixed(1) + ' Gbps';
  return bps + ' Mbps';
}

function getTrendIcon(current, previous) {
  if (previous === undefined || previous === null) return '−';
  if (current > previous) return '↑';
  if (current < previous) return '↓';
  return '→';
}

function getTrendClass(current, previous, inverse = false) {
  if (previous === undefined || previous === null) return '';
  if (inverse) {
    if (current < previous) return 'trend-good';
    if (current > previous) return 'trend-bad';
  } else {
    if (current > previous) return 'trend-good';
    if (current < previous) return 'trend-bad';
  }
  return '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
