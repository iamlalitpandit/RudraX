/**
 * RudraX Web UI — Agency Edition v4.1.0 🔱
 * Rudraksh Theme · Incremental Rendering · Socket.IO Streaming
 * Build · Break · Deploy · Orchestrate
 * By Lalit Pandit
 */

// ═══ Config ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  API_BASE: window.location.origin,
  POLL_INTERVAL: 2000,
  RECONNECT_INTERVAL: 3000,
  MAX_RETRIES: 5,
  STREAM_DEBOUNCE: 32,   // ~30fps for smooth streaming
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  APP_VERSION: 'v4.1.0',
};

// ═══ Command Registry ═════════════════════════════════════════════════════════

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

// ═══ State ═════════════════════════════════════════════════════════════════════

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
  authToken: localStorage.getItem('rudrax_token') || null,
  agentBusy: false,     // Whether agent is currently processing
  pendingSteerMessage: null, // Queued steer/followUp message

  // Agency state
  agents: [],
  agentCategories: {},
  agentFilter: '',
  agentCategoryFilter: 'all',
  activeAgent: null,

  // Stuck-state watchdog
  _lastStateUpdate: Date.now(),
  _watchdogTimer: null,
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
  orchestratorOpen: true,  // Default: permanently open
  orchestratorMinimized: false,

  // Terminal state
  terminalOpen: false,
  terminal: null,
  terminalFit: null,

  // Agent Activity
  activityLog: [],
  activityMinimized: false,
  activityExpanded: false,

  // File upload
  attachedFiles: [],      // { name, size, data (base64), type }

  // Current running task description
  currentTask: '',

  // Rendering state
  _renderedIds: new Set(),
  _streamTimers: {},
  _streamingElementId: null,
  _lastStreamUpdate: 0,
  _streamAccumulator: '',
};

// ═══ DOM Helpers ═════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ═══ Initialization ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Check auth first — if no valid token, show login
  if (!checkAuth()) return;

  initTheme();
  initClock();
  initISTClock();
  initKeyboardShortcuts();
  initSocketIO();
  restoreSession();
  loadAgents();
  loadSquads();
  initDragDrop();
  adjustTextareaHeight($('#chat-input'));
  updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
  updateStatusBar('idle');
});

// ═══ Auth — Login / Logout / Password Change ══════════════════════════════

function getAuthHeaders() {
  return state.authToken
    ? { 'Authorization': `Bearer ${state.authToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function checkAuth() {
  if (!state.authToken) {
    showLogin();
    return false;
  }
  // Quick validation: try a lightweight API call
  fetch(`${CONFIG.API_BASE}/api/health`)
    .then(r => r.json())
    .then(data => {
      // Only show app if token is still valid (not cleared by connect_error)
      if (data.ok && state.authToken) showApp();
    })
    .catch(() => {
      if (state.authToken) showApp();
    });
  return true;
}

function showLogin() {
  const overlay = $('#login-overlay');
  const app = $('#app-container');
  if (overlay) overlay.style.display = 'flex';
  if (app) app.style.display = 'none';
  // Clear fields and error
  const userField = $('#login-username');
  const passField = $('#login-password');
  const errEl = $('#login-error');
  if (userField) { userField.value = ''; userField.focus(); }
  if (passField) passField.value = '';
  if (errEl) errEl.classList.add('hidden');
}

function showApp() {
  const overlay = $('#login-overlay');
  const app = $('#app-container');
  if (overlay) overlay.style.display = 'none';
  if (app) app.style.display = '';
  startPolling();
}

async function handleLogin(event) {
  if (event && event.preventDefault) event.preventDefault();
  const username = $('#login-username')?.value?.trim() || '';
  const password = $('#login-password')?.value || '';
  const errorEl = $('#login-error');
  const submitBtn = $('#login-submit-btn');
  const spinner = $('#login-spinner');
  const btnText = submitBtn?.querySelector('.login-btn-text');

  if (!username || !password) {
    if (errorEl) { errorEl.textContent = 'Both username and password are required'; errorEl.classList.remove('hidden'); }
    return;
  }

  // Show spinner
  if (submitBtn) submitBtn.disabled = true;
  if (errorEl) errorEl.classList.add('hidden');
  if (spinner) spinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Signing in...';

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Invalid credentials');
    }

    const data = await res.json();
    state.authToken = data.token;
    localStorage.setItem('rudrax_token', data.token);

    // Clean up any previously initialized state
    if (state.socket) { state.socket.disconnect(); state.socket = null; }
    state.logs = [];
    state.logVersion = 0;
    state._renderedIds.clear();
    const history = $('#chat-history');
    if (history) history.innerHTML = '';

    // Re-initialize everything now that we're authenticated
    initTheme();
    initClock();
    initISTClock();
    initKeyboardShortcuts();
    initSocketIO();
    restoreSession();
    loadAgents();
    loadSquads();
    initDragDrop();
    adjustTextareaHeight($('#chat-input'));
    updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    updateStatusBar('idle');

    // Show app AFTER init
    showApp();
  } catch (err) {
    if (errorEl) { errorEl.textContent = err.message; errorEl.classList.remove('hidden'); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = '🔐 Sign In';
  }
}

async function handleChangePassword() {
  const currentPassword = $('#settings-current-password')?.value || '';
  const newPassword = $('#settings-new-password')?.value || '';
  const confirmPassword = $('#settings-confirm-password')?.value || '';
  const errorEl = $('#password-change-error');
  const successEl = $('#password-change-success');
  const spinner = $('#password-change-spinner');
  const btnText = $('#password-change-btn-text');

  if (errorEl) errorEl.classList.add('hidden');
  if (successEl) successEl.classList.add('hidden');

  if (!currentPassword || !newPassword || !confirmPassword) {
    if (errorEl) { errorEl.textContent = 'All fields are required'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (newPassword !== confirmPassword) {
    if (errorEl) { errorEl.textContent = 'New passwords do not match'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (newPassword.length < 4) {
    if (errorEl) { errorEl.textContent = 'New password must be at least 4 characters'; errorEl.classList.remove('hidden'); }
    return;
  }

  if (spinner) spinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Changing...';

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to change password');
    }

    const data = await res.json();
    if (successEl) { successEl.textContent = '✅ ' + data.message; successEl.classList.remove('hidden'); }

    // Clear fields
    ['settings-current-password', 'settings-new-password', 'settings-confirm-password'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.value = '';
    });
  } catch (err) {
    if (errorEl) { errorEl.textContent = err.message; errorEl.classList.remove('hidden'); }
  } finally {
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = '💾 Change Password';
  }
}

function handleLogout() {
  localStorage.removeItem('rudrax_token');
  state.authToken = null;
  closeSettings();
  // Stop polling
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  // Reset state
  state.context = null;
  state.logs = [];
  state.logVersion = 0;
  state.running = false;
  state.agentBusy = false;
  if (state.socket) { state.socket.disconnect(); state.socket = null; }
  showLogin();
}

// ═══ Socket.IO — Primary real-time channel ═════════════════════════════════════

function initSocketIO() {
  state.socket = io(CONFIG.API_BASE, {
    auth: { token: state.authToken },
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

  state.socket.on('connect_error', (err) => {
    console.error('[RudraX] Socket auth error:', err.message);
    if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
      handleLogout();
    }
  });

  state.socket.on('disconnect', () => {
    console.log('[RudraX] Socket disconnected');
    state.connected = false;
    updateConnectionStatus('disconnected');
    updateStatusBar('idle');
  });

  state.socket.on('state_update', (snapshot) => {
    applySnapshot(snapshot);
  });

  state.socket.on('orchestrator_update', (orchState) => {
    applyOrchestratorUpdate(orchState);
  });

  state.socket.on('memory_update', (data) => {
    if (data.contextId === memoryState.contextId) {
      memoryState.data = data.memory;
      renderMemory(data.memory);
    }
  });

  // Agent Activity Events
  state.socket.on('agent_activity', (event) => {
    addAgentActivity(event);
  });

  // Terminal events
  state.socket.on('terminal_data', (data) => {
    if (state.terminal) state.terminal.write(data);
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

// ═══ Fallback Polling ════════════════════════════════════════════════════════

function startPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(poll, CONFIG.POLL_INTERVAL);
}

async function poll() {
  if (state.socket?.connected) return;
  try {
    const response = await fetch(`${CONFIG.API_BASE}/poll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        context: state.context,
        log_from: state.logVersion,
        timezone: 'Asia/Kolkata',
      }),
    });
    if (!response.ok) {
      if (response.status === 401) { handleLogout(); return; }
      throw new Error(`Poll failed: ${response.status}`);
    }
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

