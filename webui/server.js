/**
 * RudraX Web UI Server — Rudraksh Edition
 *
 * Express + Socket.IO server that bridges the web UI to the RudraX AgentSession SDK.
 * Agency orchestration, agent discovery, squad management, terminal, shared memory.
 * Incremental DOM rendering for smooth streaming. Agent Activity panel.
 *
 * Architecture:
 *   Browser ←→ Socket.IO ←→ server.js ←→ AgentSession ←→ Agent ←→ LLM
 *   Browser ←→ WebSocket  ←→ server.js ←→ child_process (Terminal)
 *
 * By Lalit Pandit
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createAgentSession } from '../lib/core/sdk.js';
import { SettingsManager } from '../lib/core/settings-manager.js';
import { SessionManager, getDefaultSessionDir } from '../lib/core/session-manager.js';
import { getAgentDir } from '../lib/config.js';
import { isOllamaAvailable, isOllamaServerRunning, getOllamaModels, getOllamaModelConfig } from '../lib/core/ollama-openai-provider.js';
import crypto from 'crypto';
import { readdir, readFile } from 'fs/promises';
import * as fsSync from 'fs';
import { spawn } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ─── Port Config ────────────────────────────────────────────────────────────

const PORT = parseInt(process.argv[2], 10) || parseInt(process.env.RUDRAX_WEBUI_PORT, 10) || 5555;

// ─── Express Setup ──────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname)));
app.use('/socket.io', express.static(join(process.cwd(), 'node_modules', 'socket.io', 'client-dist')));

// Favicon route
app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/favicon.svg');
});

// ─── State ──────────────────────────────────────────────────────────────────

const contexts = new Map(); // contextId → { session, name, created, logs[], logVersion, logGuid, running }

// ─── Orchestration State ────────────────────────────────────────────────────

let orchestratorState = {
  mode: 'auto',           // 'auto' | 'manual'
  activePlan: null,       // ExecutionPlan object or null
  activeAgent: null,      // Currently active agent name
  activeSquad: null,      // Currently active squad name
  activeSquadAgents: [],  // Agents in the active squad
  taskHistory: [],        // Completed tasks
};

// ─── Squad Definitions ──────────────────────────────────────────────────────

const SQUADS = {
  startup: {
    name: "Startup MVP Squad",
    emoji: "🚀",
    color: "#ff6b35",
    description: "Full-stack team for building an MVP from scratch",
    agents: ["engineering-rapid-prototyper", "engineering-frontend-developer", "engineering-backend-architect", "design-ui-designer", "product-manager"],
  },
  enterprise: {
    name: "Enterprise Feature Squad",
    emoji: "🏢",
    color: "#4a90d9",
    description: "Structured team for enterprise feature development",
    agents: ["engineering-software-architect", "engineering-senior-developer", "engineering-security-engineer", "engineering-devops-automator", "engineering-code-reviewer", "project-management-project-shepherd"],
  },
  fullproduct: {
    name: "Full Product Squad",
    emoji: "🎯",
    color: "#9b59b6",
    description: "End-to-end product team from design to launch",
    agents: ["product-manager", "design-ux-architect", "design-ui-designer", "engineering-frontend-developer", "engineering-backend-architect", "engineering-devops-automator", "marketing-growth-hacker", "marketing-content-creator"],
  },
  security: {
    name: "Security Hardening Squad",
    emoji: "🔐",
    color: "#e74c3c",
    description: "Security-focused team for audits and hardening",
    agents: ["engineering-security-engineer", "engineering-threat-detection-engineer", "compliance-auditor", "engineering-code-reviewer", "engineering-devops-automator"],
  },
  qalead: {
    name: "QA & Testing Squad",
    emoji: "✅",
    color: "#27ae60",
    description: "Quality assurance and testing specialists",
    agents: ["engineering-code-reviewer", "testing-api-tester", "testing-performance-benchmarker", "testing-accessibility-auditor", "testing-reality-checker"],
  },
  aiinfra: {
    name: "AI Infrastructure Squad",
    emoji: "🤖",
    color: "#3498db",
    description: "AI/ML engineering and infrastructure team",
    agents: ["engineering-ai-engineer", "engineering-backend-architect", "engineering-devops-automator", "specialized-mcp-builder", "specialized-model-qa"],
  },
  web3: {
    name: "Web3 & Blockchain Squad",
    emoji: "⛓️",
    color: "#f39c12",
    description: "Blockchain and smart contract development team",
    agents: ["engineering-solidity-smart-contract-engineer", "blockchain-security-auditor", "agentic-identity-trust", "specialized-zk-steward", "engineering-backend-architect"],
  },
  growth: {
    name: "Growth Marketing Squad",
    emoji: "📈",
    color: "#2ecc71",
    description: "Marketing and growth specialists",
    agents: ["marketing-growth-hacker", "marketing-content-creator", "marketing-seo-specialist", "marketing-social-media-strategist", "paid-media-paid-social-strategist", "product-feedback-synthesizer"],
  },
  incident: {
    name: "Incident Response Squad",
    emoji: "🚨",
    color: "#e74c3c",
    description: "Production incident management team",
    agents: ["engineering-incident-response-commander", "engineering-sre", "engineering-devops-automator", "engineering-security-engineer", "support-support-responder", "support-executive-summary-generator"],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `ctx_${crypto.randomBytes(4).toString('hex')}_${Date.now().toString(36)}`;
}

/** Read all agency skills from the skills directory */
async function loadAgencySkills() {
  // Try multiple possible skill directory locations
  const homeDir = os.homedir();
  const possibleSkillDirs = [
    join(getAgentDir(), 'skills'),                              // ~/.rudrax/agent/skills
    join(homeDir, '.pi', 'agent', 'skills'),                      // ~/.pi/agent/skills (agency install)
    join(homeDir, '.rudrax', 'agent', 'skills'),                 // explicit rudrax path
  ];

  let skillsDir = possibleSkillDirs[0];
  for (const dir of possibleSkillDirs) {
    try {
      await readdir(dir);
      skillsDir = dir;
      break;
    } catch (e) {
      // Try next
    }
  }

  try {
    const entries = await readdir(skillsDir);
    const skills = [];

    for (const entry of entries) {
      const skillFile = join(skillsDir, entry, 'SKILL.md');
      try {
        const content = await readFile(skillFile, 'utf-8');
        // Parse YAML frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) continue;

        const fm = frontmatterMatch[1];
        const name = fm.match(/name:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();
        const description = fm.match(/description:\s*["']?([\s\S]*?)(?:["']?\n|\n)/)?.[1]?.trim();
        const category = fm.match(/category:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();
        const emoji = fm.match(/emoji:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();
        const color = fm.match(/color:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();
        const vibe = fm.match(/vibe:\s*["']?([\s\S]*?)(?:["']?\n)/)?.[1]?.trim();
        const originalName = fm.match(/original_name:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();

        if (name && description) {
          skills.push({
            id: name,
            name: originalName || name,
            description: description.substring(0, 200),
            category: category || 'general',
            emoji: emoji || '🤖',
            color: color || 'blue',
            vibe: vibe || '',
            skillName: name,
          });
        }
      } catch (e) {
        // Skip unreadable files
      }
    }
    return skills;
  } catch (err) {
    console.error('[RudraX] Failed to read skills directory:', err.message);
    return [];
  }
}

/** Convert AgentSession events into WebUI log entries */
function eventToLogEntry(event, ctx) {
  const ts = Date.now();

  switch (event.type) {
    case 'agent_start':
      if (ctx) ctx.turnCounter = (ctx.turnCounter || 0) + 1;
      return null;

    case 'message_start': {
      const msg = event.message || {};
      if (msg.role === 'user') {
        let text = '';
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
        }
        return { no: 0, id: `user-${ts}`, type: 'user', content: text, timestamp: ts };
      }
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        return { no: 0, id: `response-${turnNum}`, type: 'response', content: '', timestamp: ts, _streaming: true };
      }
      return null;
    }

    case 'message_update': {
      const msg = event.message || {};
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        let text = '';
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
        }
        return {
          no: 0, id: `response-${turnNum}`, type: 'response', content: text, timestamp: ts,
          _update: true,
        };
      }
      return null;
    }

    case 'message_end': {
      const msg = event.message || {};
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        let text = '';
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
        }
        return { no: 0, id: `response-${turnNum}`, type: 'response', content: text, timestamp: ts, _final: true };
      }
      return null;
    }

    case 'tool_execution_start':
      return {
        no: 0, id: event.toolCallId || `tool-${ts}`, type: 'tool',
        heading: event.toolName || 'Tool',
        content: typeof event.args === 'string' ? event.args : JSON.stringify(event.args, null, 2),
        kvps: { tool_name: event.toolName || 'unknown' }, timestamp: ts,
      };

    case 'tool_execution_end':
      return {
        no: 0, id: event.toolCallId || `tool-result-${ts}`, type: 'tool_result',
        heading: `${event.toolName || 'Tool'} Result`,
        content: typeof event.result === 'string' ? event.result : JSON.stringify(event.result, null, 2),
        kvps: { tool_name: event.toolName || 'unknown' }, timestamp: ts, _isError: event.isError,
      };

    case 'agent_end':
      return null;

    case 'compaction_start':
      return { no: 0, id: crypto.randomUUID(), type: 'agent', heading: '📦 Compacting...', content: event.reason || 'Auto-compaction', timestamp: ts };

    case 'queue_update':
      return null;

    case 'auto_retry_start':
      return { no: 0, id: crypto.randomUUID(), type: 'agent', heading: '🔄 Retrying...', content: `Attempt ${event.attempt || 1}`, timestamp: ts };

    case 'auto_retry_end':
      return { no: 0, id: crypto.randomUUID(), type: 'agent', heading: event.success ? '✅ Retry succeeded' : '❌ Retry failed', content: '', timestamp: ts };

    case 'model_select':
      return { no: 0, id: crypto.randomUUID(), type: 'agent', heading: '🤖 Model changed', content: `${event.model?.provider || ''}/${event.model?.id || ''}`, timestamp: ts };

    default:
      return null;
  }
}

// ─── Context Management ─────────────────────────────────────────────────────

async function createContext(name) {
  const id = generateId();
  const ctxName = name || `Chat ${contexts.size + 1}`;
  const agentDir = getAgentDir();
  const cwd = process.cwd();

  console.log(`[RudraX] Creating session with agentDir: ${agentDir}`);

  try {
    const { session, modelFallbackMessage } = await createAgentSession({
      cwd,
      agentDir,
    });

    if (!session.model) {
      console.log('[RudraX] No model selected, attempting Ollama auto-init...');
      try {
        const ollamaAvailable = await isOllamaAvailable();
        if (ollamaAvailable) {
          const ollamaRunning = await isOllamaServerRunning();
          if (ollamaRunning) {
            const models = await getOllamaModels();
            if (models.length > 0) {
              const settingsManager = SettingsManager.create(cwd, agentDir);
              const defaultModel = settingsManager.getDefaultModel();
              const defaultProvider = settingsManager.getDefaultProvider();

              let selectedModel = models[0];
              if (defaultProvider === 'ollama' && defaultModel) {
                const found = models.find(m => m.id === defaultModel || m.name === defaultModel);
                if (found) selectedModel = found;
              }

              const registryModel = getOllamaModelConfig(selectedModel.id || selectedModel.name);
              session.modelRegistry.registerCustomModel(registryModel);
              await session.setModel(registryModel);
              console.log(`[RudraX] Auto-selected Ollama model: ${registryModel.id}`);
            } else {
              console.log('[RudraX] No Ollama models found. Run ollama pull <model>');
            }
          } else {
            console.log('[RudraX] Ollama server not running');
          }
        } else {
          console.log('[RudraX] Ollama not available');
        }
      } catch (ollamaErr) {
        console.error('[RudraX] Ollama auto-init failed:', ollamaErr.message);
      }
    } else {
      console.log(`[RudraX] Session model: ${session.model.provider}/${session.model.id}`);
    }

    if (modelFallbackMessage) {
      console.log(`[RudraX] Model fallback: ${modelFallbackMessage}`);
    }

    const ctx = {
      id,
      name: ctxName,
      created: Date.now(),
      session,
      logs: [],
      logVersion: 0,
      logGuid: crypto.randomUUID(),
      running: false,
      paused: false,
      turnCounter: 0,
    };

    session.subscribe((event) => {
      handleSessionEvent(ctx, event);
    });

    contexts.set(id, ctx);
    return ctx;
  } catch (err) {
    console.error('[RudraX] Failed to create session:', err);
    throw err;
  }
}

function handleSessionEvent(ctx, event) {
  const entry = eventToLogEntry(event, ctx);
  if (!entry) {
    if (event.type === 'agent_start') ctx.running = true;
    if (event.type === 'agent_end') ctx.running = false;
    return;
  }

  if (event.type === 'agent_start') {
    ctx.running = true;
  } else if (event.type === 'agent_end') {
    ctx.running = false;
  }

  if (entry._update) {
    const existing = ctx.logs.find(l => l.id === entry.id);
    if (existing) {
      existing.content = entry.content;
      ctx.logVersion++;
      // Broadcast only the updated entry for incremental rendering
      io.emit('state_update', {
        context: ctx.id,
        logs: [{ ...existing, _update: true }],
        log_version: ctx.logVersion,
        log_guid: ctx.logGuid,
        log_progress: ctx.running ? 'Processing...' : '',
        log_progress_active: ctx.running,
        paused: ctx.paused,
      });
      return;
    }
  }

  if (entry._final) {
    const existingIndex = ctx.logs.findIndex(l => l.id === entry.id);
    if (existingIndex >= 0) {
      ctx.logs[existingIndex] = { ...entry, no: ctx.logs[existingIndex].no };
      ctx.logVersion++;
      // Broadcast only the finalized entry for incremental rendering
      io.emit('state_update', {
        context: ctx.id,
        logs: [{ ...entry, _final: true }],
        log_version: ctx.logVersion,
        log_guid: ctx.logGuid,
        log_progress: ctx.running ? 'Processing...' : '',
        log_progress_active: ctx.running,
        paused: ctx.paused,
      });
      // Broadcast agent activity for this final response
      broadcastAgentActivity({
        type: entry.type === 'response' ? 'response' : entry.type,
        agent: entry.type === 'response' ? 'RudraX' : (entry.kvps?.agent || entry.kvps?.tool_name || 'system'),
        content: (entry.content || '').slice(0, 200),
        action: entry.type === 'response' ? 'responded' : 'completed',
      });
      return;
    }
  }

  if (entry._streaming) {
    const existingIndex = ctx.logs.findIndex(l => l.id === entry.id);
    if (existingIndex >= 0) {
      // Update existing streaming entry content
      ctx.logs[existingIndex] = { ...ctx.logs[existingIndex], content: entry.content };
      ctx.logVersion++;
      // Broadcast streaming update (only this entry) for smooth incremental rendering
      io.emit('state_update', {
        context: ctx.id,
        logs: [{ ...ctx.logs[existingIndex], _update: true, _streaming: true }],
        log_version: ctx.logVersion,
        log_guid: ctx.logGuid,
        log_progress: ctx.running ? 'Processing...' : '',
        log_progress_active: ctx.running,
        paused: ctx.paused,
      });
      return;
    }
    // First streaming chunk — add new entry
    entry.no = ctx.logs.length + 1;
    ctx.logs.push(entry);
    ctx.logVersion++;
    io.emit('state_update', {
      context: ctx.id,
      logs: [entry],
      log_version: ctx.logVersion,
      log_guid: ctx.logGuid,
      log_progress: ctx.running ? 'Processing...' : '',
      log_progress_active: ctx.running,
      paused: ctx.paused,
    });
    return;
  }

  entry.no = ctx.logs.length + 1;
  ctx.logs.push(entry);
  ctx.logVersion++;

  // Parse orchestration events from tool calls
  if (entry.type === 'tool' && entry.kvps?.tool_name) {
    parseOrchestratorToolCall(entry.kvps.tool_name, entry.content);
    // Broadcast agent activity for tool calls
    broadcastAgentActivity({
      type: 'tool',
      agent: entry.kvps?.tool_name || 'system',
      content: (entry.content || '').slice(0, 200),
      action: 'tool_call',
    });
  }

  // Broadcast agent activity for user messages
  if (entry.type === 'user') {
    broadcastAgentActivity({
      type: 'user',
      agent: 'You',
      content: (entry.content || '').slice(0, 100),
      action: 'message',
    });
  }

  broadcastState(ctx);
}

/**
 * Parse orchestrator-related tool calls to update orchestration state
 * This lets the WebUI track plan progress even though the orchestrator
 * state lives inside the agent session
 */
function parseOrchestratorToolCall(toolName, content) {
  try {
    if (toolName === 'agency_dispatch') {
      // Extract agent name from dispatch call
      const agentMatch = content?.match(/"agent_name"\s*:\s*"([^"]+)"/);
      if (agentMatch) {
        orchestratorState.activeAgent = agentMatch[1];
        broadcastOrchestratorState();
      }
    } else if (toolName === 'agency_parallel_dispatch') {
      // Multiple agents dispatched
      broadcastOrchestratorState();
    } else if (toolName === 'agency_analyze') {
      // Task analysis happening
      broadcastOrchestratorState();
    } else if (toolName === 'agency_task_complete') {
      if (orchestratorState.activePlan) {
        orchestratorState.taskHistory.push({ completedAt: Date.now() });
      }
      broadcastOrchestratorState();
    } else if (toolName === 'agency_report') {
      // Parse report for plan summary
      broadcastOrchestratorState();
    }
  } catch (e) {
    // Non-critical — don't break the main flow
  }
}

function broadcastOrchestratorState() {
  io.emit('orchestrator_update', {
    mode: orchestratorState.mode,
    activePlan: orchestratorState.activePlan,
    activeAgent: orchestratorState.activeAgent,
    activeSquad: orchestratorState.activeSquad,
    activeSquadAgents: orchestratorState.activeSquadAgents,
    taskHistory: orchestratorState.taskHistory.slice(-50), // Keep last 50
  });
}

function broadcastState(ctx) {
  const snapshot = {
    context: ctx.id,
    logs: ctx.logs,
    log_version: ctx.logVersion,
    log_guid: ctx.logGuid,
    log_progress: ctx.running ? 'Processing...' : '',
    log_progress_active: ctx.running,
    paused: ctx.paused,
  };

  io.emit('state_update', snapshot);
}

/** Broadcast an agent activity event (for the Agent Activity panel) */
function broadcastAgentActivity(event) {
  io.emit('agent_activity', {
    ts: event.ts || Date.now(),
    type: event.type || 'info',
    agent: event.agent || 'system',
    content: event.content || '',
    action: event.action || '',
  });
}

function getContextSnapshot(ctx) {
  return {
    context: ctx.id,
    logs: ctx.logs,
    log_version: ctx.logVersion,
    log_guid: ctx.logGuid,
    log_progress: ctx.running ? 'Processing...' : '',
    log_progress_active: ctx.running,
    paused: ctx.paused,
    contexts: Array.from(contexts.values()).map(c => ({
      id: c.id,
      name: c.name,
      created: c.created,
      running: c.running,
      messageCount: c.logs.filter(l => l.type === 'user' || l.type === 'response').length,
    })),
  };
}

// ─── HTTP API Routes ────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', name: 'RudraX', features: ['chat', 'agency', 'orchestrator', 'terminal'] });
});

