/**
 * RudraX Web UI — Agency Edition
 * Main Application Module
 * Build · Break · Deploy · Orchestrate
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const CONFIG = {
  API_BASE: window.location.origin,
  POLL_INTERVAL: 500,
  RECONNECT_INTERVAL: 3000,
  MAX_RETRIES: 5,
};

// ─── Command Registry ──────────────────────────────────────────────────────

const COMMANDS = [
  { name: '/orchestrate', desc: 'Plan and execute multi-agent tasks', icon: '🧠', usage: '/orchestrate <auto|manual> <task>' },
  { name: '/dispatch', desc: 'Dispatch a specific agent', icon: '🚀', usage: '/dispatch <agent-name> <task>' },
  { name: '/agency', desc: 'Manage agency agents', icon: '🎭', usage: '/agency <list|activate|deactivate|squad|status|categories|search>' },
  { name: '/memory', desc: 'Shared memory for multi-agent coordination', icon: '🗂️', usage: '/memory <status|log|tasks|decisions|blockers|handoffs|overview|files|structure|reset|list>' },
  { name: '/skill', desc: 'Load a skill/agent personality', icon: '⚙️', usage: '/skill:<name>' },
  { name: '/help', desc: 'Show available commands', icon: '❓', usage: '/help' },
  { name: '/reload', desc: 'Reload extensions and skills', icon: '🔄', usage: '/reload' },
  { name: '/clear', desc: 'Clear chat history', icon: '🧹', usage: '/clear' },
];

// ─── State ─────────────────────────────────────────────────────────────────

const state = {
  context: null,
  contexts: [],
  logs: [],
  logVersion: 0,
  logGuid: '',
  connected: false,
  running: false,
  paused: false,
  sidebarOpen: true,
  theme: 'dark',
  autoScroll: true,
  socket: null,
  pollTimer: null,
  retryCount: 0,
  // Agency state
  agents: [],
  agentCategories: {},
  agentFilter: '',
  agentCategoryFilter: 'all',
  activeAgent: null,
  activeSquad: null,
  activeSquadAgents: [],
  squads: {},
  // Orchestrator state
  orchestrator: {
    mode: 'auto',
    activePlan: null,
    activeAgent: null,
    taskHistory: [],
  },
  orchestratorOpen: false,
  // Terminal state
  terminalOpen: false,
  terminal: null,
  terminalFit: null,
};

// ─── DOM References ─────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Initialization ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initKeyboardShortcuts();
  initSocketIO();
  restoreSession();
  loadAgents();
  loadSquads();
  adjustTextareaHeight($('#chat-input'));
});

// ─── Socket.IO ──────────────────────────────────────────────────────────────

function initSocketIO() {
  state.socket = io(CONFIG.API_BASE, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
  });

  state.socket.on('connect', () => {
    console.log('[RudraX] Socket connected');
    state.connected = true;
    state.retryCount = 0;
    updateConnectionStatus('connected');
    state.socket.emit('state_request', { context: state.context });
  });

  state.socket.on('disconnect', () => {
    console.log('[RudraX] Socket disconnected');
    state.connected = false;
    updateConnectionStatus('disconnected');
  });

  state.socket.on('state_update', (snapshot) => {
    applySnapshot(snapshot);
  });

  state.socket.on('orchestrator_update', (orchState) => {
    applyOrchestratorUpdate(orchState);
  });

  state.socket.on('connect_error', (err) => {
    console.error('[RudraX] Socket error:', err);
    state.connected = false;
    updateConnectionStatus('disconnected');
  });

  // Terminal events
  state.socket.on('terminal_data', (data) => {
    if (state.terminal) {
      state.terminal.write(data);
    }
  });

  state.socket.on('terminal_ready', (info) => {
    console.log('[RudraX] Terminal ready:', info);
  });

  state.socket.on('terminal_exit', (info) => {
    if (state.terminal) {
      state.terminal.write(`\r\n\x1b[33m[Process exited with code ${info.code}]\x1b[0m\r\n`);
    }
  });
}

// ─── Polling (fallback) ────────────────────────────────────────────────────

function startPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(poll, CONFIG.POLL_INTERVAL);
}

async function poll() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: state.context,
        log_from: state.logVersion,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
    const data = await response.json();
    applySnapshot(data);
    state.connected = true;
    state.retryCount = 0;
    updateConnectionStatus('connected');
  } catch (err) {
    console.error('[RudraX] Poll error:', err);
    state.connected = false;
    updateConnectionStatus('disconnected');
  }
}

// ─── Apply State Snapshot ──────────────────────────────────────────────────

function applySnapshot(snapshot) {
  if (!snapshot) return;

  if (snapshot.context && snapshot.context !== state.context) {
    state.context = snapshot.context;
    localStorage.setItem('rudrax-last-context', snapshot.context);
  }

  if (snapshot.deselect_chat) {
    state.context = null;
    showWelcome();
    return;
  }

  if (snapshot.contexts) {
    state.contexts = snapshot.contexts;
    renderContextsList();
  }

  if (snapshot.log_guid && snapshot.log_guid !== state.logGuid) {
    state.logGuid = snapshot.log_guid;
    state.logVersion = 0;
    state.logs = [];
  }

  if (snapshot.log_version !== undefined && snapshot.log_version > state.logVersion) {
    const newLogs = snapshot.logs || [];
    for (const log of newLogs) {
      if (log._update) {
        const existing = state.logs.find(l => l.id === log.id);
        if (existing) {
          Object.assign(existing, log, { _update: undefined });
        } else {
          state.logs.push({ ...log, _update: undefined });
        }
      } else {
        const existingIndex = state.logs.findIndex(l => l.id === log.id);
        if (existingIndex >= 0) {
          state.logs[existingIndex] = { ...log };
        } else {
          state.logs.push({ ...log });
        }
      }
    }
    state.logVersion = snapshot.log_version;
    renderMessages();
  }

  if (snapshot.log_progress !== undefined) {
    updateProgress(snapshot.log_progress, snapshot.log_progress_active);
  }

  state.running = snapshot.log_progress_active || false;
  state.paused = snapshot.paused || false;
  updateSendButton();

  if (state.context) {
    hideWelcome();
  }
}

// ─── Orchestrator Updates ──────────────────────────────────────────────────

function applyOrchestratorUpdate(orchState) {
  state.orchestrator = { ...state.orchestrator, ...orchState };

  // Update mode badge
  const modeLabel = $('#orch-mode-label');
  if (modeLabel) modeLabel.textContent = orchState.mode === 'auto' ? 'Auto' : 'Manual';

  const panelMode = $('#orch-panel-mode');
  if (panelMode) panelMode.textContent = orchState.mode?.toUpperCase() || 'AUTO';

  const settingsMode = $('#orch-settings-mode');
  if (settingsMode) settingsMode.value = orchState.mode || 'auto';

  // Update active agent badge
  updateActiveAgentBadge(orchState.activeAgent);

  // Update squad badge
  updateSquadBadge(orchState.activeSquad, orchState.activeSquadAgents);

  // Update orchestrator panel
  renderOrchestratorPanel();
}

// ─── Context Management ────────────────────────────────────────────────────

async function newContext() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/contexts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(`Create context failed: ${response.status}`);
    const data = await response.json();
    state.context = data.context;
    state.logs = [];
    state.logVersion = 0;
    state.logGuid = '';
    hideWelcome();
    renderMessages();
    updateChatTitle(data.name || 'New Chat');
    renderContextsList();
    if (state.socket?.connected) {
      state.socket.emit('state_request', { context: state.context });
    }
    // Initialize shared memory for new context
    await loadMemory(data.context);
    $('#chat-input')?.focus();
  } catch (err) {
    console.error('[RudraX] Failed to create context:', err);
    showToast('Failed to create new chat', 'error');
  }
}

async function selectContext(contextId) {
  state.context = contextId;
  state.logVersion = 0;
  state.logGuid = '';
  state.logs = [];
  hideWelcome();
  clearMessages();
  updateChatTitle(getContextName(contextId));
  localStorage.setItem('rudrax-last-context', contextId);
  if (state.socket?.connected) {
    state.socket.emit('state_request', { context: state.context });
  }
  await poll();
  // Load shared memory for this context
  await loadMemory(contextId);
}

async function deleteContext(contextId, event) {
  event?.stopPropagation();
  try {
    await fetch(`${CONFIG.API_BASE}/api/contexts/${contextId}`, { method: 'DELETE' });
    state.contexts = state.contexts.filter(c => c.id !== contextId);
    if (state.context === contextId) {
      state.context = null;
      state.logs = [];
      showWelcome();
    }
    renderContextsList();
  } catch (err) {
    console.error('[RudraX] Failed to delete context:', err);
  }
}

// ─── Agent Loading ─────────────────────────────────────────────────────────

async function loadAgents() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/skills`);
    if (!response.ok) throw new Error('Failed to load agents');
    state.agents = await response.json();

    // Build categories
    state.agentCategories = {};
    for (const agent of state.agents) {
      if (!state.agentCategories[agent.category]) {
        state.agentCategories[agent.category] = { count: 0, color: agent.color };
      }
      state.agentCategories[agent.category].count++;
    }

    renderAgentCategories();
    renderAgentsList();
  } catch (err) {
    console.error('[RudraX] Failed to load agents:', err);
    $('#agents-list').innerHTML = '<div class="empty-state">Failed to load agents</div>';
  }
}

async function loadSquads() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/squads`);
    if (!response.ok) throw new Error('Failed to load squads');
    state.squads = await response.json();
    renderSquadsList();
  } catch (err) {
    console.error('[RudraX] Failed to load squads:', err);
    $('#squads-list').innerHTML = '<div class="empty-state">Failed to load squads</div>';
  }
}

// ─── Rendering: Agents ──────────────────────────────────────────────────────

function renderAgentCategories() {
  const container = $('#agent-categories');
  if (!container) return;

  const categories = Object.entries(state.agentCategories).sort((a, b) => b[1].count - a[1].count);

  container.innerHTML = `
    <span class="agent-cat-chip ${state.agentCategoryFilter === 'all' ? 'active' : ''}"
          onclick="filterAgentCategory('all')">All (${state.agents.length})</span>
    ${categories.map(([cat, info]) => `
      <span class="agent-cat-chip ${state.agentCategoryFilter === cat ? 'active' : ''}"
            onclick="filterAgentCategory('${cat}')"
            style="${state.agentCategoryFilter === cat ? `border-color:${info.color};color:${info.color}` : ''}">
        ${cat} (${info.count})
      </span>
    `).join('')}
  `;
}

function filterAgentCategory(category) {
  state.agentCategoryFilter = category;
  renderAgentCategories();
  renderAgentsList();
}

function filterAgents(query) {
  state.agentFilter = query.toLowerCase();
  renderAgentsList();
}

function renderAgentsList() {
  const container = $('#agents-list');
  if (!container) return;

  let agents = state.agents;

  // Apply category filter
  if (state.agentCategoryFilter !== 'all') {
    agents = agents.filter(a => a.category === state.agentCategoryFilter);
  }

  // Apply text search
  if (state.agentFilter) {
    agents = agents.filter(a =>
      a.name.toLowerCase().includes(state.agentFilter) ||
      a.description.toLowerCase().includes(state.agentFilter) ||
      a.skillName.toLowerCase().includes(state.agentFilter)
    );
  }

  if (agents.length === 0) {
    container.innerHTML = '<div class="empty-state">No agents found</div>';
    return;
  }

  container.innerHTML = agents.map(agent => `
    <div class="agent-item ${state.activeAgent === agent.skillName ? 'active' : ''}"
         onclick="activateAgent('${agent.skillName}')" title="${escapeHtml(agent.vibe || agent.description)}">
      <div class="agent-item-emoji">${agent.emoji}</div>
      <div class="agent-item-info">
        <div class="agent-item-name">${escapeHtml(agent.name)}</div>
        <div class="agent-item-desc">${escapeHtml(agent.description.substring(0, 80))}</div>
        <span class="agent-item-category" style="color:${getCatColor(agent.category)}">${agent.category}</span>
      </div>
    </div>
  `).join('');
}

function getCatColor(category) {
  const colors = {
    engineering: 'var(--cat-engineering)', marketing: 'var(--cat-marketing)',
    design: 'var(--cat-design)', specialized: 'var(--cat-specialized)',
    'game-development': 'var(--cat-game-development)', testing: 'var(--cat-testing)',
    sales: 'var(--cat-sales)', strategy: 'var(--cat-strategy)',
    'paid-media': 'var(--cat-paid-media)', support: 'var(--cat-support)',
    'spatial-computing': 'var(--cat-spatial-computing)',
    'project-management': 'var(--cat-project-management)',
    product: 'var(--cat-product)', finance: 'var(--cat-finance)',
    academic: 'var(--cat-academic)',
  };
  return colors[category] || '#78909c';
}

// ─── Rendering: Squads ─────────────────────────────────────────────────────

function renderSquadsList() {
  const container = $('#squads-list');
  if (!container) return;

  const entries = Object.entries(state.squads);
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No squads available</div>';
    return;
  }

  container.innerHTML = entries.map(([key, squad]) => `
    <div class="squad-card ${state.activeSquad === key ? 'active' : ''}"
         onclick="activateSquad('${key}')" title="${escapeHtml(squad.description)}">
      <div class="squad-card-header">
        <span class="squad-card-emoji">${squad.emoji}</span>
        <span class="squad-card-name">${escapeHtml(squad.name)}</span>
        <span class="squad-card-count">${squad.agents.length} agents</span>
      </div>
      <div class="squad-card-desc">${escapeHtml(squad.description)}</div>
      <div class="squad-card-agents">
        ${squad.agents.slice(0, 5).map(a => `<span class="squad-agent-chip">${a.split('-').pop()}</span>`).join('')}
        ${squad.agents.length > 5 ? `<span class="squad-agent-chip">+${squad.agents.length - 5}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ─── Agent/Squad Actions ───────────────────────────────────────────────────

async function activateAgent(skillName) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/agents/${skillName}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: state.context }),
    });
    const data = await response.json();
    if (data.ok) {
      state.activeAgent = skillName;
      updateActiveAgentBadge(skillName);
      renderAgentsList();
      showToast(`✅ Agent ${skillName} activated`, 'success');
    }
  } catch (err) {
    showToast('Failed to activate agent', 'error');
  }
}

async function deactivateAgent() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/agents/deactivate`, { method: 'POST' });
    state.activeAgent = null;
    updateActiveAgentBadge(null);
    renderAgentsList();
    showToast('Agent deactivated', 'info');
  } catch (err) {
    // Ignore
  }
}

async function activateSquad(squadName) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/squads/${squadName}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: state.context }),
    });
    const data = await response.json();
    if (data.ok) {
      state.activeSquad = squadName;
      state.activeSquadAgents = data.agents || state.squads[squadName]?.agents || [];
      updateSquadBadge(squadName, state.activeSquadAgents);
      renderSquadsList();
      showToast(data.message || `🎭 ${squadName} squad activated`, 'success');
    }
  } catch (err) {
    showToast('Failed to activate squad', 'error');
  }
}

async function deactivateSquad() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/squads/deactivate`, { method: 'POST' });
    state.activeSquad = null;
    state.activeSquadAgents = [];
    updateSquadBadge(null, []);
    renderSquadsList();
    showToast('Squad deactivated', 'info');
  } catch (err) {
    // Ignore
  }
}

// ─── Agent/Squad Badge Updates ─────────────────────────────────────────────

function updateActiveAgentBadge(agentName) {
  const badge = $('#active-agent-badge');
  if (!badge) return;

  if (agentName) {
    const agent = state.agents.find(a => a.skillName === agentName);
    $('#badge-emoji').textContent = agent?.emoji || '🤖';
    $('#badge-name').textContent = agent?.name || agentName;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function updateSquadBadge(squadName, agents) {
  const badge = $('#squad-badge');
  if (!badge) return;

  if (squadName && state.squads[squadName]) {
    const squad = state.squads[squadName];
    $('#squad-badge-emoji').textContent = squad.emoji;
    $('#squad-badge-name').textContent = squad.name.replace(' Squad', '');
    $('#squad-badge-count').textContent = `${agents.length} agents`;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ─── Orchestrator Panel ────────────────────────────────────────────────────

function toggleOrchestrator() {
  state.orchestratorOpen = !state.orchestratorOpen;
  const panel = $('#orchestrator-panel');
  if (panel) panel.classList.toggle('hidden', !state.orchestratorOpen);
  renderOrchestratorPanel();
}

function renderOrchestratorPanel() {
  const plan = state.orchestrator.activePlan;
  const noPlan = $('#orch-no-plan');
  const activePlan = $('#orch-active-plan');
  const agentSection = $('#orch-agent-section');

  if (!plan) {
    if (noPlan) noPlan.style.display = '';
    if (activePlan) activePlan.classList.add('hidden');
  } else {
    if (noPlan) noPlan.style.display = 'none';
    if (activePlan) {
      activePlan.classList.remove('hidden');

      const statusEl = $('#orch-plan-status');
      const taskEl = $('#orch-plan-task');
      if (statusEl) statusEl.textContent = plan.status?.toUpperCase() || 'PLANNING';
      if (taskEl) taskEl.textContent = plan.task || '';

      // Update status badge class
      if (statusEl) {
        statusEl.className = 'orch-plan-status';
        if (plan.status === 'completed') statusEl.classList.add('completed');
        else if (plan.status === 'stopped') statusEl.classList.add('stopped');
        else if (plan.status === 'running') statusEl.classList.add('running');
      }

      // Render lanes
      renderOrchLanes(plan.lanes || []);
    }
  }

  // Active agent section
  if (state.orchestrator.activeAgent && agentSection) {
    agentSection.style.display = '';
    const agent = state.agents.find(a => a.skillName === state.orchestrator.activeAgent);
    $('#orch-active-agent-card').innerHTML = `
      <span class="orch-agent-emoji">${agent?.emoji || '🤖'}</span>
      <span class="orch-agent-name">${agent?.name || state.orchestrator.activeAgent}</span>
    `;
  } else if (agentSection) {
    agentSection.style.display = 'none';
  }

  // Task history
  renderOrchTaskLog();
}

function renderOrchLanes(lanes) {
  const container = $('#orch-lanes');
  if (!container) return;

  if (!lanes || lanes.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:8px">Planning in progress...</div>';
    return;
  }

  container.innerHTML = lanes.map((lane, i) => `
    <div class="orch-lane">
      <div class="orch-lane-header">
        <span class="orch-lane-name">Lane ${i + 1}</span>
        <span class="orch-lane-status">${getLaneStatusText(lane)}</span>
      </div>
      <div class="orch-tasks">
        ${(lane.tasks || []).map(task => `
          <div class="orch-task-card">
            <span class="orch-task-status ${task.status || 'pending'}"></span>
            <span class="orch-task-name">${escapeHtml(task.description || task.task || 'Task')}</span>
            ${task.agent ? `<span class="orch-task-agent">${task.agent}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function getLaneStatusText(lane) {
  if (!lane.tasks || lane.tasks.length === 0) return '';
  const completed = lane.tasks.filter(t => t.status === 'completed').length;
  return `${completed}/${lane.tasks.length} done`;
}

function renderOrchTaskLog() {
  const container = $('#orch-task-log');
  if (!container) return;

  const history = state.orchestrator.taskHistory || [];
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:8px">No tasks yet</div>';
    return;
  }

  container.innerHTML = history.slice(-20).reverse().map(h => `
    <div class="orch-log-entry ${h.success ? 'success' : h.error ? 'error' : ''}">
      <span>${new Date(h.completedAt || Date.now()).toLocaleTimeString()}</span>
      <span>${h.description || 'Task completed'}</span>
    </div>
  `).join('');
}

// ─── Orchestration Actions ─────────────────────────────────────────────────

async function startOrchestration(task) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/orchestrator/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context: state.context }),
    });
    const data = await response.json();
    if (data.ok) {
      state.orchestrator.activePlan = data.plan;
      renderOrchestratorPanel();
      showToast('🧠 Orchestration plan created', 'success');
    }
  } catch (err) {
    showToast('Failed to start orchestration', 'error');
  }
}

async function stopOrchestration() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/orchestrator/stop`, { method: 'POST' });
    if (state.orchestrator.activePlan) {
      state.orchestrator.activePlan.status = 'stopped';
    }
    renderOrchestratorPanel();
    showToast('⏹ Orchestration stopped', 'info');
  } catch (err) {
    // Ignore
  }
}

async function resetOrchestrator() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/orchestrator/reset`, { method: 'POST' });
    state.orchestrator.activePlan = null;
    state.orchestrator.activeAgent = null;
    state.orchestrator.taskHistory = [];
    renderOrchestratorPanel();
    showToast('↺ Orchestrator reset', 'info');
  } catch (err) {
    // Ignore
  }
}

async function toggleOrchMode() {
  const newMode = state.orchestrator.mode === 'auto' ? 'manual' : 'auto';
  try {
    await fetch(`${CONFIG.API_BASE}/api/orchestrator/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode }),
    });
    state.orchestrator.mode = newMode;
    const modeLabel = $('#orch-mode-label');
    if (modeLabel) modeLabel.textContent = newMode === 'auto' ? 'Auto' : 'Manual';
    const panelMode = $('#orch-panel-mode');
    if (panelMode) panelMode.textContent = newMode.toUpperCase();
    showToast(`🧠 Mode: ${newMode}`, 'info');
  } catch (err) {
    // Ignore
  }
}

function setOrchMode(mode) {
  fetch(`${CONFIG.API_BASE}/api/orchestrator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  state.orchestrator.mode = mode;
}

// ─── Message Sending ────────────────────────────────────────────────────────

async function sendMessage() {
  const input = $('#chat-input');
  const text = input?.value?.trim();
  if (!text) return;

  // If no context, create one
  if (!state.context) {
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/contexts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      state.context = data.context;
      hideWelcome();
    } catch (err) {
      showToast('Failed to start conversation', 'error');
      return;
    }
  }

  // Clear input
  input.value = '';
  adjustTextareaHeight(input);
  hideCommandSuggestions();

  // Add user message locally
  const userMsg = {
    no: state.logs.length + 1,
    id: generateGuid(),
    type: 'user',
    content: text,
    heading: '',
    kvps: {},
    timestamp: Date.now(),
  };
  state.logs.push(userMsg);
  state.logVersion++;
  renderMessages();
  scrollToBottom();

  // Parse orchestration commands locally
  if (text.startsWith('/orchestrate ')) {
    const parts = text.slice('/orchestrate '.length);
    const modeMatch = parts.match(/^(auto|manual)\s+(.+)/);
    if (modeMatch) {
      startOrchestration(modeMatch[2]);
    } else {
      startOrchestration(parts);
    }
  }

  // Send to server
  state.running = true;
  updateSendButton();
  showProgress('Processing...');

  try {
    const response = await fetch(`${CONFIG.API_BASE}/message_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context: state.context, message_id: userMsg.id }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }
    const data = await response.json();
    if (data.context) {
      state.context = data.context;
      localStorage.setItem('rudrax-last-context', data.context);
    }
  } catch (err) {
    console.error('[RudraX] Send error:', err);
    showToast(err.message || 'Failed to send message', 'error');
    state.logs = state.logs.filter(l => l.id !== userMsg.id);
    state.running = false;
    updateSendButton();
    hideProgress();
  }
}

function insertPrompt(text) {
  const input = $('#chat-input');
  if (input) {
    input.value = text + ' ';
    input.focus();
    adjustTextareaHeight(input);
  }
}

function focusCommandBar(prefix) {
  const input = $('#chat-input');
  if (input) {
    input.value = prefix || '/';
    input.focus();
    adjustTextareaHeight(input);
    if (prefix?.startsWith('/')) {
      showCommandSuggestions(prefix);
    }
  }
}

// ─── Command Suggestions ───────────────────────────────────────────────────

function handleInputChange(el) {
  const val = el.value;
  if (val.startsWith('/') && !val.includes(' ')) {
    showCommandSuggestions(val);
  } else {
    hideCommandSuggestions();
  }
}

function showCommandSuggestions(prefix) {
  const container = $('#command-suggestions');
  if (!container) return;

  const matches = COMMANDS.filter(c => c.name.startsWith(prefix.toLowerCase()));
  if (matches.length === 0) {
    hideCommandSuggestions();
    return;
  }

  // Also add agent suggestions for /dispatch and /skill
  let agentSuggestions = [];
  if (prefix.startsWith('/dispatch') || prefix.startsWith('/skill:')) {
    agentSuggestions = state.agents
      .filter(a => a.skillName.toLowerCase().includes(prefix.split(' ').pop()?.toLowerCase() || ''))
      .slice(0, 5)
      .map(a => ({
        name: `/dispatch ${a.skillName}`,
        desc: a.description.substring(0, 60),
        icon: a.emoji,
      }));
  }

  container.innerHTML = [
    ...matches.map(cmd => `
      <div class="cmd-suggestion" onclick="insertPrompt('${cmd.usage}')">
        <span class="cmd-suggestion-icon">${cmd.icon}</span>
        <span class="cmd-suggestion-name">${cmd.name}</span>
        <span class="cmd-suggestion-desc">${cmd.desc}</span>
      </div>
    `),
    ...agentSuggestions.map(s => `
      <div class="cmd-suggestion" onclick="insertPrompt('${s.name} ')">
        <span class="cmd-suggestion-icon">${s.icon}</span>
        <span class="cmd-suggestion-name">${s.name}</span>
        <span class="cmd-suggestion-desc">${s.desc}</span>
      </div>
    `),
  ].join('');

  container.classList.remove('hidden');
}

function hideCommandSuggestions() {
  const container = $('#command-suggestions');
  if (container) container.classList.add('hidden');
}

// ─── Message Rendering ─────────────────────────────────────────────────────

function renderMessages() {
  const container = $('#chat-history');
  if (!container) return;

  const newHTML = state.logs.map(log => renderLogMessage(log)).join('');
  if (container.innerHTML !== newHTML) {
    container.innerHTML = newHTML;
    if (state.autoScroll) scrollToBottom();
  }
}

function clearMessages() {
  const container = $('#chat-history');
  if (container) container.innerHTML = '';
}

function renderLogMessage(log) {
  const time = log.timestamp ? formatTime(log.timestamp) : '';

  switch (log.type) {
    case 'user':
      return `
        <div class="message user" id="msg-${log.id}">
          <div class="message-content">
            <div class="message-meta">
              <span class="message-sender">You</span>
              <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(log.content || '')}</div>
          </div>
        </div>`;

    case 'agent':
      return `
        <div class="message agent" id="msg-${log.id}">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            ${log.heading ? `<div class="message-heading">${escapeHtml(log.heading)}</div>` : ''}
            ${log.content ? `<div class="message-text">${renderMarkdown(log.content)}</div>` : ''}
            ${!log.content && log.kvps?.headline ? `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>` : ''}
          </div>
        </div>`;

    case 'response':
      return `
        <div class="message response" id="msg-${log.id}">
          <div class="message-avatar">🔥</div>
          <div class="message-content">
            <div class="message-meta">
              <span class="message-sender">RudraX</span>
              <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${renderMarkdown(log.content || '')}</div>
          </div>
        </div>`;

    case 'tool':
    case 'tool_result':
      const isTool = log.type === 'tool';
      const icon = isTool ? '🔧' : '✅';
      const toolName = log.kvps?.tool_name || log.heading || 'Tool';
      const content = log.content || '';
      return `
        <div class="${isTool ? 'message tool' : 'message tool_result'}" id="msg-${log.id}">
          <div class="message-content" style="width:100%">
            <details class="tool-step">
              <summary class="tool-step-header">
                <span>${icon} ${escapeHtml(toolName)}</span>
                <span style="font-size:11px;color:var(--text-muted)">${time}</span>
              </summary>
              <div class="tool-step-body">
                <pre><code>${escapeHtml(typeof content === 'string' ? content : JSON.stringify(content, null, 2))}</code></pre>
              </div>
            </details>
          </div>
        </div>`;

    case 'error':
      return `
        <div class="message error" id="msg-${log.id}">
          <div class="message-avatar">⚠️</div>
          <div class="message-content">
            <div class="message-meta">
              <span class="message-sender">Error</span>
              <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(log.content || 'An error occurred')}</div>
          </div>
        </div>`;

    default:
      return `
        <div class="message agent" id="msg-${log.id}">
          <div class="message-content">
            <div class="message-text">${renderMarkdown(log.content || '')}</div>
          </div>
        </div>`;
  }
}

// ─── Context List Rendering ────────────────────────────────────────────────

function renderContextsList() {
  const container = $('#chats-list');
  if (!container) return;

  if (state.contexts.length === 0) {
    container.innerHTML = '<div class="empty-state">No chats yet</div>';
    return;
  }

  container.innerHTML = state.contexts.map(ctx => `
    <div class="chat-item ${ctx.id === state.context ? 'active' : ''}"
         onclick="selectContext('${ctx.id}')">
      <span class="chat-item-icon">${ctx.running ? '⚡' : '💬'}</span>
      <span class="chat-item-name">${escapeHtml(ctx.name || ctx.id)}</span>
      <button class="chat-item-delete" onclick="deleteContext('${ctx.id}', event)" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

function getContextName(contextId) {
  const ctx = state.contexts.find(c => c.id === contextId);
  return ctx?.name || contextId;
}

function filterChats(query) {
  const items = $$('.chat-item');
  const lowerQuery = query.toLowerCase();
  items.forEach(item => {
    const name = item.querySelector('.chat-item-name')?.textContent?.toLowerCase() || '';
    item.style.display = name.includes(lowerQuery) ? '' : 'none';
  });
}

// ─── Sidebar Tab Switching ──────────────────────────────────────────────────

function switchSidebarTab(tabName) {
  // Update tab buttons
  $$('.sidebar-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // Update tab content
  $$('.sidebar-tab-content').forEach(content => {
    content.style.display = 'none';
  });

  const target = $(`#tab-${tabName}`);
  if (target) {
    target.style.display = '';
    target.classList.add('active');
  }
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

function showWelcome() {
  $('#welcome-screen')?.classList.remove('hidden');
  $('#chat-area-wrapper')?.classList.remove('hidden');
  // Hide chat history, show welcome
  const wrapper = $('#chat-area-wrapper');
  if (wrapper) {
    $('#welcome-screen').style.display = '';
    $('#chat-history').style.display = 'none';
  }
}

function hideWelcome() {
  $('#welcome-screen')?.classList.add('hidden');
  const wrapper = $('#chat-area-wrapper');
  if (wrapper) {
    $('#welcome-screen').style.display = 'none';
    $('#chat-history').style.display = '';
  }
}

function updateConnectionStatus(status) {
  const dot = $('#connection-status');
  if (!dot) return;
  dot.className = `status-dot ${status}`;
  dot.title = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected';
}

function updateChatTitle(title) {
  const el = $('#chat-title');
  if (el) el.textContent = title || 'RudraX';
}

function updateSendButton() {
  const btn = $('#send-button');
  if (!btn) return;
  btn.disabled = state.running;
}

function showProgress(text) {
  $('#progress-bar')?.classList.remove('hidden');
  const pt = $('#progress-text');
  if (pt) pt.textContent = text || '';
}

function updateProgress(text, active) {
  active ? showProgress(text) : hideProgress();
}

function hideProgress() {
  $('#progress-bar')?.classList.add('hidden');
}

function toggleSidebar() {
  const sidebar = $('#left-panel');
  const overlay = $('#sidebar-overlay');
  state.sidebarOpen = !state.sidebarOpen;

  if (state.sidebarOpen) {
    sidebar?.classList.remove('hidden');
    if (window.innerWidth <= 768) overlay?.classList.add('visible');
  } else {
    sidebar?.classList.add('hidden');
    overlay?.classList.remove('visible');
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;padding:12px 24px;
    background:${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#333'};
    color:white;border-radius:8px;font-size:14px;z-index:9999;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Terminal ───────────────────────────────────────────────────────────────

function toggleTerminal() {
  state.terminalOpen = !state.terminalOpen;
  const panel = $('#terminal-panel');
  if (panel) panel.classList.toggle('hidden', !state.terminalOpen);

  if (state.terminalOpen && !state.terminal) {
    initTerminal();
  }

  if (state.terminalOpen && state.terminal) {
    setTimeout(() => {
      if (state.terminalFit) state.terminalFit.fit();
      state.terminal?.focus();
    }, 100);
  }
}

function resetTerminal() {
  if (state.terminal) {
    state.terminal.clear();
    state.terminal.write('\x1b[2J\x1b[H');
  }
  if (state.socket?.connected) {
    state.socket.emit('terminal_kill');
    setTimeout(() => {
      state.socket.emit('terminal_create', { cwd: process_cwd() });
    }, 200);
  }
}

function process_cwd() {
  // Try to get a sensible CWD
  return new URLSearchParams(window.location.search).get('cwd') || '/';
}

// ─── Clock ──────────────────────────────────────────────────────────────────

function initClock() {
  const el = $('#time-date');
  const update = () => {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'pm' : 'am';
    const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (el) el.innerHTML = `${hours}:${minutes} ${ampm}<br><span style="font-size:10px">${dateStr}</span>`;
  };
  update();
  setInterval(update, 1000);
}

// ─── Theme ──────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('rudrax-theme');
  if (saved) state.theme = saved;
  applyTheme();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('rudrax-theme', state.theme);
  applyTheme();
  const sel = $('#theme-select');
  if (sel) sel.value = state.theme;
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('rudrax-theme', theme);
  applyTheme();
}

function applyTheme() {
  document.body.classList.toggle('light-mode', state.theme === 'light');
  document.body.classList.toggle('dark-mode', state.theme !== 'light');
}

// ─── Font Size ──────────────────────────────────────────────────────────────

function setFontSize(size) {
  document.documentElement.style.setProperty('--fs-base', `${size}px`);
  const display = $('#font-size-value');
  if (display) display.textContent = `${size}px`;
}

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      newContext();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault();
      toggleTerminal();
    }
    if (e.key === 'Escape') {
      closeSettings();
      hideCommandSuggestions();
    }
  });
}

// ─── Input Handling ─────────────────────────────────────────────────────────

function handleInputKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
  if (event.key === 'Escape') {
    hideCommandSuggestions();
  }
  if (event.key === 'Tab') {
    // Autocomplete commands
    const input = event.target;
    const val = input.value;
    if (val.startsWith('/') && !val.includes(' ')) {
      event.preventDefault();
      const matches = COMMANDS.filter(c => c.name.startsWith(val));
      if (matches.length === 1) {
        input.value = matches[0].usage + ' ';
        adjustTextareaHeight(input);
      }
    }
  }
}

function adjustTextareaHeight(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

// ─── Scroll ─────────────────────────────────────────────────────────────────

function scrollToBottom() {
  requestAnimationFrame(() => {
    const hist = $('#chat-history');
    if (hist) hist.scrollTop = hist.scrollHeight;
  });
}

// ─── Settings Modal ─────────────────────────────────────────────────────────

function openSettings() {
  $('#settings-modal')?.classList.remove('hidden');
  const sel = $('#theme-select');
  if (sel) sel.value = state.theme;
  const orchMode = $('#orch-settings-mode');
  if (orchMode) orchMode.value = state.orchestrator.mode;
}

function closeSettings() {
  $('#settings-modal')?.classList.add('hidden');
}

function showShortcuts() {
  showToast('⌨️ Ctrl+N: New chat · Ctrl+B: Sidebar · Ctrl+`: Terminal · Shift+Enter: New line · /: Commands', 'info');
}

// ─── Session Restore ────────────────────────────────────────────────────────

async function restoreSession() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/contexts`);
    if (response.ok) {
      const data = await response.json();
      state.contexts = data;
      renderContextsList();

      const lastContext = localStorage.getItem('rudrax-last-context');
      if (lastContext && data.find(c => c.id === lastContext)) {
        selectContext(lastContext);
      }
    }
  } catch (err) {
    console.error('[RudraX] Failed to restore session:', err);
  }

  // Restore orchestrator state
  try {
    const orchResp = await fetch(`${CONFIG.API_BASE}/api/orchestrator`);
    if (orchResp.ok) {
      const orchData = await orchResp.json();
      applyOrchestratorUpdate(orchData);
    }
  } catch (err) {
    // Non-critical
  }
}

// ─── Markdown Rendering ─────────────────────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return '';
  try {
    if (typeof marked !== 'undefined') {
      marked.setOptions({ breaks: true, gfm: true });
      let html = marked.parse(text);
      html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
      return html;
    }
  } catch (e) { /* fallback */ }
  return escapeHtml(text).replace(/\n/g, '<br>');
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Shared Memory ───────────────────────────────────────────────────────────