// ═══ Apply State Snapshot — INCREMENTAL DOM UPDATES ═════════════════════════

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

  // Reset logs if GUID changed (new context)
  if (snapshot.log_guid && snapshot.log_guid !== state.logGuid) {
    state.logGuid = snapshot.log_guid;
    state.logVersion = 0;
    state.logs = [];
    state._renderedIds.clear();
    state._streamingElementId = null;
    clearMessages();
  }

  if (snapshot.log_version !== undefined && snapshot.log_version > state.logVersion) {
    const newLogs = snapshot.logs || [];
    applyLogUpdates(newLogs);
    state.logVersion = snapshot.log_version;
  }

  if (snapshot.log_progress !== undefined) {
    updateProgress(snapshot.log_progress, snapshot.log_progress_active);
  }

  const wasRunning = state.running;
  state.running = snapshot.log_progress_active || false;
  state.agentBusy = state.running;
  state.paused = snapshot.paused || false;
  state._lastStateUpdate = Date.now();

  // Update status bar based on state
  if (state.running && !wasRunning) {
    updateStatusBar('working');
    updateTopStatusBar('working', state.currentTask || 'Processing your request...');
  } else if (!state.running && wasRunning) {
    updateStatusBar('completed');
    updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    // Reset after a moment
    setTimeout(() => {
      if (!state.running) updateStatusBar('idle');
    }, 3000);
  }

  updateSendButton();
  updateSteerButton();
  resetWatchdog();

  if (state.context) hideWelcome();
}

/**
 * Apply log updates incrementally — surgically update only what changed.
 * This prevents flickering by never re-rendering unchanged content.
 */
function applyLogUpdates(newLogs) {
  const container = $('#chat-history');
  if (!container) return;

  let needsScroll = false;

  for (const log of newLogs) {
    const existingIdx = state.logs.findIndex(l => l.id === log.id);
    const isUpdate = log._update === true;
    const isFinal = log._final === true;
    const isStreaming = log._streaming === true;

    if (isUpdate || isFinal) {
      if (existingIdx >= 0) {
        const existing = state.logs[existingIdx];
        // Skip if content hasn't changed (prevents unnecessary re-renders)
        if (log.content === existing.content) continue;

        // Update state
        state.logs[existingIdx] = {
          ...existing, ...log,
          _update: undefined, _final: undefined, _streaming: undefined,
        };

        if (log.content != null) {
          const textEl = document.getElementById(`msg-text-${existing.id}`);
          if (textEl) {
            if (isFinal) {
              // Final: render complete content, remove streaming cursor
              textEl.innerHTML = renderMarkdown(log.content);
              const domEl = document.getElementById(`msg-${existing.id}`);
              if (domEl) domEl.classList.remove('streaming');
            } else {
              // Streaming update: smooth debounced via requestAnimationFrame
              state._streamAccumulator = log.content;
              state._streamingElementId = existing.id;
              scheduleStreamUpdate(textEl, existing.id);
              // Keep streaming cursor visible
              const domEl = document.getElementById(`msg-${existing.id}`);
              if (domEl) domEl.classList.add('streaming');
            }
            if (state.autoScroll) scrollToBottom();
          }
        }
      }
    } else {
      // New entry
      if (existingIdx >= 0) {
        // Replace
        state.logs[existingIdx] = { ...log };
        const domEl = document.getElementById(`msg-${log.id}`);
        if (domEl) {
          domEl.outerHTML = renderLogMessage(state.logs[existingIdx]);
        }
      } else {
        // Dedup check for user messages
        if (log.type === 'user') {
          const dupeIdx = state.logs.findIndex(l =>
            l.type === 'user' && l.content === log.content && l.id !== log.id
          );
          if (dupeIdx >= 0) {
            const oldId = state.logs[dupeIdx].id;
            state.logs[dupeIdx].id = log.id;
            const domEl = document.getElementById(`msg-${oldId}`);
            if (domEl) domEl.id = `msg-${log.id}`;
            continue;
          }
        }
        // Append
        state.logs.push({ ...log });
        appendMessage(log, container);
        needsScroll = true;
      }
    }

    state._renderedIds.add(log.id);
  }

  if (needsScroll && state.autoScroll) {
    scrollToBottom();
  }

  // Log agent activity from new logs
  for (const log of newLogs) {
    if (log.type === 'tool' || log.type === 'tool_result') {
      addAgentActivity({
        ts: log.timestamp || Date.now(),
        type: log.type,
        agent: log.kvps?.tool_name || 'system',
        content: log.content || log.heading || '',
        action: log.type === 'tool' ? 'executing' : 'result',
      });
    } else if (log.type === 'response' && log._final) {
      addAgentActivity({
        ts: log.timestamp || Date.now(),
        type: 'completed',
        agent: 'RudraX',
        content: 'Response sent',
        action: 'completed',
      });
    }
  }
}

/**
 * Schedule a smooth streaming content update using requestAnimationFrame.
 * This debounces rapid updates and prevents visual flicker.
 */
function scheduleStreamUpdate(textEl, msgId) {
  const now = performance.now();
  if (now - state._lastStreamUpdate < CONFIG.STREAM_DEBOUNCE) {
    // Skip this update, we'll catch the next one
    return;
  }
  state._lastStreamUpdate = now;

  requestAnimationFrame(() => {
    const content = state._streamAccumulator;
    if (!content) return;

    textEl.innerHTML = renderMarkdown(content);
    const parentMsg = textEl.closest('.message');
    if (parentMsg) {
      parentMsg.classList.add('streaming');
    }

    if (state.autoScroll) {
      scrollToBottom();
    }
  });
}