app.get('/api/settings', (req, res) => {
  res.json({ theme: 'dark', fontSize: 14, model: 'default' });
});

// ─── Context Routes ─────────────────────────────────────────────────────────

app.get('/api/contexts', (req, res) => {
  const list = Array.from(contexts.values()).map(c => ({
    id: c.id,
    name: c.name,
    created: c.created,
    running: c.running,
    messageCount: c.logs.filter(l => l.type === 'user' || l.type === 'response').length,
  }));
  res.json(list);
});

app.post('/api/contexts', async (req, res) => {
  try {
    const ctx = await createContext(req.body?.name);
    res.json({ context: ctx.id, name: ctx.name });
  } catch (err) {
    console.error('[RudraX] Create context error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contexts/:id', async (req, res) => {
  const ctx = contexts.get(req.params.id);
  if (!ctx) {
    return res.status(404).json({ error: 'Context not found' });
  }
  try {
    if (ctx.session && ctx.session.dispose) {
      ctx.session.dispose();
    }
  } catch (e) {
    console.error('[RudraX] Error disposing session:', e);
  }
  contexts.delete(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/contexts/:id', (req, res) => {
  const ctx = contexts.get(req.params.id);
  if (!ctx) {
    return res.status(404).json({ error: 'Context not found' });
  }
  ctx.name = req.body.name || ctx.name;
  res.json({ ok: true, name: ctx.name });
});

// ─── Agency Routes ───────────────────────────────────────────────────────────

/** List all available agency skills (agents) */
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await loadAgencySkills();
    const category = req.query.category;
    const search = req.query.search?.toLowerCase();

    let filtered = skills;
    if (category && category !== 'all') {
      filtered = filtered.filter(s => s.category === category);
    }
    if (search) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search) ||
        (s.vibe && s.vibe.toLowerCase().includes(search))
      );
    }
    res.json(filtered);
  } catch (err) {
    console.error('[RudraX] Failed to list skills:', err);
    res.status(500).json({ error: err.message });
  }
});