const memoryState = {
  contextId: null,
  data: null,
  sections: {},
};

/** Load memory for the current context */
async function loadMemory(contextId) {
  if (!contextId) return;
  memoryState.contextId = contextId;
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/memory/${encodeURIComponent(contextId)}`);
    if (response.ok) {
      memoryState.data = await response.json();
      renderMemory(memoryState.data);
      return;
    }
    // Try to initialize
    const initResp = await fetch(`${CONFIG.API_BASE}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contextId, projectName: `Project ${contextId.slice(0, 8)}` }),
    });
    if (initResp.ok) {
      memoryState.data = (await initResp.json()).memory;
      renderMemory(memoryState.data);
    }
  } catch (err) {
    console.error('[RudraX] Failed to load memory:', err);
  }
}

/** Refresh memory data */
async function refreshMemory() {
  if (memoryState.contextId) {
    await loadMemory(memoryState.contextId);
    showToast('🔄 Memory refreshed', 'info');
  } else {
    showToast('⚠️ No active context', 'info');
  }
}

/** Render memory data to the sidebar */
function renderMemory(mem) {
  if (!mem) return;

  // Project name
  const nameEl = $('#memory-project-name');
  if (nameEl) {
    nameEl.style.display = 'flex';
    $('#mem-project-name').textContent = mem.project || 'Project';
    const statusEl = $('#mem-project-status');
    if (statusEl) {
      statusEl.textContent = mem.status || 'active';
      statusEl.className = `mem-status-badge ${mem.status || 'active'}`;
    }
  }

  // Overview
  const overviewEl = $('#mem-overview');
  if (overviewEl) {
    overviewEl.textContent = mem.overview || '(No overview yet)';
  }

  // Structure
  const structEl = $('#mem-structure');
  if (structEl) {
    const structText = mem.structure || '';
    structEl.textContent = structText.replace(/```[\w]*\n?/g, '').replace(/```/g, '') || '(not scanned)';
  }

  // Task board - parse from markdown text
  const tasksEl = $('#mem-tasks');
  const taskCountEl = $('#mem-task-count');
  if (tasksEl) {
    const taskHtml = parseMemoryTasks(mem.taskBoard || '');
    tasksEl.innerHTML = taskHtml;
    const taskCount = (mem.taskBoard?.match(/\|.*\|.*\|.*\|/g) || []).filter(l => !l.includes('Task ID')).length;
    if (taskCountEl) taskCountEl.textContent = taskCount;
  }

  // Activity log - parse from markdown text
  const logEl = $('#mem-log');
  const logCountEl = $('#mem-log-count');
  if (logEl) {
    const logEntries = parseMemoryLog(mem.activityLog || '');
    logEl.innerHTML = logEntries;
    const logCount = (mem.activityLog?.match(/^\s*-/gm) || []).length;
    if (logCountEl) logCountEl.textContent = logCount;
  }

  // Decisions
  const decisionsEl = $('#mem-decisions');
  const decisionsCountEl = $('#mem-decisions-count');
  if (decisionsEl) {
    const entries = parseMemoryEntries(mem.decisions || '');
    decisionsEl.innerHTML = entries;
    const count = (mem.decisions?.match(/^\s*-/gm) || []).length;
    if (decisionsCountEl) decisionsCountEl.textContent = count;
  }

  // Blockers
  const blockersEl = $('#mem-blockers');
  const blockersCountEl = $('#mem-blockers-count');
  if (blockersEl) {
    const entries = parseMemoryEntries(mem.blockers || '');
    blockersEl.innerHTML = entries;
    const count = (mem.blockers?.match(/^\s*-/gm) || []).length;
    if (blockersCountEl) blockersCountEl.textContent = count;
    if (count > 0 && blockersCountEl) blockersCountEl.classList.add('danger');
  }

  // Handoffs
  const handoffsEl = $('#mem-handoffs');
  const handoffsCountEl = $('#mem-handoffs-count');
  if (handoffsEl) {
    const entries = parseMemoryEntries(mem.handoffs || '');
    handoffsEl.innerHTML = entries;
    const count = (mem.handoffs?.match(/^\s*-/gm) || []).length;
    if (handoffsCountEl) handoffsCountEl.textContent = count;
  }

  // Files changed
  const filesEl = $('#mem-files');
  const filesCountEl = $('#mem-files-count');
  if (filesEl) {
    const files = parseMemoryFiles(mem.filesChanged || '');
    filesEl.innerHTML = files;
    const count = (mem.filesChanged?.match(/^\s*[-*]/gm) || []).length;
    if (filesCountEl) filesCountEl.textContent = count;
  }
}