/** Append a single message to the DOM without re-rendering everything */
function appendMessage(log, container) {
  const div = document.createElement('div');
  div.innerHTML = renderLogMessage(log);
  const msgEl = div.firstElementChild;
  if (msgEl) {
    msgEl.style.animation = 'fadeIn 0.15s ease';
    container.appendChild(msgEl);
  }
}

function renderMessages() {
  const container = $('#chat-history');
  if (!container) return;
  container.innerHTML = state.logs.map(log => renderLogMessage(log)).join('');
  state._renderedIds = new Set(state.logs.map(l => l.id));
  if (state.autoScroll) scrollToBottom();
}

function clearMessages() {
  const container = $('#chat-history');
  if (container) container.innerHTML = '';
  state._renderedIds.clear();
  state._streamingElementId = null;
}

// ═══ Orchestrator Updates ═══════════════════════════════════════════════════

function applyOrchestratorUpdate(orchState) {
  state.orchestrator = { ...state.orchestrator, ...orchState };
  const settingsMode = $('#orch-settings-mode');
  if (settingsMode) settingsMode.value = orchState.mode || 'auto';
  updateActiveAgentBadge(orchState.activeAgent);
  updateSquadBadge(orchState.activeSquad, orchState.activeSquadAgents);
  renderOrchestratorPanel();
}

// ═══ Context Management ═════════════════════════════════════════════════════

async function newContext() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/contexts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(`Create context failed: ${response.status}`);
    const data = await response.json();
    state.context = data.context;
    state.logs = [];
    state.logVersion = 0;
    state.logGuid = '';
    state._renderedIds.clear();
    state._streamingElementId = null;
    state.currentTask = '';
    hideWelcome();
    clearMessages();
    updateChatTitle(data.name || 'New Chat');
    updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    updateStatusBar('idle');
    renderContextsList();
    if (state.socket?.connected) {
      state.socket.emit('state_request', { context: state.context });
    }
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
  state._renderedIds.clear();
  state._streamingElementId = null;
  state.currentTask = '';
  hideWelcome();
  clearMessages();
  updateChatTitle(getContextName(contextId));
  updateStatusBar('idle');
  updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
  localStorage.setItem('rudrax-last-context', contextId);
  if (state.socket?.connected) {
    state.socket.emit('state_request', { context: state.context });
  }
  await poll();
  await loadMemory(contextId);
}

async function deleteContext(contextId, event) {
  event?.stopPropagation();
  try {
    await fetch(`${CONFIG.API_BASE}/api/contexts/${contextId}`, { method: 'DELETE', headers: getAuthHeaders() });
    state.contexts = state.contexts.filter(c => c.id !== contextId);
    if (state.context === contextId) {
      state.context = null;
      state.logs = [];
      state._renderedIds.clear();
      showWelcome();
      updateStatusBar('idle');
      updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    }
    renderContextsList();
  } catch (err) {
    console.error('[RudraX] Failed to delete context:', err);
  }
}

// ═══ Agent Loading ══════════════════════════════════════════════════════════

async function loadAgents() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/skills`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to load agents');
    state.agents = await response.json();
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
    const list = $('#agents-list');
    if (list) list.innerHTML = '<div class="empty-state">Failed to load agents</div>';
  }
}

async function loadSquads() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/squads`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to load squads');
    state.squads = await response.json();
    renderSquadsList();
  } catch (err) {
    console.error('[RudraX] Failed to load squads:', err);
    const list = $('#squads-list');
    if (list) list.innerHTML = '<div class="empty-state">Failed to load squads</div>';
  }
}

// ═══ Rendering: Agents ══════════════════════════════════════════════════════

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
  if (state.agentCategoryFilter !== 'all') {
    agents = agents.filter(a => a.category === state.agentCategoryFilter);
  }
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

// ═══ Rendering: Squads ══════════════════════════════════════════════════════

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

// ═══ Agent/Squad Actions ════════════════════════════════════════════════════

async function activateAgent(skillName) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/agents/${skillName}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ context: state.context }),
    });
    const data = await response.json();
    if (data.ok) {
      state.activeAgent = skillName;
      updateActiveAgentBadge(skillName);
      renderAgentsList();
      showToast(`✅ Agent ${skillName} activated`, 'success');
      addAgentActivity({ ts: Date.now(), type: 'system', agent: skillName, content: 'Agent activated', action: 'activate' });
    }
  } catch (err) {
    showToast('Failed to activate agent', 'error');
  }
}

