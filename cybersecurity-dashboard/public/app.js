/* ═══════════════════════════════════════════════════════════════════════════
   RudraX Army — Cybersecurity Ops Center
   WebSocket Client & DOM Controller
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────
  let lastMetrics = null;

  // ─── Agent Names for Squads ────────────────────────────────────────────────
  const AGENT_NAMES = {
    threat: ['Athena', 'Ares', 'Hades', 'Zeus', 'Poseidon', 'Apollo', 'Artemis', 'RudraX', 'Hephaestus', 'Dionysus'],
    network: ['Odin', 'Thor', 'Loki', 'Freya', 'Heimdall', 'Balder', 'Tyr', 'Frigg', 'Njord', 'Idun'],
    auth: ['Merlin', 'Morgana', 'Galahad', 'Lancelot', 'Percival', 'Gawain', 'Tristan', 'Bedivere', 'Guinevere', 'Arthur'],
    intel: ['Moriarty', 'Sherlock', 'Watson', 'Mycroft', 'Irene', 'Lestrade', 'Hudson', 'Gregson', 'Holmes', 'Adler'],
    response: ['Rambo', 'Dutch', 'John', 'Sarah', 'Kyle', 'Ellen', 'Rick', 'Daryl', 'Michonne', 'Glenn'],
  };

  const AGENT_STATUSES = ['active', 'busy', 'standby'];
  const squadAgentState = {};

  // Initialize agent states
  Object.keys(AGENT_NAMES).forEach((squad) => {
    squadAgentState[squad] = AGENT_NAMES[squad].map((name, i) => ({
      name,
      status: i < 4 ? 'active' : i < 7 ? 'busy' : 'standby',
    }));
  });

  // ─── DOM Refs ──────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  // ─── WebSocket Connection ──────────────────────────────────────────────────
  function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    const connStatus = $('connStatus');
    let reconnectTimer = null;

    function connect() {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        connStatus.textContent = '📡 CONNECTED';
        connStatus.className = 'status-pill connected';
        connStatus.style.borderColor = '#22c55e';
        connStatus.style.color = '#22c55e';
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onSnapshot(data);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        connStatus.textContent = '📡 RECONNECTING...';
        connStatus.className = 'status-pill';
        connStatus.style.borderColor = '#f97316';
        connStatus.style.color = '#f97316';
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();
  }

  // ─── Snapshot Handler ──────────────────────────────────────────────────────
  function onSnapshot(data) {
    updateMetrics(data.metrics, data);
    updateSquads(data);
    updateCommandChain(data);
    updateThreats(data.threats);
    updateAlerts(data.alerts);
    updateEvents(data.events);
    updateCharts(data);
    updateSystemHealth(data.metrics);
  }

  // ─── Update Metrics ────────────────────────────────────────────────────────
  function updateMetrics(metrics, data) {
    $('metricThreats').textContent = metrics.totalThreats;
    $('metricBlocked').textContent = metrics.blockedIPs;
    $('metricConnections').textContent = formatNumber(metrics.activeConnections);
    $('metricResponseTime').innerHTML = metrics.avgResponseTime + '<span class="unit">ms</span>';
    $('metricPackets').textContent = formatNumber(metrics.packetsInspected);
    $('metricCpu').innerHTML = metrics.cpuUsage + '<span class="unit">%</span>';
    $('uptimeDisplay').textContent = formatUptime(metrics.uptime);
    $('clientCount').textContent = data.alerts ? Math.floor(Math.random() * 5) + 1 : 0;

    // Threat level pill
    const pill = $('threatLevelPill');
    const level = metrics.threatLevel || 'low';
    const labels = { critical: '🔴 CRITICAL', high: '🟠 HIGH', medium: '🟡 MEDIUM', low: '🟢 LOW' };
    pill.textContent = labels[level] || labels.low;
    pill.className = 'status-pill ' + level;

    // Trends (compare with last snapshot)
    if (lastMetrics) {
      const trendMap = {
        trendThreats: { key: 'totalThreats', inverse: true },
        trendBlocked: { key: 'blockedIPs' },
        trendConnections: { key: 'activeConnections', inverse: true },
        trendResponse: { key: 'avgResponseTime', inverse: true },
        trendPackets: { key: 'packetsInspected' },
        trendCpu: { key: 'cpuUsage', inverse: true },
      };

      Object.entries(trendMap).forEach(([elId, cfg]) => {
        const el = $(elId);
        if (!el) return;
        const cur = metrics[cfg.key];
        const prev = lastMetrics[cfg.key];
        const icon = getTrendIcon(cur, prev);
        const cls = getTrendClass(cur, prev, cfg.inverse);
        el.textContent = icon;
        el.className = 'metric-trend ' + cls;
      });
    }

    lastMetrics = { ...metrics };
  }

  // ─── Update Squads ─────────────────────────────────────────────────────────
  function updateSquads(data) {
    const threatCount = data.threats.filter((t) => t.status === 'active').length;
    const mitigatedCount = data.threats.filter((t) => t.status === 'mitigated').length;

    // Assign squad agent statuses based on threat levels
    const criticalCount = data.threats.filter((t) => t.severity === 'critical').length;
    const highCount = data.threats.filter((t) => t.severity === 'high').length;

    // Update squad agents based on operational load
    updateSquad('threat', threatCount, criticalCount > 2 ? 7 : criticalCount > 0 ? 4 : 2);
    updateSquad('network', data.trafficHistory.length, data.metrics.networkThroughput > 2000 ? 6 : 3);
    updateSquad('auth', data.authAttempts.length, data.authAttempts.filter((a) => !a.success).length > 5 ? 5 : 2);
    updateSquad('intel', data.events.length, highCount > 3 ? 6 : 3);
    updateSquad('response', threatCount, criticalCount > 0 ? 8 : threatCount > 3 ? 5 : 2);

    // Squad counts
    $('squadThreatCount').textContent = threatCount;
    $('squadNetworkCount').textContent = data.metrics.activeConnections ? formatNumber(data.metrics.activeConnections) : '0';
    $('squadAuthCount').textContent = data.authAttempts.length;
    $('squadIntelCount').textContent = data.events.length;
    $('squadResponseCount').textContent = mitigatedCount;

    // Deputy squad/active count
    const totalAgents = Object.values(squadAgentState).reduce((sum, agents) => sum + agents.length, 0);
    const activeAgents = Object.values(squadAgentState).reduce(
      (sum, agents) => sum + agents.filter((a) => a.status === 'active').length,
      0
    );
    $('deputySquads').textContent = `🚀 ${Object.keys(squadAgentState).length} squads`;
    $('deputyActive').textContent = `⚡ ${activeAgents} active`;
    $('chiefThreats').textContent = `⚠️ ${data.threats.length} threats`;
    $('chiefAlerts').textContent = `🔔 ${data.alerts.length} alerts`;
  }

  function updateSquad(squadKey, load, activeCount) {
    const agents = squadAgentState[squadKey];
    if (!agents) return;
    const container = $(`squad${squadKey.charAt(0).toUpperCase() + squadKey.slice(1)}Agents`);
    if (!container) return;

    // Update agent statuses based on load
    agents.forEach((agent, i) => {
      if (i < activeCount) agent.status = 'active';
      else if (i < activeCount + Math.floor(agents.length / 3)) agent.status = 'busy';
      else agent.status = 'standby';
    });

    // Pulse animation for agents that just became active
    container.innerHTML = agents
      .map(
        (a) =>
          `<span class="agent-dot ${a.status}" title="${a.name} (${a.status})">${a.name.charAt(0)}</span>`
      )
      .join('');
  }

  // ─── Update Command Chain ───────────────────────────────────────────────────
  function updateCommandChain(data) {
    const badge = $('healthBadge');
    const threats = data.threats.filter((t) => t.status === 'active').length;
    if (threats > 5) {
      badge.textContent = '⚠️ COMPROMISED';
      badge.style.borderColor = '#ef4444';
      badge.style.color = '#ef4444';
    } else if (threats > 0) {
      badge.textContent = '🟡 DEGRADED';
      badge.style.borderColor = '#eab308';
      badge.style.color = '#eab308';
    } else {
      badge.textContent = '🟢 OPERATIONAL';
      badge.style.borderColor = '#22c55e';
      badge.style.color = '#22c55e';
    }

    // Update threat count badge
    $('threatCountBadge').textContent = threats;
    $('alertCountBadge').textContent = data.alerts.length;
    $('eventCountBadge').textContent = data.events.length;
  }

  // ─── Update Threats ────────────────────────────────────────────────────────
  function updateThreats(threats) {
    const container = $('threatsList');
    const active = threats.filter((t) => t.status === 'active');
    const mitigated = threats.filter((t) => t.status === 'mitigated');
    const all = [...active, ...mitigated].slice(0, 20);

    if (!all.length) {
      container.innerHTML = '<div class="threat-empty">✅ No active threats. All clear.</div>';
      return;
    }

    container.innerHTML = all
      .map(
        (t) => `
        <div class="threat-item">
          <span class="threat-severity">${t.icon || '⚠️'}</span>
          <span class="threat-severity-dot ${t.severity}"></span>
          <span class="threat-type" style="color: ${t.color || getSeverityColor(t.severity)}">${escapeHtml(t.type)}</span>
          <span class="threat-source">${escapeHtml(t.sourceIP)}</span>
          <span class="threat-target">→ ${escapeHtml(t.target)}</span>
          <span class="threat-confidence">${t.confidence}%</span>
          <span class="threat-status ${t.status}">${t.status}</span>
        </div>`
      )
      .join('');
  }

  // ─── Update Alerts ─────────────────────────────────────────────────────────
  function updateAlerts(alerts) {
    const container = $('alertsList');
    if (!alerts.length) {
      container.innerHTML = '<div class="alert-empty">No recent alerts.</div>';
      return;
    }

    container.innerHTML = alerts
      .map(
        (a) => `
        <div class="alert-item ${a.acknowledged ? 'acknowledged' : ''}">
          <span class="alert-severity ${a.severity}"></span>
          <span class="alert-msg">${escapeHtml(a.message)}</span>
          <span class="alert-time">${formatTimestamp(a.timestamp)}</span>
          ${a.acknowledged ? '<span class="alert-ack">✓ Ack</span>' : ''}
        </div>`
      )
      .join('');

    // Scroll to top for new alerts
    container.scrollTop = 0;
  }

  // ─── Update Events ─────────────────────────────────────────────────────────
  function updateEvents(events) {
    const container = $('eventsList');
    if (!events.length) {
      container.innerHTML = '<div class="event-empty">No events yet.</div>';
      return;
    }

    container.innerHTML = events
      .map(
        (e) => `
        <div class="event-item">
          <span class="event-severity-dot ${e.severity}"></span>
          <span class="event-action">${escapeHtml(e.action)}</span>
          <span class="event-source">${escapeHtml(e.source)}</span>
          <span class="event-time">${formatTimestamp(e.timestamp)}</span>
        </div>`
      )
      .join('');
  }

  // ─── Update Charts ─────────────────────────────────────────────────────────
  function updateCharts(data) {
    if (data.trafficHistory && data.trafficHistory.length > 1) {
      // Sample to last 30 points for performance
      const sampled = data.trafficHistory.slice(-30);
      updateTrafficChart(sampled);
    }
    if (data.authAttempts && data.authAttempts.length > 0) {
      updateAuthChart(data.authAttempts);
    }
  }

  // ─── Update System Health ──────────────────────────────────────────────────
  function updateSystemHealth(metrics) {
    updateAllGauges(
      metrics.cpuUsage || 0,
      metrics.memoryUsage || 0,
      metrics.diskUsage || 0,
      metrics.networkThroughput || 0
    );
  }

  // ─── Clear Alerts Button ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = $('clearAlertsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        $('alertsList').innerHTML = '<div class="alert-empty">Alerts cleared.</div>';
        $('alertCountBadge').textContent = '0';
      });
    }
  });

  // ─── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initAllCharts();
    // Draw initial gauges with placeholder data
    updateAllGauges(42, 56, 61, 35);
    connectWebSocket();
  });
})();