/** Get skill categories with counts */
app.get('/api/skills/categories', async (req, res) => {
  try {
    const skills = await loadAgencySkills();
    const categories = {};
    for (const skill of skills) {
      if (!categories[skill.category]) {
        categories[skill.category] = { count: 0, color: getCatColor(skill.category) };
      }
      categories[skill.category].count++;
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getCatColor(category) {
  const colors = {
    engineering: '#3498db',
    marketing: '#2ecc71',
    design: '#9b59b6',
    specialized: '#e67e22',
    'game-development': '#e74c3c',
    testing: '#27ae60',
    sales: '#f39c12',
    strategy: '#1abc9c',
    'paid-media': '#e91e63',
    support: '#00bcd4',
    'spatial-computing': '#673ab7',
    'project-management': '#795548',
    product: '#ff9800',
    finance: '#4caf50',
    academic: '#607d8b',
  };
  return colors[category] || '#78909c';
}

/** List all squads */
app.get('/api/squads', (req, res) => {
  res.json(SQUADS);
});

/** Activate a squad */
app.post('/api/squads/:name/activate', async (req, res) => {
  const squadName = req.params.name;
  const squad = SQUADS[squadName];

  if (!squad) {
    return res.status(404).json({ error: `Unknown squad: ${squadName}. Available: ${Object.keys(SQUADS).join(', ')}` });
  }

  orchestratorState.activeSquad = squadName;
  orchestratorState.activeSquadAgents = squad.agents;
  broadcastOrchestratorState();

  // If there's an active context, send activation command
  const { context: contextId } = req.body;
  if (contextId) {
    const ctx = contexts.get(contextId);
    if (ctx) {
      try {
        ctx.session.prompt(`/agency squad ${squadName}`, { expandPromptTemplates: false }).catch(err => {
          console.error('[RudraX] Squad activation error:', err.message);
        });
      } catch (e) {
        // Non-blocking
      }
    }
  }

  res.json({ ok: true, squad: squadName, agents: squad.agents, message: `${squad.emoji} ${squad.name} activated with ${squad.agents.length} agents` });
});

/** Deactivate current squad */
app.post('/api/squads/deactivate', (req, res) => {
  orchestratorState.activeSquad = null;
  orchestratorState.activeSquadAgents = [];
  broadcastOrchestratorState();
  res.json({ ok: true });
});

/** Get orchestrator state */
app.get('/api/orchestrator', (req, res) => {
  res.json(orchestratorState);
});

/** Set orchestrator mode */
app.post('/api/orchestrator/mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'auto' && mode !== 'manual') {
    return res.status(400).json({ error: 'Mode must be "auto" or "manual"' });
  }
  orchestratorState.mode = mode;
  broadcastOrchestratorState();
  res.json({ ok: true, mode });
});

/** Create an execution plan */
app.post('/api/orchestrator/plan', async (req, res) => {
  const { task, context: contextId } = req.body;
  if (!task) {
    return res.status(400).json({ error: 'Task description is required' });
  }

  // Create a plan structure
  const planId = crypto.randomUUID();
  const plan = {
    id: planId,
    task,
    status: 'planning',
    mode: orchestratorState.mode,
    lanes: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  orchestratorState.activePlan = plan;
  orchestratorState.taskHistory = [];
  broadcastOrchestratorState();

  // Send to agent for planning
  let ctx = contextId ? contexts.get(contextId) : null;
  if (!ctx) {
    // Try any active context
    ctx = Array.from(contexts.values()).find(c => true);
  }

  if (ctx) {
    try {
      const modeFlag = orchestratorState.mode === 'manual' ? 'manual' : 'auto';
      ctx.session.prompt(`/orchestrate ${modeFlag} ${task}`, { expandPromptTemplates: false }).catch(err => {
        console.error('[RudraX] Orchestration error:', err.message);
      });
    } catch (e) {
      // Non-blocking
    }
  }

  res.json({ ok: true, plan });
});

/** Stop execution plan */
app.post('/api/orchestrator/stop', (req, res) => {
  if (orchestratorState.activePlan) {
    orchestratorState.activePlan.status = 'stopped';
    orchestratorState.activePlan.updatedAt = Date.now();
  }
  broadcastOrchestratorState();
  res.json({ ok: true });
});

/** Reset orchestrator */
app.post('/api/orchestrator/reset', (req, res) => {
  orchestratorState = {
    mode: orchestratorState.mode,
    activePlan: null,
    activeAgent: null,
    activeSquad: orchestratorState.activeSquad,
    activeSquadAgents: orchestratorState.activeSquadAgents,
    taskHistory: [],
  };
  broadcastOrchestratorState();
  res.json({ ok: true });
});

/** Dispatch a specific agent */
app.post('/api/dispatch', async (req, res) => {
  const { agent, task, context: contextId } = req.body;
  if (!agent || !task) {
    return res.status(400).json({ error: 'Agent name and task are required' });
  }

  orchestratorState.activeAgent = agent;
  broadcastOrchestratorState();

  let ctx = contextId ? contexts.get(contextId) : null;
  if (!ctx) {
    ctx = Array.from(contexts.values()).find(c => true);
  }

  if (ctx) {
    try {
      ctx.session.prompt(`/dispatch ${agent} ${task}`, { expandPromptTemplates: false }).catch(err => {
        console.error('[RudraX] Dispatch error:', err.message);
      });
    } catch (e) {
      // Non-blocking
    }
  }

  res.json({ ok: true, agent, task });
});

/** Activate an agent (send /skill:agent-name via session) */
app.post('/api/agents/:name/activate', async (req, res) => {
  const agentName = req.params.name;
  const { context: contextId } = req.body;

  orchestratorState.activeAgent = agentName;
  broadcastOrchestratorState();

  let ctx = contextId ? contexts.get(contextId) : null;
  if (!ctx) {
    ctx = Array.from(contexts.values()).find(c => true);
  }

  if (ctx) {
    try {
      ctx.session.prompt(`/agency activate ${agentName}`, { expandPromptTemplates: false }).catch(err => {
        console.error('[RudraX] Agent activation error:', err.message);
      });
    } catch (e) {
      // Non-blocking
    }
  }

  res.json({ ok: true, agent: agentName });
});

/** Deactivate agent */
app.post('/api/agents/deactivate', (req, res) => {
  orchestratorState.activeAgent = null;
  broadcastOrchestratorState();
  res.json({ ok: true });
});

// ─── Shared Memory Endpoints ─────────────────────────────────────────────────

const MEMORY_DIR = join(os.homedir(), '.rudrax', 'agent', 'memory');

/** Ensure memory directory exists */
function ensureMemoryDir() {
  if (!fsSync.existsSync(MEMORY_DIR)) {
    fsSync.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

/** Safe context ID for filenames */
function safeMemoryId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** Read a memory file and return parsed JSON */
function readMemoryJSON(contextId) {
  const filePath = join(MEMORY_DIR, `${safeMemoryId(contextId)}.md`);
  try {
    const raw = fsSync.readFileSync(filePath, 'utf-8');
    if (!raw) return null;

    // Parse frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
    const fm = {};
    if (fmMatch) {
      for (const line of fmMatch[1].split('\n')) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (kv) { try { fm[kv[1]] = JSON.parse(kv[2]); } catch { fm[kv[1]] = kv[2]; } }
      }
    }

    const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

    // Parse structured sections
    const sections = {};
    const sectionRegex = /^## ([\w &]+)\n\n([\s\S]*?)(?=\n\n## |$)/gm;
    let m;
    while ((m = sectionRegex.exec(body)) !== null) {
      const title = m[1].toLowerCase().trim().replace(/ \&/g, '').replace(/ /g, '');
      sections[title] = m[2].trim();
    }

    return {
      project: fm.project || '',
      contextId: fm.context_id || contextId,
      created: fm.created || 0,
      updated: fm.updated || 0,
      status: fm.status || 'active',
      overview: sections.projectoverview || '',
      structure: sections.projectstructure || '',
      taskBoard: sections.taskboard || '',
      activityLog: sections.activitylog || '',
      decisions: sections.decisions || '',
      filesChanged: sections.fileschanged || '',
      blockers: sections.blockers || '',
      handoffs: sections.handoffs || '',
      notes: sections.notes || '',
      raw: raw,
    };
  } catch (e) {
    return null;
  }
}

/** Initialize a new memory file */
function initMemoryFile(contextId, projectName) {
  ensureMemoryDir();
  const now = Date.now();
  const safeId = safeMemoryId(contextId);
  const content = `---
project: ${JSON.stringify(projectName)}
context_id: ${JSON.stringify(contextId)}
created: ${now}
updated: ${now}
status: active
---

## Project Overview

${projectName} — Shared project memory for multi-agent coordination.

## Project Structure

*Last scanned: ${new Date(now).toISOString()}*

\`\`\`
(not yet scanned)
\`\`\`

## Task Board

*(No tasks tracked yet)*

## Activity Log

*(No activity yet)*

## Decisions

*(No decisions recorded yet)*

## Files Changed

*(No files tracked yet)*

## Blockers

*(No blockers — smooth sailing!)*

## Handoffs

*(No handoffs yet)*

## Notes

*(No notes)*
`;
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  fsSync.writeFileSync(filePath, content, 'utf-8');
  return readMemoryJSON(contextId);
}

/** Ensure memory for a context exists */
function ensureMemory(contextId) {
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  if (!fsSync.existsSync(filePath)) {
    return initMemoryFile(contextId, `Project ${contextId.slice(0, 8)}`);
  }
  return readMemoryJSON(contextId);
}

/** Get active context ID from request or state */
function getActiveContextId(req) {
  return req.body?.context || req.query?.context || null;
}

/** List all memory files */
app.get('/api/memory', (req, res) => {
  ensureMemoryDir();
  try {
    const files = fsSync.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    const memories = files.map(f => {
      const contextId = f.replace('.md', '');
      const mem = readMemoryJSON(contextId);
      return {
        contextId: mem?.contextId || contextId,
        project: mem?.project || 'Unknown',
        status: mem?.status || 'active',
        updated: mem?.updated || 0,
        created: mem?.created || 0,
      };
    }).sort((a, b) => b.updated - a.updated);
    res.json(memories);
  } catch (e) {
    res.json([]);
  }
});

/** Get memory for a specific context */
app.get('/api/memory/:contextId', (req, res) => {
  const { contextId } = req.params;
  const section = req.query.section;
  const mem = ensureMemory(contextId);
  if (!mem) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  if (section && mem[section] !== undefined) {
    return res.json({ contextId, section, content: mem[section] });
  }

  res.json(mem);
});

/** Get raw markdown for a context */
app.get('/api/memory/:contextId/raw', (req, res) => {
  const { contextId } = req.params;
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  try {
    const raw = fsSync.readFileSync(filePath, 'utf-8');
    res.type('text/markdown').send(raw);
  } catch (e) {
    res.status(404).send('# Memory not found');
  }
});

/** Initialize memory for a context */
app.post('/api/memory', (req, res) => {
  const { contextId, projectName } = req.body;
  if (!contextId) {
    return res.status(400).json({ error: 'contextId required' });
  }
  const mem = initMemoryFile(contextId, projectName || `Project ${contextId.slice(0, 8)}`);
  res.json({ ok: true, memory: mem });
});

/** Write entry to memory */
app.post('/api/memory/:contextId/write', (req, res) => {
  const { contextId } = req.params;
  const { type, agent, content, taskId, taskStatus, toAgent, filesChanged } = req.body;

  if (!type || !content) {
    return res.status(400).json({ error: 'type and content required' });
  }

  ensureMemory(contextId);
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  const raw = fsSync.readFileSync(filePath, 'utf-8');

  const now = new Date();
  const agentName = agent || 'unknown';
  const typeIcons = { task_result: '✅', decision: '💡', file_changed: '📝', structure_update: '🏗️', blocker: '🚫', handoff: '🤝', note: '📌' };

  // Update frontmatter timestamp
  let updated = raw.replace(/updated: \d+/, `updated: ${Date.now()}`);

  // Append to appropriate section
  const entryLine = `- **[${agentName}]** ${now.toLocaleString()} | ${type.toUpperCase()} | ${typeIcons[type] || '📌'} ${content}`;

  // Find the right section and append
  const sectionMap = {
    task_result: 'Activity Log',
    decision: 'Decisions',
    file_changed: 'Files Changed',
    structure_update: 'Project Structure',
    blocker: 'Blockers',
    handoff: 'Handoffs',
    note: 'Notes',
  };

  const targetSection = sectionMap[type] || 'Activity Log';
  const sectionHeader = `## ${targetSection}`;

  // Remove placeholder text from sections when adding real content
  const placeholders = [
    /\*\(No tasks tracked yet\)\*\n/,
    /\*\(No activity yet\)\*\n/,
    /\*\(No decisions recorded yet\)\*\n/,
    /\*\(No files tracked yet\)\*\n/,
    /\*\(No blockers — smooth sailing!\)\*\n/,
    /\*\(No handoffs yet\)\*\n/,
    /\*\(No notes\)\*\n/,
  ];
  for (const ph of placeholders) {
    updated = updated.replace(ph, '');
  }

  // Add to activity log (chronological feed of all agent activity)
  // Always log here so agents can see what others have done in timeline order
  if (type !== 'note') {
    const logPattern = /(## Activity Log\n\n)/;
    if (logPattern.test(updated)) {
      updated = updated.replace(logPattern, `$1${entryLine}\n`);
    }
  }

  // Add to specific section
  const specificPattern = new RegExp(`(## ${targetSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n)`);
  if (specificPattern.test(updated)) {
    if (type === 'file_changed') {
      const files = filesChanged || [content];
      const fileLines = files.map(f => `- \`${f}\``).join('\n');
      updated = updated.replace(specificPattern, `$1${fileLines}\n`);
    } else if (type === 'handoff') {
      const handoffLine = `- **[${agentName}]** → **${toAgent || 'next agent'}** | 🤝 ${content}`;
      updated = updated.replace(specificPattern, `$1${handoffLine}\n`);
    } else if (type !== 'structure_update') {
      updated = updated.replace(specificPattern, `$1${entryLine}\n`);
    }
  }

  // Handle structure_update specially
  if (type === 'structure_update') {
    const structPattern = /(## Project Structure\n\n\*Last scanned:[^*]+\*\n\n```[\s\S]*?```)/;
    if (structPattern.test(updated)) {
      updated = updated.replace(structPattern, `## Project Structure\n\n*Last scanned: ${now.toISOString()}*\n\n\`\`\`${content}\`\`\``);
    }
  }

  // Update task board if taskId provided
  if (taskId) {
    const taskStatusIcon = taskStatus === 'completed' ? '✅' : taskStatus === 'in_progress' ? '🔄' : taskStatus === 'blocked' ? '🚫' : '⏳';
    const taskLine = `| \`${taskId}\` | ${agentName} | ${taskStatusIcon} ${taskStatus || 'pending'} | ${content.slice(0, 80)} |`;
    const taskBoardPattern = /(## Task Board\n\n)/;
    if (taskBoardPattern.test(updated)) {
      // Simple string search instead of regex (avoids escaping issues)
      const taskIdMarker = '| `' + taskId + '`';
      if (updated.includes(taskIdMarker)) {
        // Update existing task row
        const lines = updated.split('\n');
        const taskLineIdx = lines.findIndex(l => l.includes(taskIdMarker));
        if (taskLineIdx >= 0) {
          lines[taskLineIdx] = taskLine;
          updated = lines.join('\n');
        }
      } else {
        // Add headers if first task, then add row
        if (!updated.includes('| Task ID |')) {
          const headers = '| Task ID | Agent | Status | Description |\n|---------|-------|--------|-------------|\n';
          updated = updated.replace(taskBoardPattern, `$1${headers}${taskLine}\n`);
        } else {
          updated = updated.replace(/(\|---------\|-------\|--------\|-------------\|\n)/, `$1${taskLine}\n`);
        }
      }
    }
  }
  // Update overview if provided
  if (req.body.overview) {
    const overviewPattern = /(## Project Overview\n\n)/;
    if (overviewPattern.test(updated)) {
      updated = updated.replace(overviewPattern, `$1${req.body.overview}\n`);
    }
  }

  fsSync.writeFileSync(filePath, updated, 'utf-8');

  // Broadcast memory update to connected clients
  const memData = readMemoryJSON(contextId);
  io.emit('memory_update', { contextId, memory: memData });

  res.json({ ok: true, type, agent: agentName });
});

/** Update project overview */
app.patch('/api/memory/:contextId/overview', (req, res) => {
  const { contextId } = req.params;
  const { overview, projectName } = req.body;
  ensureMemory(contextId);
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);

  try {
    let raw = fsSync.readFileSync(filePath, 'utf-8');

  if (projectName) {
    raw = raw.replace(/project: .*/, `project: ${JSON.stringify(projectName)}`);
  }
  if (overview) {
    raw = raw.replace(/(## Project Overview\n\n)[\s\S]*?(\n\n## )/, `$1${overview}\n$2`);
  }
  raw = raw.replace(/updated: \d+/, `updated: ${Date.now()}`);

  fsSync.writeFileSync(filePath, raw, 'utf-8');
  io.emit('memory_update', { contextId, memory: readMemoryJSON(contextId) });
  res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Resolve a blocker */
app.delete('/api/memory/:contextId/blockers/:index', (req, res) => {
  const { contextId, index } = req.params;
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  try {
    const raw = fsSync.readFileSync(filePath, 'utf-8');
    // Simple approach: remove blocker line by index
    const blockerSection = raw.match(/## Blockers\n\n([\s\S]*?)(\n\n## )/);
    if (blockerSection) {
      const lines = blockerSection[1].split('\n').filter(l => l.trim());
      const idx = parseInt(index);
      if (idx >= 0 && idx < lines.length) {
        lines.splice(idx, 1);
      }
      const newSection = lines.length > 0 ? lines.join('\n') + '\n' : '*(No blockers — smooth sailing!)*\n';
      const updated = raw.replace(
        /## Blockers\n\n[\s\S]*?(\n\n## )/,
        `## Blockers\n\n${newSection}$1`
      ).replace(/updated: \d+/, `updated: ${Date.now()}`);
      fsSync.writeFileSync(filePath, updated, 'utf-8');
      io.emit('memory_update', { contextId, memory: readMemoryJSON(contextId) });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Delete/reset memory for a context */
app.delete('/api/memory/:contextId', (req, res) => {
  const { contextId } = req.params;
  const safeId = safeMemoryId(contextId);
  const filePath = join(MEMORY_DIR, `${safeId}.md`);
  try {
    fsSync.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true }); // Already deleted
  }
});

// ─── Message Endpoints ──────────────────────────────────────────────────────

app.post('/message_async', async (req, res) => {
  const { text, context: contextId, message_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  let ctx = contextId ? contexts.get(contextId) : null;

  if (!ctx) {
    try {
      ctx = await createContext();
    } catch (err) {
      return res.status(500).json({ error: `Failed to create context: ${err.message}` });
    }
  }

  try {
    ctx.session.prompt(text, { expandPromptTemplates: false }).catch(err => {
      console.error('[RudraX] Stream error:', err.message);
      ctx.logs.push({
        no: ctx.logs.length + 1,
        id: crypto.randomUUID(),
        type: 'error',
        content: `Error: ${err.message}`,
        timestamp: Date.now(),
      });
      ctx.logVersion++;
      ctx.running = false;
      broadcastState(ctx);
    });

    res.json({ context: ctx.id, message_id });
  } catch (err) {
    console.error('[RudraX] Send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/poll', (req, res) => {
  const { context: contextId, log_from } = req.body;

  if (!contextId) {
    return res.json({
      deselect_chat: true,
      contexts: Array.from(contexts.values()).map(c => ({
        id: c.id,
        name: c.name,
        created: c.created,
        running: c.running,
        messageCount: c.logs.filter(l => l.type === 'user' || l.type === 'response').length,
      })),
    });
  }

  const ctx = contexts.get(contextId);
  if (!ctx) {
    return res.json({ deselect_chat: true });
  }

  const snapshot = getContextSnapshot(ctx);
  res.json(snapshot);
});

app.post('/api/pause', async (req, res) => {
  const { context: contextId, pause } = req.body;
  const ctx = contexts.get(contextId);
  if (!ctx) {
    return res.status(404).json({ error: 'Context not found' });
  }
  ctx.paused = !!pause;
  res.json({ paused: ctx.paused });
});

// ─── Terminal WebSocket ────────────────────────────────────────────────────

const terminals = new Map(); // socketId → child_process

io.on('connection', (socket) => {
  console.log('[RudraX] Client connected:', socket.id);

  socket.on('state_request', (data) => {
    const ctx = data?.context ? contexts.get(data.context) : null;
    if (ctx) {
      socket.emit('state_update', getContextSnapshot(ctx));
    } else {
      socket.emit('state_update', {
        deselect_chat: true,
        contexts: Array.from(contexts.values()).map(c => ({
          id: c.id,
          name: c.name,
          created: c.created,
          running: c.running,
        })),
      });
    }

    // Send orchestrator state on connect
    socket.emit('orchestrator_update', {
      mode: orchestratorState.mode,
      activePlan: orchestratorState.activePlan,
      activeAgent: orchestratorState.activeAgent,
      activeSquad: orchestratorState.activeSquad,
      activeSquadAgents: orchestratorState.activeSquadAgents,
      taskHistory: orchestratorState.taskHistory.slice(-50),
    });
  });

  // ─── Terminal: Create PTY session ───────────────────────────────

  socket.on('terminal_create', (opts = {}) => {
    // Kill any existing terminal for this socket
    if (terminals.has(socket.id)) {
      try { terminals.get(socket.id).kill(); } catch (e) {}
      terminals.delete(socket.id);
    }

    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash');
    const cwd = opts.cwd || process.cwd();

    const proc = spawn(shell, ['--login'], {
      cwd,
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    terminals.set(socket.id, proc);

    proc.stdout.on('data', (data) => {
      socket.emit('terminal_data', data.toString('utf-8'));
    });

    proc.stderr.on('data', (data) => {
      socket.emit('terminal_data', data.toString('utf-8'));
    });

    proc.on('exit', (code) => {
      socket.emit('terminal_exit', { code });
      terminals.delete(socket.id);
    });

    proc.on('error', (err) => {
      socket.emit('terminal_data', `\r\n\x1b[31mTerminal error: ${err.message}\x1b[0m\r\n`);
      terminals.delete(socket.id);
    });

    // Send initial prompt
    socket.emit('terminal_ready', { shell, cwd });
    console.log(`[RudraX] Terminal created for ${socket.id}: ${shell}`);
  });

  socket.on('terminal_input', (data) => {
    const proc = terminals.get(socket.id);
    if (proc && proc.stdin.writable) {
      proc.stdin.write(data);
    }
  });

  socket.on('terminal_resize', ({ cols, rows }) => {
    // Note: child_process doesn't support resize natively.
    // For full PTY support, install node-pty: npm install node-pty
    // We send SIGWINCH-like signal to let the shell know
    const proc = terminals.get(socket.id);
    if (proc) {
      try {
        // Best-effort: set COLUMNS/LINES env
        process.env.COLUMNS = cols;
        process.env.LINES = rows;
      } catch (e) {}
    }
  });

  socket.on('terminal_kill', () => {
    const proc = terminals.get(socket.id);
    if (proc) {
      proc.kill();
      terminals.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('[RudraX] Client disconnected:', socket.id);
    // Clean up terminal
    const proc = terminals.get(socket.id);
    if (proc) {
      proc.kill();
      terminals.delete(socket.id);
    }
  });
});

// ─── Start / Export ─────────────────────────────────────────────────────────

function gracefulShutdown(signal) {
  console.log(`\n[RudraX WebUI] Shutting down (${signal})...`);

  for (const [id, ctx] of contexts) {
    try {
      if (ctx.session && ctx.session.dispose) {
        ctx.session.dispose();
      }
    } catch (e) {
      console.error(`[RudraX WebUI] Error disposing session ${id}:`, e.message);
    }
  }

  // Kill all terminals
  for (const [id, proc] of terminals) {
    try { proc.kill(); } catch (e) {}
  }

  io.close();
  httpServer.close();
  if (process.env.RUDRAX_WEBUI_CHILD !== '1') {
    process.exit(0);
  }
}

function startServer(port) {
  const serverPort = port || PORT;
  return new Promise((resolve, reject) => {
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${serverPort} is already in use. Try a different port:`);
        console.error(`   RUDRAX_WEBUI_PORT=8080 node webui/server.js`);
        console.error(`   node webui/server.js 8080\n`);
        reject(err);
        return;
      }
      reject(err);
    });

    httpServer.listen(serverPort, () => {
      console.log('');
      console.log('  ╔══════════════════════════════════════════════╗');
      console.log('  ║    🔱 RudraX — Rudraksh Edition 🔱           ║');
      console.log('  ║    Build · Break · Deploy · Orchestrate      ║');
      console.log('  ╠══════════════════════════════════════════════╣');
      console.log(`  ║  http://localhost:${serverPort}                      ║`);
      console.log('  ║  🤖 191 Agents  🎭 9 Squads  🧠 Orchestrator  ║');
      console.log('  ╚══════════════════════════════════════════════╝');
      console.log('');
      console.log('  💡 Tip: Install node-pty for full terminal PTY support');
      console.log('     npm install node-pty\n');
      resolve(serverPort);
    });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Export for module usage OR auto-start ───────────────────────────────────

export { startServer, gracefulShutdown, contexts, io };

// Auto-start when run directly (not when imported as module)
import { pathToFileURL } from 'url';
const isMainModule = process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1] || pathToFileURL(process.argv[1]).href === import.meta.url);
if (isMainModule) {
  startServer(PORT);
}