async function deactivateAgent() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/agents/deactivate`, { method: 'POST', headers: getAuthHeaders() });
    state.activeAgent = null;
    updateActiveAgentBadge(null);
    renderAgentsList();
    showToast('Agent deactivated', 'info');
  } catch (err) { /* Ignore */ }
}

async function activateSquad(squadName) {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/squads/${squadName}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    await fetch(`${CONFIG.API_BASE}/api/squads/deactivate`, { method: 'POST', headers: getAuthHeaders() });
    state.activeSquad = null;
    state.activeSquadAgents = [];
    updateSquadBadge(null, []);
    renderSquadsList();
    showToast('Squad deactivated', 'info');
  } catch (err) { /* Ignore */ }
}

// ═══ Agent/Squad Badge Updates ═════════════════════════════════════════════

function updateActiveAgentBadge(agentName) {
  const badge = $('#active-agent-badge');
  if (!badge) return;
  if (agentName) {
    const agent = state.agents.find(a => a.skillName === agentName);
    const emoji = $('#badge-emoji');
    const name = $('#badge-name');
    if (emoji) emoji.textContent = agent?.emoji || '🤖';
    if (name) name.textContent = agent?.name || agentName;
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
    const emoji = $('#squad-badge-emoji');
    const name = $('#squad-badge-name');
    const count = $('#squad-badge-count');
    if (emoji) emoji.textContent = squad.emoji;
    if (name) name.textContent = squad.name.replace(' Squad', '');
    if (count) count.textContent = `${agents.length} agents`;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ═══ Status Bar Management ════════════════════════════════════════════════

function updateTopStatusBar(status, message) {
  const bar = $('#top-status-bar');
  const icon = $('#top-status-icon');
  const text = $('#top-status-text');
  if (!bar) return;

  bar.className = '';
  if (status === 'working') {
    bar.classList.add('running');
    if (icon) icon.textContent = '⚡';
  } else if (status === 'error') {
    bar.classList.add('error');
    if (icon) icon.textContent = '⚠️';
  } else {
    if (icon) icon.textContent = '💤';
  }
  if (text) text.textContent = message || 'Ready for your command';
}

function updateStatusBar(status) {
  const bar = $('#status-indicator-bar');
  const label = $('#status-label');
  const detail = $('#status-detail');
  if (!bar || !label) return;

  bar.className = '';
  bar.classList.add(status === 'error' ? 'error-state' : status);

  switch (status) {
    case 'working':
      label.textContent = 'WORKING';
      if (detail) detail.textContent = state.currentTask || 'Processing...';
      break;
    case 'error':
      label.textContent = 'ERROR';
      if (detail) detail.textContent = 'An error occurred';
      break;
    case 'completed':
      label.textContent = 'COMPLETED';
      if (detail) detail.textContent = 'Task finished successfully';
      break;
    default:
      label.textContent = 'IDLE';
      if (detail) detail.textContent = 'Waiting for input';
      break;
  }
}

/** Update steer button visibility */
function updateSteerButton() {
  const btn = $('#btn-steer');
  if (btn) {
    btn.classList.toggle('hidden', !state.running && !state.agentBusy);
  }
}

// ═══ Orchestrator Panel ════════════════════════════════════════════════════

function toggleOrchMinimize() {
  state.orchestratorMinimized = !state.orchestratorMinimized;
  const panel = $('#orchestrator-panel');
  const btn = $('#btn-orch-minimize');

  if (state.orchestratorMinimized) {
    panel?.classList.add('minimized');
    if (btn) { btn.textContent = '+'; btn.title = 'Expand'; }
  } else {
    panel?.classList.remove('minimized');
    if (btn) { btn.textContent = '−'; btn.title = 'Minimize'; }
  }
}

function renderOrchestratorPanel() {
  const plan = state.orchestrator.activePlan;
  const noPlan = $('#orch-no-plan');
  const activePlan = $('#orch-active-plan');
  const agentSection = $('#orch-agent-section');

  if (!plan) {
    if (noPlan) noPlan.style.display = '';
    if (activePlan) activePlan.classList.add('hidden');
    // Update top status accordingly
    if (state.running) {
      updateTopStatusBar('working', state.currentTask || 'Processing...');
    }
  } else {
    if (noPlan) noPlan.style.display = 'none';
    if (activePlan) {
      activePlan.classList.remove('hidden');
      const statusEl = $('#orch-plan-status');
      const taskEl = $('#orch-plan-task');
      if (statusEl) {
        statusEl.textContent = plan.status?.toUpperCase() || 'PLANNING';
        statusEl.className = 'orch-plan-status';
        if (plan.status === 'completed') statusEl.classList.add('completed');
        else if (plan.status === 'stopped') statusEl.classList.add('stopped');
        else if (plan.status === 'running') statusEl.classList.add('running');
        else statusEl.classList.add('planning');
      }
      if (taskEl) taskEl.textContent = plan.task || '';

      // Update top status bar with plan task
      if (plan.status === 'running' || plan.status === 'planning') {
        state.currentTask = plan.task || '';
        updateTopStatusBar('working', `Orchestrating: ${plan.task || 'Processing...'}`);
      } else if (plan.status === 'completed') {
        updateTopStatusBar('idle', `Completed: ${plan.task || ''}`);
      }

      renderOrchLanes(plan.lanes || []);
    }
  }

  if (state.orchestrator.activeAgent && agentSection) {
    agentSection.style.display = '';
    const agent = state.agents.find(a => a.skillName === state.orchestrator.activeAgent);
    const card = $('#orch-active-agent-card');
    if (card) {
      card.innerHTML = `
        <span class="orch-agent-emoji">${agent?.emoji || '🤖'}</span>
        <span class="orch-agent-name">${agent?.name || state.orchestrator.activeAgent}</span>
      `;
    }
  } else if (agentSection) {
    agentSection.style.display = 'none';
  }
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
            ${task.agent ? `<span class="orch-task-agent">${task.agent.split('-').pop()}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function getLaneStatusText(lane) {
  if (!lane.tasks || lane.tasks.length === 0) return '';
  const completed = lane.tasks.filter(t => t.status === 'completed').length;
  const running = lane.tasks.filter(t => t.status === 'running').length;
  if (running > 0) return `🔄 ${completed}/${lane.tasks.length} done`;
  if (completed === lane.tasks.length) return `✅ ${completed}/${lane.tasks.length} done`;
  return `${completed}/${lane.tasks.length} done`;
}

function renderOrchTaskLog() {
  const container = $('#orch-task-log');
  if (!container) return;
  const history = state.orchestrator.taskHistory || [];
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:8px;font-size:11px">No tasks completed yet</div>';
    return;
  }
  container.innerHTML = history.slice(-20).reverse().map(h => `
    <div class="orch-log-entry ${h.success ? 'success' : h.error ? 'error' : ''}">
      <span>${formatISTTime(h.completedAt || Date.now())}</span>
      <span>${h.description || 'Task completed'}</span>
    </div>
  `).join('');
}

// ═══ Orchestration Actions ══════════════════════════════════════════════════

async function startOrchestration(task) {
  if (!task || !task.trim()) {
    showToast('⚠️ Please enter a task description', 'warning');
    return;
  }
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/orchestrator/plan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ task: task.trim(), context: state.context }),
    });
    const data = await response.json();
    if (data.ok) {
      state.orchestrator.activePlan = data.plan;
      state.currentTask = task.trim();
      updateStatusBar('working');
      updateTopStatusBar('working', `Orchestrating: ${task.trim()}`);
      renderOrchestratorPanel();
      showToast('🧠 Orchestration plan created', 'success');
      addAgentActivity({ ts: Date.now(), type: 'system', agent: 'Orchestrator', content: `Plan created: ${task.slice(0, 80)}`, action: 'plan' });
    } else {
      showToast(data.error || 'Failed to create plan', 'error');
    }
  } catch (err) {
    showToast('Failed to start orchestration', 'error');
  }
}