/** Parse task board markdown to HTML */
function parseMemoryTasks(md) {
  if (!md || md.includes('(No tasks') || md.includes('(empty)')) {
    return '<div class="empty-state">No tasks yet</div>';
  }
  const rows = md.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('Task ID') && !l.includes('-----'));
  return rows.map(row => {
    const cells = row.split('|').filter(c => c.trim());
    if (cells.length < 3) return '';
    const id = cells[0]?.trim() || '';
    const agent = cells[1]?.trim() || '';
    const status = cells[2]?.trim() || '';
    const desc = cells[3]?.trim() || '';
    const icon = status.includes('✅') ? '✅' : status.includes('🔄') ? '🔄' : status.includes('🚫') ? '🚫' : '⏳';
    return `
      <div class="mem-task-row">
        <span class="mem-task-icon">${icon}</span>
        <div class="mem-task-info">
          <span class="mem-task-id">${escapeHtml(id)}</span>
          <div class="mem-task-desc">${escapeHtml(desc)}</div>
          <span class="mem-task-agent">${escapeHtml(agent)}</span>
        </div>
      </div>`;
  }).join('');
}

/** Parse activity log markdown to HTML */
function parseMemoryLog(md) {
  if (!md || md.includes('(No activity') || md.includes('(empty)')) {
    return '<div class="empty-state">No activity yet</div>';
  }
  const lines = md.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.slice(0, 30).map(line => {
    const agentMatch = line.match(/\*\*\[([^]]+)\]\*\*/);
    const agent = agentMatch ? agentMatch[1] : '?';
    const typeMatch = line.match(/\|\s*(\w+)\s*\|/);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'note';
    const content = line.replace(/^[-*]\s*/, '').replace(/\*\[([^]]+)\]\*\*/g, '').replace(/\|[^|]*\|[^|]*\|/, '').replace(/^[ ✅💡🚫🤝📝🏗️📌]+/, '').trim();
    return `
      <div class="mem-log-entry ${type}">
        <span class="mem-log-agent">[${escapeHtml(agent)}]</span>
        <span class="mem-log-type">${type}</span>
        <div class="mem-log-content">${escapeHtml(content.slice(0, 120))}</div>
      </div>`;
  }).join('');
}