async function stopOrchestration() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/orchestrator/stop`, { method: 'POST', headers: getAuthHeaders() });
    if (state.orchestrator.activePlan) state.orchestrator.activePlan.status = 'stopped';
    renderOrchestratorPanel();
    updateStatusBar('idle');
    updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    showToast('⏹ Orchestration stopped', 'info');
  } catch (err) { /* Ignore */ }
}

async function resetOrchestrator() {
  try {
    await fetch(`${CONFIG.API_BASE}/api/orchestrator/reset`, { method: 'POST', headers: getAuthHeaders() });
    state.orchestrator.activePlan = null;
    state.orchestrator.activeAgent = null;
    state.orchestrator.taskHistory = [];
    state.currentTask = '';
    updateStatusBar('idle');
    updateTopStatusBar('idle', '🔱 RudraX-Chief of Staff — Awaiting command');
    renderOrchestratorPanel();
    showToast('↺ Orchestrator reset', 'info');
  } catch (err) { /* Ignore */ }
}

function setOrchMode(mode) {
  state.orchestrator.mode = mode;
  fetch(`${CONFIG.API_BASE}/api/orchestrator/mode`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ mode }),
  });
  const autoBtn = $('#orch-mode-auto');
  const manualBtn = $('#orch-mode-manual');
  if (autoBtn) autoBtn.classList.toggle('active', mode === 'auto');
  if (manualBtn) manualBtn.classList.toggle('active', mode === 'manual');
}

// ═══ Agent Activity Terminal ════════════════════════════════════════════════

function toggleActivityExpand() {
  const terminal = $('#agent-activity-terminal');
  if (!terminal) return;

  if (state.activityExpanded) {
    terminal.classList.remove('expanded');
    state.activityExpanded = false;
    const btn = $('#btn-expand-activity');
    if (btn) btn.textContent = '⤢';
  } else {
    terminal.classList.add('expanded');
    state.activityExpanded = true;
    const btn = $('#btn-expand-activity');
    if (btn) btn.textContent = '⤡';
  }
}

function addAgentActivity(event) {
  state.activityLog.push(event);
  if (state.activityLog.length > 500) {
    state.activityLog = state.activityLog.slice(-500);
  }

  // Render to DOM — terminal style
  const body = $('#agent-activity-body');
  if (!body) return;

  const ts = event.ts ? formatISTTime(event.ts) : '';
  const agent = escapeHtml(event.agent || 'system');
  const content = escapeHtml((event.content || '').slice(0, 200));
  const action = escapeHtml(event.action || event.type || '');

  let lineClass = event.type === 'error' ? 'error' :
    event.type === 'completed' ? 'completed' :
    event.type === 'tool' ? 'tool' :
    event.type === 'user' ? 'user-message' : '';

  const line = document.createElement('div');
  line.className = `activity-line ${lineClass}`;
  line.innerHTML = `<span class="ts">${ts}</span><span class="agent-tag">[${agent}]</span> <span class="action-tag">${action}</span> <span class="content-txt">${content}</span>`;
  body.appendChild(line);

  // Auto-scroll to bottom
  body.scrollTop = body.scrollHeight;

  // Update terminal header blink indicator
  const blinkEl = document.querySelector('.activity-terminal-title .blink');
  if (blinkEl && event.type !== 'idle') {
    blinkEl.style.color = event.type === 'error' ? 'var(--sacred-red-bright)' : 'var(--brand-success)';
  }
}

function clearAgentActivity() {
  state.activityLog = [];
  const body = $('#agent-activity-body');
  if (body) body.innerHTML = '';
}

// ═══ File Upload ─────────────────────────────────────────────────────────══

function initDragDrop() {
  const body = document.body;
  const dropZone = $('#file-drop-zone');

  body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZone) dropZone.classList.remove('hidden');
  });

  body.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null && dropZone) {
      dropZone.classList.add('hidden');
    }
  });

  body.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZone) dropZone.classList.add('hidden');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  });
}

function triggerFileUpload() {
  const input = $('#file-input');
  if (input) input.click();
}

async function handleFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    await processFiles(files);
    event.target.value = ''; // Reset so same file can be re-selected
  }
}

async function processFiles(fileList) {
  for (const file of fileList) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      showToast(`⚠️ ${file.name} exceeds 10MB limit`, 'warning');
      continue;
    }

    // Check if already attached
    if (state.attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
      continue;
    }

    // Read file as base64
    const reader = new FileReader();
    const data = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    state.attachedFiles.push({
      name: file.name,
      size: file.size,
      type: file.type,
      data: data,
    });

    addAgentActivity({
      ts: Date.now(),
      type: 'system',
      agent: 'Upload',
      content: `File attached: ${file.name} (${formatFileSize(file.size)})`,
      action: 'attach',
    });
  }

  renderAttachedFiles();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function removeAttachedFile(index) {
  state.attachedFiles.splice(index, 1);
  renderAttachedFiles();
}

function renderAttachedFiles() {
  const container = $('#attached-files');
  const countBadge = $('#upload-count');

  if (!container) return;

  if (state.attachedFiles.length === 0) {
    container.style.display = 'none';
    if (countBadge) countBadge.classList.add('hidden');
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = state.attachedFiles.map((file, i) => `
    <span class="attached-file-chip">
      📄 ${escapeHtml(file.name)}
      <span class="remove-file" onclick="removeAttachedFile(${i})">✕</span>
    </span>
  `).join('');

  if (countBadge) {
    countBadge.classList.remove('hidden');
    countBadge.textContent = `${state.attachedFiles.length} file(s)`;
  }
}

// ═══ Steering / Follow-Up (for "Agent already processing" error) ═══════════

function showSteerOptions() {
  const input = $('#chat-input');
  const msg = input?.value?.trim();
  if (!msg) {
    showToast('⚠️ Type a message first', 'warning');
    return;
  }
  state.pendingSteerMessage = msg;
  const panel = $('#steer-panel');
  if (panel) panel.classList.remove('hidden');
}

function closeSteerPanel() {
  const panel = $('#steer-panel');
  if (panel) panel.classList.add('hidden');
  state.pendingSteerMessage = null;
}

async function sendSteerMessage(mode) {
  const msg = state.pendingSteerMessage;
  if (!msg) return;

  closeSteerPanel();

  const input = $('#chat-input');
  if (input) input.value = '';

  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/steer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text: msg,
        context: state.context,
        mode: mode, // 'followUp' | 'steer' | 'stop'
      }),
    });
    const data = await response.json();
    if (data.ok) {
      const modeLabels = { followUp: 'Follow-up queued', steer: 'Steering applied', stop: 'Task stopped' };
      showToast(`🎯 ${modeLabels[mode] || 'Steering sent'}`, 'success');
      addAgentActivity({
        ts: Date.now(),
        type: 'system',
        agent: 'You',
        content: `${modeLabels[mode] || mode}: ${msg.slice(0, 80)}`,
        action: mode,
      });
    } else {
      showToast(data.error || 'Failed to send steering message', 'error');
    }
  } catch (err) {
    showToast('Failed to send steering message', 'error');
  }
}

// ═══ Message Sending ════════════════════════════════════════════════════════

async function sendMessage() {
  const input = $('#chat-input');
  const text = input?.value?.trim();
  const hasFiles = state.attachedFiles.length > 0;

  if (!text && !hasFiles) return;

  // Prevent sending while agent is already processing
  if (state.running || state.agentBusy) {
    state.pendingSteerMessage = text;
    showSteerOptions();
    return;
  }

  if (!state.context) {
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/contexts`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  const finalText = text || '(Please analyze the attached files)';
  input.value = '';
  adjustTextareaHeight(input);
  hideCommandSuggestions();

  // Handle file attachments — prepend to message
  let messageContent = finalText;
  if (hasFiles) {
    const fileNames = state.attachedFiles.map(f => f.name).join(', ');
    messageContent = `${finalText}\n\n[Attached files: ${fileNames}]`;
  }

  // Add user message locally
  const userMsg = {
    no: state.logs.length + 1,
    id: generateGuid(),
    type: 'user',
    content: messageContent,
    heading: '',
    kvps: {},
    timestamp: Date.now(),
  };
  state.logs.push(userMsg);
  state._renderedIds.add(userMsg.id);
  appendMessage(userMsg, $('#chat-history'));
  scrollToBottom();

  // Parse orchestration commands
  if (text.startsWith('/orchestrate ')) {
    const parts = text.slice('/orchestrate '.length);
    const modeMatch = parts.match(/^(auto|manual)\s+(.+)/);
    if (modeMatch) {
      startOrchestration(modeMatch[2]);
    } else {
      startOrchestration(parts);
    }
  }

  state.running = true;
  state.agentBusy = true;
  state.currentTask = text.slice(0, 100);

  updateSendButton();
  updateSteerButton();
  showProgress('Processing...');
  updateStatusBar('working');
  updateTopStatusBar('working', text.slice(0, 80) || 'Processing attachments...');

  addAgentActivity({ ts: Date.now(), type: 'user', agent: 'You', content: text.slice(0, 100), action: 'message' });

  // Send files if attached
  let fileData = null;
  if (hasFiles) {
    fileData = state.attachedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      data: f.data,
    }));
    state.attachedFiles = [];
    renderAttachedFiles();
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE}/message_async`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text: messageContent,
        context: state.context,
        message_id: userMsg.id,
        files: fileData,
      }),
    });
    if (!response.ok) {
      if (response.status === 401) { handleLogout(); throw new Error('Session expired. Please login again.'); }
      const errData = await response.json().catch(() => ({}));
      if (errData.code === 'ALREADY_PROCESSING' || (errData.error && errData.error.includes('already processing'))) {
        // Show steer panel automatically
        state.pendingSteerMessage = text;
        showSteerOptions();
        throw new Error('Agent is busy — use steering options below');
      }
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

    if (!err.message.includes('Agent is busy')) {
      state.logs = state.logs.filter(l => l.id !== userMsg.id);
      const domEl = document.getElementById(`msg-${userMsg.id}`);
      if (domEl) domEl.remove();
    }

    state.running = false;
    state.agentBusy = false;
    updateSendButton();
    updateSteerButton();
    hideProgress();
    updateStatusBar('error');
  }
}

// ═══ Quick Actions ══════════════════════════════════════════════════════════

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
    if (prefix?.startsWith('/')) showCommandSuggestions(prefix);
  }
}

// ═══ Command Suggestions ═══════════════════════════════════════════════════

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
  if (matches.length === 0) { hideCommandSuggestions(); return; }

  let agentSuggestions = [];
  if (prefix.startsWith('/dispatch') || prefix.startsWith('/skill:')) {
    agentSuggestions = state.agents
      .filter(a => a.skillName.toLowerCase().includes(prefix.split(' ').pop()?.toLowerCase() || ''))
      .slice(0, 5)
      .map(a => ({ name: `/dispatch ${a.skillName}`, desc: a.description.substring(0, 60), icon: a.emoji }));
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

// ═══ Message Rendering ══════════════════════════════════════════════════════

function renderLogMessage(log) {
  const time = log.timestamp ? formatISTTime(log.timestamp) : '';
  const isStreaming = log._streaming ? ' streaming' : '';

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
        <div class="message agent${isStreaming}" id="msg-${log.id}">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            ${log.heading ? `<div class="message-heading">${escapeHtml(log.heading)}</div>` : ''}
            ${log.content ? `<div class="message-text" id="msg-text-${log.id}">${renderMarkdown(log.content)}</div>` : ''}
          </div>
        </div>`;

    case 'response':
      const senderLabel = log.agentName
        ? (log.squadName ? `${log.agentName} (${log.squadName})` : log.agentName)
        : 'RudraX-Chief of Staff';
      return `
        <div class="message response${isStreaming}" id="msg-${log.id}">
          <div class="message-avatar">${log.agentName ? '🤖' : '🔥'}</div>
          <div class="message-content">
            <div class="message-meta">
              <span class="message-sender">${escapeHtml(senderLabel)}</span>
              <span class="message-time">${time}</span>
            </div>
            <div class="message-text" id="msg-text-${log.id}">${renderMarkdown(log.content || '')}</div>
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
        <div class="message agent${isStreaming}" id="msg-${log.id}">
          <div class="message-content">
            <div class="message-text" id="msg-text-${log.id}">${renderMarkdown(log.content || '')}</div>
          </div>
        </div>`;
  }
}

// ═══ Context List Rendering ════════════════════════════════════════════════

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
        ✕
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

// ═══ Sidebar Tab Switching ═════════════════════════════════════════════════

function switchSidebarTab(tabName) {
  $$('.sidebar-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  $$('.sidebar-tab-content').forEach(content => content.style.display = 'none');
  const target = $(`#tab-${tabName}`);
  if (target) {
    target.style.display = '';
    target.classList.add('active');
  }
  // Auto-refresh memory when switching to memory tab
  if (tabName === 'memory' && state.context) {
    loadMemory(state.context);
  }
}

// ═══ UI Helpers ════════════════════════════════════════════════════════════

function showWelcome() {
  const welcome = $('#welcome-screen');
  const history = $('#chat-history');
  if (welcome) welcome.style.display = '';
  if (history) history.style.display = 'none';
}

function hideWelcome() {
  const welcome = $('#welcome-screen');
  const history = $('#chat-history');
  if (welcome) welcome.style.display = 'none';
  if (history) history.style.display = '';
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
  if (btn) btn.disabled = state.running;
}

function showProgress(text) {
  const bar = $('#progress-bar');
  if (bar) bar.classList.remove('hidden');
}

function updateProgress(text, active) {
  active ? showProgress(text) : hideProgress();
}

function hideProgress() {
  const bar = $('#progress-bar');
  if (bar) bar.classList.add('hidden');
}

// ═══ Stuck-State Watchdog ═════════════════════════════════════════════════

const STUCK_TIMEOUT_MS = 120_000;

function startWatchdog() {
  if (state._watchdogTimer) clearInterval(state._watchdogTimer);
  state._watchdogTimer = setInterval(() => {
    if (state.running && (Date.now() - state._lastStateUpdate) > 30_000) {
      const unstickBtn = document.getElementById('unstick-btn');
      if (unstickBtn) unstickBtn.classList.remove('hidden');
    }
    if (state.running && (Date.now() - state._lastStateUpdate) > STUCK_TIMEOUT_MS) {
      console.warn('[RudraX] Stuck state detected — auto-recovering.');
      forceUnstick();
    }
    if (!state.running) {
      const unstickBtn = document.getElementById('unstick-btn');
      if (unstickBtn) unstickBtn.classList.add('hidden');
    }
  }, 10_000);
}

function resetWatchdog() {
  state._lastStateUpdate = Date.now();
  const unstickBtn = document.getElementById('unstick-btn');
  if (unstickBtn) unstickBtn.classList.add('hidden');
}

async function forceUnstick() {
  console.log('[RudraX] Force unsticking session...');
  state.running = false;
  state.agentBusy = false;
  state._lastStateUpdate = Date.now();
  hideProgress();
  updateSendButton();
  updateSteerButton();
  updateStatusBar('idle');
  updateTopStatusBar('idle', 'Recovered from stuck state');
  const unstickBtn = document.getElementById('unstick-btn');
  if (unstickBtn) unstickBtn.classList.add('hidden');
  showToast('Recovering stuck session...', 'info');

  if (state.context) {
    try {
      await fetch(`${CONFIG.API_BASE}/force_unstick`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ context: state.context }),
      });
      showToast('Session recovered! You can continue chatting.', 'success');
    } catch (err) {
      console.error('[RudraX] Force unstick failed:', err);
      showToast('Local recovery done. Server may need a refresh.', 'warning');
    }
  } else {
    showToast('Session recovered. You can continue chatting.', 'success');
  }
}