/** Parse generic entries (decisions, blockers, handoffs) */
function parseMemoryEntries(md) {
  if (!md || md.includes('(No ') || md.includes('(none)') || md.includes('smooth sailing')) {
    return '<div class="empty-state">None</div>';
  }
  const lines = md.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.slice(0, 20).map(line => {
    const agentMatch = line.match(/\*\*\[([^]]+)\]\*\*/);
    const agent = agentMatch ? agentMatch[1] : '';
    const content = line.replace(/^[-*]\s*/, '').replace(/\*\*\[([^]]+)\]\*\*/g, '').replace(/[💡🚫🤝]/g, '').trim();
    return `
      <div class="mem-entry">
        ${agent ? `<span class="mem-entry-agent">[${escapeHtml(agent)}]</span> ` : ''}${escapeHtml(content.slice(0, 150))}
      </div>`;
  }).join('');
}

/** Parse files section */
function parseMemoryFiles(md) {
  if (!md || md.includes('(No files') || md.includes('(none)')) {
    return '<div class="empty-state">No files tracked</div>';
  }
  const lines = md.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  return lines.slice(0, 30).map(line => {
    const file = line.replace(/^[-*]\s*/, '').replace(/`/g, '').trim();
    return `<div class="mem-file-row">${escapeHtml(file)}</div>`;
  }).join('');
}

/** Toggle a memory section */
function toggleMemorySection(sectionId) {
  const section = $(`#mem-section-${sectionId}`);
  if (section) section.classList.toggle('collapsed');
}

/** Open raw memory file in a modal */
async function openMemoryRaw() {
  if (!memoryState.contextId) {
    showToast('⚠️ No active context', 'info');
    return;
  }
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/memory/${encodeURIComponent(memoryState.contextId)}/raw`);
    const raw = await response.text();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `
      <div class="modal modal-memory-raw">
        <div class="modal-header">
          <span>🗂️ Shared Memory — Raw</span>
          <button class="btn-icon-sm" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <pre>${escapeHtml(raw)}</pre>
        </div>
      </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Failed to load raw memory', 'error');
  }
}

// Listen for memory updates from server
if (state.socket) {
  state.socket.on('memory_update', (data) => {
    if (data.contextId === memoryState.contextId) {
      memoryState.data = data.memory;
      renderMemory(data.memory);
    }
  });
}