startWatchdog();

// ═══ Sidebar Toggle ════════════════════════════════════════════════════════

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
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══ Terminal ═══════════════════════════════════════════════════════════════

function toggleTerminal() {
  state.terminalOpen = !state.terminalOpen;
  const panel = $('#terminal-panel');
  if (panel) panel.classList.toggle('hidden', !state.terminalOpen);
  if (state.terminalOpen && !state.terminal) initTerminal();
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
      state.socket.emit('terminal_create', { cwd: '/' });
    }, 200);
  }
}

// ═══ Clock — IST Timezone ════════════════════════════════════════════════

function initClock() {
  const el = $('#time-date');
  const update = () => {
    const now = getISTDate();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const dateStr = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    if (el) el.innerHTML = `${hours}:${minutes} ${ampm}<br><span style="font-size:10px">${dateStr}</span>`;
  };
  update();
  setInterval(update, 30000);
}

function initISTClock() {
  const el = $('#status-ist-clock');
  const update = () => {
    const now = getISTDate();
    if (el) {
      el.textContent = `IST ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
    }
  };
  update();
  setInterval(update, 1000);
}

function getISTDate() {
  const now = new Date();
  // Convert to IST using timezone offset
  const istOffset = 5.5 * 60 * 60 * 1000; // UTC+5:30
  return new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
}

function formatISTTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset + (date.getTimezoneOffset() * 60 * 1000));
  return istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ═══ Theme ═════════════════════════════════════════════════════════════════

function initTheme() {
  const saved = localStorage.getItem('rudrax-theme');
  if (saved) state.theme = saved;
  applyTheme();
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

// ═══ Font Size ═════════════════════════════════════════════════════════════

function setFontSize(size) {
  document.documentElement.style.setProperty('--fs-base', `${size}px`);
  const display = $('#font-size-value');
  if (display) display.textContent = `${size}px`;
}

// ═══ Keyboard Shortcuts ════════════════════════════════════════════════════

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); newContext(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); toggleTerminal(); }
    if (e.key === 'Escape') { closeSettings(); hideCommandSuggestions(); closeSteerPanel(); }
    // Ctrl+U for file upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); triggerFileUpload(); }
  });
}

// ═══ Input Handling ════════════════════════════════════════════════════════

function handleInputKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if ((state.running || state.agentBusy) && !event.target.value.startsWith('/')) {
      // Agent is running — show steer options instead of sending
      state.pendingSteerMessage = event.target.value;
      showSteerOptions();
    } else if (!state.running && !state.agentBusy) {
      sendMessage();
    }
  }
  if (event.key === 'Escape') { hideCommandSuggestions(); closeSteerPanel(); }
  if (event.key === 'Tab') {
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

// ═══ Scroll ════════════════════════════════════════════════════════════════

function scrollToBottom() {
  requestAnimationFrame(() => {
    const hist = $('#chat-history');
    if (hist) hist.scrollTop = hist.scrollHeight;
  });
}

// ═══ Settings Modal ════════════════════════════════════════════════════════

function openSettings() {
  const modal = $('#settings-modal');
  if (modal) modal.classList.remove('hidden');
  const sel = $('#theme-select');
  if (sel) sel.value = state.theme;
  const orchMode = $('#orch-settings-mode');
  if (orchMode) orchMode.value = state.orchestrator.mode;
  // Clear password fields
  ['settings-current-password', 'settings-new-password', 'settings-confirm-password'].forEach(id => {
    const el = $(`#${id}`);
    if (el) el.value = '';
  });
  const errEl = $('#password-change-error');
  const okEl = $('#password-change-success');
  if (errEl) errEl.classList.add('hidden');
  if (okEl) okEl.classList.add('hidden');
}

function closeSettings() {
  const modal = $('#settings-modal');
  if (modal) modal.classList.add('hidden');
}

// ═══ Session Restore ═══════════════════════════════════════════════════════

async function restoreSession() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/contexts`, { headers: getAuthHeaders() });
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
  try {
    const orchResp = await fetch(`${CONFIG.API_BASE}/api/orchestrator`, { headers: getAuthHeaders() });
    if (orchResp.ok) {
      const orchData = await orchResp.json();
      applyOrchestratorUpdate(orchData);
    }
  } catch (err) { /* Non-critical */ }
}

// ═══ Markdown Rendering ════════════════════════════════════════════════════

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

// ═══ Utilities ═════════════════════════════════════════════════════════════

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

// ═══ Shared Memory ═════════════════════════════════════════════════════════

const memoryState = {
  contextId: null,
  data: null,
};

async function loadMemory(contextId) {
  if (!contextId) {
    console.warn('[RudraX] loadMemory called without contextId');
    renderEmptyMemory();
    return;
  }

  memoryState.contextId = contextId;

  try {
    // First try to get existing memory
    const response = await fetch(`${CONFIG.API_BASE}/api/memory/${encodeURIComponent(contextId)}`, { headers: getAuthHeaders() });
    if (response.ok) {
      const data = await response.json();
      memoryState.data = data;
      renderMemory(data);
      return;
    }

    // If 404, initialize new memory
    if (response.status === 404) {
      const initResp = await fetch(`${CONFIG.API_BASE}/api/memory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contextId, projectName: `Project ${contextId.slice(0, 8)}` }),
      });
      if (initResp.ok) {
        const initData = await initResp.json();
        memoryState.data = initData.memory;
        renderMemory(initData.memory);
        return;
      }
    }

    // Fallback: show empty state
    renderEmptyMemory();
  } catch (err) {
    console.error('[RudraX] Failed to load memory:', err);
    renderEmptyMemory();
  }
}

function renderEmptyMemory() {
  const nameEl = $('#mem-project-name');
  if (nameEl) nameEl.textContent = 'No Active Context';

  const statusEl = $('#mem-project-status');
  if (statusEl) {
    statusEl.textContent = 'no-context';
    statusEl.className = 'mem-status-badge paused';
  }

  const overviewEl = $('#mem-overview');
  if (overviewEl) overviewEl.textContent = 'Start a chat or activate a context to see shared memory.';

  // Reset all counts
  ['task', 'log', 'decisions', 'blockers', 'handoffs', 'files'].forEach(section => {
    const el = $(`#mem-${section}`);
    if (el) el.innerHTML = '<div class="empty-state">—</div>';
    const countEl = $(`#mem-${section}-count`);
    if (countEl) countEl.textContent = '0';
  });
}

async function refreshMemory() {
  if (memoryState.contextId) {
    showToast('🔄 Refreshing memory...', 'info');
    await loadMemory(memoryState.contextId);
    showToast('✅ Memory refreshed', 'success');
  } else {
    showToast('⚠️ No active context — start a chat first', 'warning');
  }
}

function renderMemory(mem) {
  if (!mem) {
    renderEmptyMemory();
    return;
  }

  const nameEl = $('#mem-project-name');
  if (nameEl) nameEl.textContent = mem.project || 'Project';

  const statusEl = $('#mem-project-status');
  if (statusEl) {
    statusEl.textContent = mem.status || 'active';
    statusEl.className = `mem-status-badge ${mem.status || 'active'}`;
  }

  const overviewEl = $('#mem-overview');
  if (overviewEl) {
    overviewEl.textContent = mem.overview || '(No overview yet — agents will populate this as they work)';
  }

  renderMemoryTasks(mem.taskBoard || '');
  renderMemoryLog(mem.activityLog || '');
  renderMemorySection('decisions', mem.decisions || '');
  renderMemorySection('blockers', mem.blockers || '');
  renderMemorySection('handoffs', mem.handoffs || '');
  renderMemoryFiles(mem.filesChanged || '');
}

function renderMemoryTasks(md) {
  const el = $('#mem-tasks');
  const countEl = $('#mem-task-count');

  if (!md || md.includes('(No tasks') || md.includes('(empty)') || md === '') {
    if (el) el.innerHTML = '<div class="empty-state">No tasks yet</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  const rows = md.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('Task ID') && !l.includes('-----'));
  if (rows.length === 0) {
    if (el) el.innerHTML = '<div class="empty-state">No tasks yet</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  if (el) {
    el.innerHTML = rows.map(row => {
      const cells = row.split('|').filter(c => c.trim());
      if (cells.length < 3) return '';
      const id = cells[0]?.trim() || '';
      const agent = cells[1]?.trim() || '';
      const status = cells[2]?.trim() || '';
      const desc = cells[3]?.trim() || '';
      const icon = status.includes('✅') ? '✅' : status.includes('🔄') ? '🔄' : status.includes('🚫') ? '🚫' : '⏳';
      return `<div class="mem-task-row"><span class="mem-task-icon">${icon}</span><div class="mem-task-info"><span class="mem-task-id">${escapeHtml(id)}</span><div class="mem-task-desc">${escapeHtml(desc)}</div><span class="mem-task-agent">${escapeHtml(agent)}</span></div></div>`;
    }).filter(Boolean).join('');
  }
  if (countEl) countEl.textContent = rows.length;
}

function renderMemoryLog(md) {
  const el = $('#mem-log');
  const countEl = $('#mem-log-count');

  if (!md || md.includes('(No activity') || md.includes('(empty)') || md === '') {
    if (el) el.innerHTML = '<div class="empty-state">No activity yet</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  const lines = md.split('\n').filter(l => l.trim().startsWith('-'));
  if (lines.length === 0) {
    if (el) el.innerHTML = '<div class="empty-state">No activity yet</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  if (el) {
    el.innerHTML = lines.slice(0, 30).map(line => {
      const agentMatch = line.match(/\*\*\[([^]]+)\]\*\*/);
      const agent = agentMatch ? agentMatch[1] : '?';
      const typeMatch = line.match(/\|\s*(\w+)\s*\|/);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'note';
      const content = line.replace(/^[-*]\s*/, '').replace(/\*\*\[([^]]+)\]\*\*/g, '').replace(/\|[^|]*\|[^|]*\|/, '').replace(/^[ ✅💡🚫🤝📝🏗️📌]+/, '').trim();
      return `<div class="mem-log-entry ${type}"><span class="mem-log-agent">[${escapeHtml(agent)}]</span><span class="mem-log-type">${type}</span><div class="mem-log-content">${escapeHtml(content.slice(0, 120))}</div></div>`;
    }).filter(Boolean).join('');
  }
  if (countEl) countEl.textContent = lines.length;
}

function renderMemorySection(section, md) {
  const el = $(`#mem-${section}`);
  const countEl = $(`#mem-${section}-count`);

  if (!md || md.includes('(No ') || md.includes('(none)') || md.includes('smooth sailing') || md === '') {
    if (el) el.innerHTML = '<div class="empty-state">None</div>';
    if (countEl) { countEl.textContent = '0'; countEl.classList.remove('danger'); }
    return;
  }

  const lines = md.split('\n').filter(l => l.trim().startsWith('-'));
  if (lines.length === 0) {
    if (el) el.innerHTML = '<div class="empty-state">None</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  if (el) {
    el.innerHTML = lines.slice(0, 20).map(line => {
      const agentMatch = line.match(/\*\*\[([^]]+)\]\*\*/);
      const agent = agentMatch ? agentMatch[1] : '';
      const content = line.replace(/^[-*]\s*/, '').replace(/\*\*\[([^]]+)\]\*\*/g, '').replace(/[💡🚫🤝]/g, '').trim();
      return `<div class="mem-entry">${agent ? `<span class="mem-entry-agent">[${escapeHtml(agent)}]</span> ` : ''}${escapeHtml(content.slice(0, 150))}</div>`;
    }).filter(Boolean).join('');
  }
  if (countEl) {
    const count = lines.length;
    countEl.textContent = count;
    if (section === 'blockers' && count > 0) countEl.classList.add('danger');
  }
}

function renderMemoryFiles(md) {
  const el = $('#mem-files');
  const countEl = $('#mem-files-count');

  if (!md || md.includes('(No files') || md.includes('(none)') || md === '') {
    if (el) el.innerHTML = '<div class="empty-state">No files tracked</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  const lines = md.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  if (lines.length === 0) {
    if (el) el.innerHTML = '<div class="empty-state">No files tracked</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  if (el) {
    el.innerHTML = lines.slice(0, 30).map(line => {
      const file = line.replace(/^[-*]\s*/, '').replace(/`/g, '').trim();
      return `<div class="mem-file-row">${escapeHtml(file)}</div>`;
    }).filter(Boolean).join('');
  }
  if (countEl) countEl.textContent = lines.length;
}

function toggleMemorySection(sectionId) {
  const section = document.getElementById(`mem-section-${sectionId}`);
  if (section) section.classList.toggle('collapsed');
}

async function openMemoryRaw() {
  if (!memoryState.contextId) {
    showToast('⚠️ No active context', 'warning');
    return;
  }
  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/memory/${encodeURIComponent(memoryState.contextId)}/raw`, { headers: getAuthHeaders() });
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

// ═══ Fallback: Polling starts once app is shown ═══════════════════════════

// Log startup
console.log('%c🔱 RudraX Army v4.1.0 %c— Build · Break · Deploy by Lalit Pandit',
  'color: #d4a843; font-size: 16px; font-weight: bold;',
  'color: #9e978f;');
console.log('%c179 Agents %c| %cॐ नमः शिवाय',
  'color: #d4a843;', 'color: #9e978f;', 'color: #d4a843;');