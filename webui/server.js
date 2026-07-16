/**
 * RudraX Army Web UI Server - Command & Control Edition
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
import nodemailer from 'nodemailer';
import { mountProviderApi } from './provider-api.js';

// ═══ Email Configuration ═══
const EMAIL_CONFIG = {
  enabled: process.env.RUDRAX_EMAIL_ENABLED !== 'false',
  host: process.env.RUDRAX_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.RUDRAX_SMTP_PORT || '587', 10),
  secure: process.env.RUDRAX_SMTP_SECURE === 'true',
  user: process.env.RUDRAX_SMTP_USER || '',
  pass: process.env.RUDRAX_SMTP_PASS || '',
  from: process.env.RUDRAX_EMAIL_FROM || 'noreply@rudrax.cloud',
  adminTo: 'admin@neelverse.org',
};

let _transporter = null;
function getMailTransporter() {
  if (!EMAIL_CONFIG.enabled || !EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
    console.warn('[Email] SMTP not configured. Set RUDRAX_SMTP_USER and RUDRAX_SMTP_PASS env vars. Falling back to log-only.');
    return null;
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: { user: EMAIL_CONFIG.user, pass: EMAIL_CONFIG.pass },
    });
  }
  return _transporter;
}

async function sendEmailNotification({ subject, html, text }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[Email][LOG-ONLY] To: ${EMAIL_CONFIG.adminTo}, Subject: ${subject}`);
    return { sent: false, reason: 'SMTP not configured' };
  }
  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminTo,
      subject: `[RudraX] ${subject}`,
      html,
      text,
    });
    console.log(`[Email] Sent: ${subject}`);
    return { sent: true };
  } catch (e) {
    console.error(`[Email] Failed: ${subject} - ${e.message}`);
    return { sent: false, reason: e.message };
  }
}
import { readdir, readFile } from 'fs/promises';
import * as fsSync from 'fs';
import { spawn } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ─── Auth ───────────────────────────────────────────────────────────────────

const AUTH_DIR = join(os.homedir(), '.rudrax');
const AUTH_FILE = join(AUTH_DIR, 'webui-auth.json');
const JWT_SECRET = crypto.randomBytes(32).toString('hex'); // Rotates on server restart
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Load or initialize auth store
function loadAuthStore() {
  try {
    if (fsSync.existsSync(AUTH_FILE)) {
      return JSON.parse(fsSync.readFileSync(AUTH_FILE, 'utf-8'));
    }
  } catch (e) { /* corrupt file, recreate */ }
  return null;
}

function saveAuthStore(store) {
  if (!fsSync.existsSync(AUTH_DIR)) fsSync.mkdirSync(AUTH_DIR, { recursive: true });
  fsSync.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2));
}

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, salt, hash) {
  const { hash: computed } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

// Initialize default admin/password
let authStore = loadAuthStore();
if (!authStore) {
  const { hash, salt } = hashPassword('password');
  authStore = { username: 'admin', hash, salt, createdAt: Date.now() };
  saveAuthStore(authStore);
  console.log('[RudraX Army] 🔐 Default credentials: admin / password');
}

// JWT helpers
function createToken(username) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + TOKEN_EXPIRY) / 1000),
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp * 1000 < Date.now()) return null;
    return data;
  } catch { return null; }
}

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = auth.slice(7);
  const data = verifyToken(token);
  if (!data) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = data;
  next();
}

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
app.use(express.static(join(__dirname), { setHeaders: (res) => { res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
app.use('/socket.io', express.static(join(process.cwd(), 'node_modules', 'socket.io', 'client-dist')));

// ═══ Auth Middleware - protect all /api/ routes ═══
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (req.path === '/api/login' || req.path === '/api/health' || req.path === '/api/contact' || req.path === '/api/subscribe') return next();
  // Public GET for blog listing and single posts
  if (req.method === 'GET' && (req.path === '/api/blog' || (req.path.startsWith('/api/blog/') && !req.path.startsWith('/api/blog/admin/')))) return next();
  requireAuth(req, res, next);
});

// Protect non-/api/ endpoints too
const authGuard = (req, res, next) => requireAuth(req, res, next);

// ═══ Auth Endpoints ═══
app.post('/api/login', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body. Use Content-Type: application/json' });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  // Reload auth store (allows password changes to take effect without restart)
  const store = loadAuthStore() || authStore;
  if (username !== store.username || !verifyPassword(password, store.salt, store.hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = createToken(username);
  res.json({ ok: true, token, username, expiresAt: Date.now() + TOKEN_EXPIRY });
});

app.post('/api/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' });
  }
  const store = loadAuthStore() || authStore;
  if (!verifyPassword(currentPassword, store.salt, store.hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const { hash, salt } = hashPassword(newPassword);
  authStore = { username: store.username, hash, salt, updatedAt: Date.now() };
  saveAuthStore(authStore);
  res.json({ ok: true, message: 'Password changed successfully. Use new password on next login.' });
});

// Favicon route
app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/favicon.svg');
});

// ─── State ──────────────────────────────────────────────────────────────────

const contexts = new Map(); // contextId → { session, name, created, logs[], logVersion, logGuid, running }

// Mounted after the API auth guard. A switch updates both the persisted default
// and the active AgentSession when a context id is supplied by the WebUI.
mountProviderApi(app, {
  authPath: join(getAgentDir(), 'auth.json'),
  modelsPath: join(getAgentDir(), 'models.json'),
  settingsPath: join(getAgentDir(), 'settings.json'),
  onSwitchModel: async ({ provider, model, context }) => {
    const ctx = contexts.get(context);
    if (!ctx) throw new Error('Context not found');
    ctx.session.modelRegistry.authStorage.reload();
    ctx.session.modelRegistry.refreshModelsOnly();
    const selected = ctx.session.modelRegistry.find(provider, model);
    if (!selected || !ctx.session.modelRegistry.hasConfiguredAuth(selected)) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    await ctx.session.setModel(selected);
  },
  onConfigChange: async ({ provider, action }) => {
    for (const ctx of contexts.values()) {
      try {
        const current = ctx.session.model;
        ctx.session.modelRegistry.authStorage.reload();
        ctx.session.modelRegistry.refreshModelsOnly();
        if (!current || current.provider !== provider) continue;
        const refreshed = ctx.session.modelRegistry.find(current.provider, current.id);
        if (refreshed && ctx.session.modelRegistry.hasConfiguredAuth(refreshed)) {
          await ctx.session.setModel(refreshed);
          continue;
        }
        const fallback = ctx.session.modelRegistry.getAvailable()[0];
        if (fallback) await ctx.session.setModel(fallback);
        else console.warn(`[RudraX] ${action} ${provider}; context ${ctx.id} has no configured fallback model`);
      } catch (error) {
        console.error(`[RudraX] Failed to refresh context ${ctx.id} after provider ${action}:`, error.message);
      }
    }
  },
});

// ─── Orchestration State ────────────────────────────────────────────────────

let orchestratorState = {
  mode: 'auto',           // 'auto' | 'manual'
  activePlan: null,       // ExecutionPlan object or null
  activeAgent: null,      // Currently dispatched specialist agent
  activeSquad: null,      // Currently active squad name
  activeSquadAgents: [],  // Agents in the active squad
  taskHistory: [],        // Completed tasks
  commandRole: 'RudraX-Chief of Staff', // 🔱 Primary command role
  deputyRole: 'Deputy Chief of Staff',   // 🎛️ Planning/orchestration role
  hierarchy: {
    level1: '🔱 RudraX-Chief of Staff - Strategic Commander',
    level2: '🎛️ Deputy Chief of Staff - Operational Commander',
    level3: '🤖 Specialist Agents & Squads - 349 agents / 45+ divisions'
  }
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
    agents: ["engineering-security-engineer", "compliance-auditor", "engineering-code-reviewer", "engineering-devops-automator", "blockchain-security-auditor"],
  },
  qalead: {
    name: "QA & Testing Squad",
    emoji: "✅",
    color: "#27ae60",
    description: "Quality assurance and testing specialists",
    agents: ["engineering-code-reviewer", "testing-api-tester", "testing-performance-benchmarker", "testing-evidence-collector", "testing-reality-checker"],
  },
  aiinfra: {
    name: "AI Infrastructure Squad",
    emoji: "🤖",
    color: "#3498db",
    description: "AI/ML engineering and infrastructure team",
    agents: ["engineering-ai-engineer", "engineering-backend-architect", "engineering-devops-automator", "specialized-mcp-builder", "vllm"],
  },
  web3: {
    name: "Web3 & Blockchain Squad",
    emoji: "⛓️",
    color: "#f39c12",
    description: "Blockchain and smart contract development team",
    agents: ["engineering-solidity-smart-contract-engineer", "blockchain-security-auditor", "solana", "evm", "engineering-backend-architect"],
  },
  growth: {
    name: "Growth Marketing Squad",
    emoji: "📈",
    color: "#2ecc71",
    description: "Marketing and growth specialists",
    agents: ["marketing-growth-hacker", "marketing-content-creator", "marketing-social-media-strategist", "paid-media-paid-social-strategist", "product-feedback-synthesizer"],
  },
  incident: {
    name: "Incident Response Squad",
    emoji: "🚨",
    color: "#e74c3c",
    description: "Production incident management team",
    agents: ["engineering-devops-automator", "engineering-security-engineer", "support-executive-summary-generator", "docker-management", "systematic-debugging"],
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
        // Use client-provided message ID if available to prevent duplicates
        const userId = (ctx && ctx.pendingUserMessageId) ? ctx.pendingUserMessageId : `user-${ts}`;
        if (ctx) ctx.pendingUserMessageId = null; // Clear after use
        return { no: 0, id: userId, type: 'user', content: text, timestamp: ts };
      }
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        const agName = orchestratorState.activeAgent || null;
        const sqName = orchestratorState.activeSquad || null;
        return { no: 0, id: `response-${turnNum}`, type: 'response', content: '', timestamp: ts, _streaming: true, agentName: agName, squadName: sqName };
      }
      return null;
    }

    case 'message_update': {
      const msg = event.message || {};
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        const agName = orchestratorState.activeAgent || null;
        const sqName = orchestratorState.activeSquad || null;
        let text = '';
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
        }
        return {
          no: 0, id: `response-${turnNum}`, type: 'response', content: text, timestamp: ts,
          _update: true, agentName: agName, squadName: sqName,
        };
      }
      return null;
    }

    case 'message_end': {
      const msg = event.message || {};
      if (msg.role === 'assistant') {
        const turnNum = ctx ? (ctx.turnCounter || 1) : 1;
        const agName = orchestratorState.activeAgent || null;
        const sqName = orchestratorState.activeSquad || null;
        let text = '';
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
        }
        return { no: 0, id: `response-${turnNum}`, type: 'response', content: text, timestamp: ts, _final: true, agentName: agName, squadName: sqName };
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
      // Store compaction message ID so we can update it on compaction_end
      if (ctx) ctx._compactionMsgId = `compact-${ts}`;
      return { no: 0, id: ctx?._compactionMsgId || `compact-${ts}`, type: 'agent', heading: '📦 Compacting...', content: event.reason || 'Auto-compaction', timestamp: ts };

    case 'compaction_end': {
      const compactId = ctx?._compactionMsgId;
      if (ctx) ctx._compactionMsgId = null;
      const success = !event.aborted && !event.errorMessage;
      const heading = success ? '✅ Compaction complete' : (event.aborted ? '⏹ Compaction aborted' : '❌ Compaction failed');
      const content = event.errorMessage || (success ? '' : event.reason || '');
      // If we have the compaction message ID, update it; otherwise create a new entry
      if (compactId) {
        return { no: 0, id: compactId, type: 'agent', heading, content, timestamp: ts, _update: true };
      }
      return { no: 0, id: `compact-end-${ts}`, type: 'agent', heading, content, timestamp: ts };
    }

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
      lastActivity: Date.now(),
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
  ctx.lastActivity = Date.now();
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
  } else if (event.type === 'compaction_start') {
    ctx.running = true;
  } else if (event.type === 'compaction_end') {
    ctx.running = false;
  } else if (event.type === 'auto_retry_start') {
    ctx.running = true;
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
        agent: entry.agentName || (entry.type === 'response' ? 'RudraX-Chief of Staff' : (entry.kvps?.agent || entry.kvps?.tool_name || 'system')),
        squad: entry.squadName || null,
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
    // First streaming chunk - add new entry
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
    // Non-critical - don't break the main flow
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
    commandRole: orchestratorState.commandRole,
    deputyRole: orchestratorState.deputyRole,
    hierarchy: orchestratorState.hierarchy,
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
  res.json({ status: 'ok', version: '4.6.0', name: 'RudraX Army', features: ['chat', 'agency', 'orchestrator', 'terminal', 'security', 'vector-kb', 'comm-bus', 'approval-gates', 'reflection', 'observability', 'web-search', 'workflows', 'knowledge-graph', 'tool-registry', 'cost-tracking', 'scheduler', 'evaluator', 'multi-modal', 'guardrails', 'code-sandbox'] });
});

app.get('/api/settings', (req, res) => {
  res.json({ theme: 'dark', fontSize: 14, model: 'default' });
});

app.put('/api/settings', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { theme, fontSize } = req.body;
    const settings = { theme: 'dark', fontSize: 14, model: 'default' };
    const validThemes = ['dark', 'light', 'auto'];
    if (theme && validThemes.includes(theme)) settings.theme = theme;
    const fs = parseInt(fontSize, 10);
    if (!isNaN(fs) && fs >= 10 && fs <= 24) settings.fontSize = fs;
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: 'Invalid settings request' });
  }
});

// ═══ Security - Live simulation of cyber threats (inline mock) ═══════════

const SECURITY = {
  threats: [], alerts: [], trafficHistory: [], authAttempts: [], events: [],
  metrics: {
    totalThreats: 0, blockedIPs: 0, activeConnections: 0, avgResponseTime: 0,
    cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkThroughput: 0,
    packetsInspected: 0, threatLevel: 'low', uptime: 0
  },
  startTime: Date.now(),
};

function secRand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function secPick(arr) { return arr[secRand(0, arr.length - 1)]; }
function secChance(pct) { return Math.random() * 100 < pct; }

const THREAT_DEFS = [
  { type: 'DDoS', severity: 'critical', icon: '☠️', color: '#ff0040' },
  { type: 'Brute Force', severity: 'high', icon: '🔨', color: '#ff6b00' },
  { type: 'Malware', severity: 'critical', icon: '🦠', color: '#ff0040' },
  { type: 'Phishing', severity: 'high', icon: '🎣', color: '#ff6b00' },
  { type: 'Port Scan', severity: 'medium', icon: '🔍', color: '#ffaa00' },
  { type: 'SQL Injection', severity: 'critical', icon: '💉', color: '#ff0040' },
  { type: 'XSS', severity: 'high', icon: '💀', color: '#ff6b00' },
  { type: 'Ransomware', severity: 'critical', icon: '🔒', color: '#ff0040' },
  { type: 'DNS Tunneling', severity: 'medium', icon: '🕳️', color: '#ffaa00' },
  { type: 'Zero-Day', severity: 'critical', icon: '⚠️', color: '#ff0040' },
  { type: 'Credential Stuffing', severity: 'high', icon: '👤', color: '#ff6b00' },
];
const SRC_IPS = ['185.220.101', '91.121.87', '45.33.32', '104.248.50', '192.168.1', '10.0.0', '172.16.0', '203.0.113', '198.51.100', '192.0.2'];
const TARGETS = ['api.corp.internal', 'db-primary.local', 'web-gateway.corp', 'mail-server.corp', 'vpn-gateway.corp', 'auth-service.corp', 'file-server.corp', 'dns-primary.corp'];
const COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'NG', 'BR', 'VN', 'UA'];

function secGenThreat() {
  const def = secPick(THREAT_DEFS);
  return {
    id: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(), ...def,
    sourceIP: `${secPick(SRC_IPS)}.${secRand(1, 254)}`,
    target: secPick(TARGETS),
    country: secPick(COUNTRIES),
    port: secRand(1, 65535),
    protocol: secPick(['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP']),
    status: 'active', confidence: secRand(75, 99), mitigated: false
  };
}

function secGenTraffic() {
  return {
    timestamp: Date.now(), inbound: secRand(800, 9500),
    outbound: secRand(400, 6000), total: 0,
    packets: secRand(1000, 50000), connections: secRand(50, 800)
  };
}

function secTick() {
  const m = SECURITY.metrics;
  m.totalThreats = SECURITY.threats.length;
  m.activeConnections = secRand(1200, 8500);
  m.avgResponseTime = Math.round((secRand(5, 95) + Math.random()) * 10) / 10;
  m.cpuUsage = Math.round((secRand(12, 88) + Math.random()) * 10) / 10;
  m.memoryUsage = Math.round((secRand(30, 82) + Math.random()) * 10) / 10;
  m.diskUsage = Math.round((secRand(40, 92) + Math.random()) * 10) / 10;
  m.networkThroughput = secRand(200, 4000);
  m.packetsInspected += secRand(1000, 25000);
  m.uptime = Math.floor((Date.now() - SECURITY.startTime) / 1000);

  const critCount = SECURITY.threats.filter(t => t.severity === 'critical').length;
  const highCount = SECURITY.threats.filter(t => t.severity === 'high').length;
  if (critCount > 3) m.threatLevel = 'critical';
  else if (critCount > 0 || highCount > 5) m.threatLevel = 'high';
  else if (highCount > 0 || SECURITY.threats.length > 10) m.threatLevel = 'medium';
  else m.threatLevel = 'low';

  SECURITY.threats.forEach(t => {
    if (!t.mitigated && t.severity === 'critical' && secChance(35)) {
      t.mitigated = true; t.status = 'mitigated'; m.blockedIPs++;
    }
  });

  // Traffic
  const tick = secGenTraffic();
  tick.total = tick.inbound + tick.outbound;
  SECURITY.trafficHistory.push(tick);
  if (SECURITY.trafficHistory.length > 60) SECURITY.trafficHistory.shift();

  // New threats
  if (secChance(40)) {
    SECURITY.threats.push(secGenThreat());
    if (SECURITY.threats.length > 30) SECURITY.threats.shift();
  }

  // Alerts
  const active = SECURITY.threats.filter(t => t.status === 'active');
  if (active.length > 0 && secChance(30)) {
    const t = secPick(active);
    SECURITY.alerts.push({
      id: crypto.randomUUID().slice(0, 8), timestamp: new Date().toISOString(),
      threatId: t.id, type: t.type, severity: t.severity,
      message: `${t.icon} ${t.type} - ${t.sourceIP} → ${t.target}`,
      acknowledged: false
    });
    if (SECURITY.alerts.length > 30) SECURITY.alerts.shift();
    // Also broadcast via socket
    io.emit('agent_activity', {
      ts: Date.now(), type: 'security', agent: '🛡️ Security',
      content: `${t.icon} ${t.type} from ${t.sourceIP}`, action: 'threat_detected'
    });
  }
}

// Seed initial data
for (let i = 0; i < 30; i++) SECURITY.trafficHistory.push(secGenTraffic());
for (let i = 0; i < 8; i++) SECURITY.threats.push(secGenThreat());
SECURITY.metrics.packetsInspected = secRand(50000, 200000);
secTick();
setInterval(secTick, 2500);

app.get('/api/security/snapshot', (req, res) => {
  secTick(); // Ensure fresh data
  const m = { ...SECURITY.metrics };
  res.json({
    metrics: m,
    threats: [...SECURITY.threats].slice(-20),
    alerts: [...SECURITY.alerts].slice(-15),
    trafficHistory: [...SECURITY.trafficHistory],
    timestamp: Date.now()
  });
});

app.get('/api/security/status', (req, res) => {
  res.json({
    online: true,
    threats: SECURITY.threats.length,
    threatLevel: SECURITY.metrics.threatLevel,
    uptime: SECURITY.metrics.uptime
  });
});

// ═══ Session Export ═══════════════════════════════════════════════════════

app.get('/api/export/:contextId', (req, res) => {
  const ctx = contexts.get(req.params.contextId);
  if (!ctx) return res.status(404).json({ error: 'Context not found' });

  const lines = ctx.logs.map(log => {
    const ts = new Date(log.timestamp).toISOString();
    switch (log.type) {
      case 'user': return `## 👤 User (${ts})\n\n${log.content || ''}\n`;
      case 'response': return `## 🤖 RudraX (${ts})\n\n${log.content || ''}\n`;
      case 'tool': return `### 🔧 ${log.heading || 'Tool'} (${ts})\n\n\`\`\`\n${log.content || ''}\n\`\`\`\n`;
      default: return `### ${log.heading || log.type || 'Entry'} (${ts})\n\n${log.content || ''}\n`;
    }
  }).join('\n---\n\n');

  const markdown = `# RudraX Army - Session Export\n\n**Context:** ${ctx.name}\n**Exported:** ${new Date().toISOString()}\n**Messages:** ${ctx.logs.length}\n\n${lines}`;
  res.type('text/markdown').send(markdown);
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
    general: '#78909c',
    healthcare: '#e91e63',
    government: '#607d8b',
    legal: '#8d6e63',
    hospitality: '#ff8a65',
    retail: '#ff7043',
    hr: '#26c6da',
    realestate: '#8d6e63',
    recruitment: '#26c6da',
    'supply-chain': '#66bb6a',
    bioinformatics: '#00acc1',
    'drug-discovery': '#7cb342',
    'fitness-nutrition': '#66bb6a',
    music: '#ab47bc',
    game: '#e74c3c',
    media: '#ec407a',
    osint: '#5c6bc0',
    'ai-ml': '#3498db',
    'data-science': '#26a69a',
    mlops: '#42a5f5',
    productivity: '#ab47bc',
    research: '#78909c',
    cloud: '#29b6f6',
    robotics: '#ef5350',
    iot: '#26c6da',
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
  const { context: contextId } = req.body || {};

  // Validate agent name against available skills
  try {
    const skills = await loadAgencySkills();
    const validNames = skills.map(s => s.name);
    if (!validNames.includes(agentName)) {
      return res.status(404).json({ error: `Unknown agent: ${agentName}. Use /api/agents to list available agents.` });
    }
  } catch (e) {
    // If skills can't be loaded, still allow activation (might be a runtime agent)
  }

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

${projectName} - Shared project memory for multi-agent coordination.

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

*(No blockers - smooth sailing!)*

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
    /\*\(No blockers - smooth sailing!\)\*\n/,
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
      const newSection = lines.length > 0 ? lines.join('\n') + '\n' : '*(No blockers - smooth sailing!)*\n';
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

app.post('/message_async', authGuard, async (req, res) => {
  const { text, context: contextId, message_id, files } = req.body;

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

  // Store client message ID so eventToLogEntry can use it for the user message
  ctx.pendingUserMessageId = message_id;

  // Check if agent is already processing - inform client to use steering
  if (ctx.running) {
    ctx.pendingUserMessageId = null; // Clear - client will show steer panel instead
    return res.status(409).json({
      error: 'Agent is already processing. Use steering options (followUp/steer/stop) to interact.',
      code: 'ALREADY_PROCESSING',
      context: ctx.id,
    });
  }

  try {
    // If files are attached, include file info
    let promptText = text;
    if (files && files.length > 0) {
      const fileList = files.map(f => `- ${f.name} (${(f.size / 1024).toFixed(1)}KB, ${f.type})`).join('\n');
      promptText = `${text}\n\n## Attached Files\n${fileList}\n\nPlease analyze these files if needed.`;
    }

    ctx.session.prompt(promptText, { expandPromptTemplates: false }).catch(err => {
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

// ── Manual stuck-state recovery endpoint ──────────────────────────────────
app.post('/force_unstick', authGuard, (req, res) => {
  const { context: contextId } = req.body;
  const ctx = contextId ? contexts.get(contextId) : null;
  if (!ctx) {
    return res.status(404).json({ error: 'Context not found' });
  }
  console.warn(`[RudraX] Force unsticking context ${ctx.id}`);
  ctx.running = false;
  ctx.lastActivity = Date.now();
  broadcastState(ctx);
  res.json({ ok: true, context: ctx.id });
});

app.post('/poll', authGuard, (req, res) => {
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

// ─── Steering / Follow-Up Endpoint ──────────────────────────────────────
// Allows sending follow-up messages while agent is processing
app.post('/api/steer', async (req, res) => {
  const { text, context: contextId, mode } = req.body;

  if (!text || !contextId) {
    return res.status(400).json({ error: 'text and context required' });
  }

  const ctx = contexts.get(contextId);
  if (!ctx) {
    return res.status(404).json({ error: 'Context not found' });
  }

  try {
    switch (mode) {
      case 'followUp':
        // Queue the message - agent will process it after current task
        ctx.session.prompt(`[FOLLOW-UP]: ${text}`, { expandPromptTemplates: false, streamingBehavior: 'followUp' }).catch(err => {
          console.error('[RudraX] Follow-up error:', err.message);
        });
        break;
      case 'steer':
        // Interrupt and redirect
        ctx.session.prompt(`[STEER]: ${text}`, { expandPromptTemplates: false, streamingBehavior: 'steer' }).catch(err => {
          console.error('[RudraX] Steer error:', err.message);
        });
        break;
      case 'stop':
        // Stop the current task
        ctx.running = false;
        ctx.lastActivity = Date.now();
        broadcastState(ctx);
        break;
      default:
        return res.status(400).json({ error: 'Invalid mode. Use: followUp, steer, or stop' });
    }

    // Broadcast agent activity for steering
    broadcastAgentActivity({
      type: 'system',
      agent: 'You',
      content: `Steering (${mode}): ${text.slice(0, 80)}`,
      action: mode,
    });

    res.json({ ok: true, mode });
  } catch (err) {
    console.error('[RudraX] Steer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Terminal WebSocket ────────────────────────────────────────────────────

const terminals = new Map(); // socketId → child_process

// ═══ Socket.IO Auth Middleware ═══
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  const data = verifyToken(token);
  if (!data) return next(new Error('Invalid or expired token'));
  socket.user = data;
  next();
});

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

// ─── New API Endpoints for v4.6.0 Advanced Features ──────

// ═══ Agent evaluation endpoints ═══
app.get('/api/evaluations', (req, res) => {
  res.json({
    suites: ['code-gen', 'reasoning', 'security', 'design'],
    history: []  // Would be loaded from eval store
  });
});

// ═══ Knowledge graph endpoints ═══
app.get('/api/knowledge-graph/:contextId', (req, res) => {
  res.json({ nodes: [], edges: [] });
});

// ═══ Vector store status ═══
app.get('/api/vector-store/:contextId', (req, res) => {
  res.json({ entries: 0, dimensions: 256, status: 'ready' });
});

// ═══ Communication bus status ═══
app.get('/api/bus/:contextId', (req, res) => {
  res.json({ topics: ['general', 'alerts', 'status', 'handoffs'], messages: 0 });
});

// ═══ Cost analytics ═══
app.get('/api/costs/:contextId', (req, res) => {
  res.json({ totalCost: 0, totalTokens: 0, dailyCost: 0 });
});

// ═══ Guardrails check via API ═══
app.post('/api/guardrails/check', (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Content required' });
  // Simple PII check
  const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;
  const apiKeyPattern = /sk-[A-Za-z0-9]{20,}/g;
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const findings = [];
  if (emailPattern.test(content)) findings.push('Email addresses detected');
  if (apiKeyPattern.test(content)) findings.push('API keys detected');
  if (ssnPattern.test(content)) findings.push('Social Security Numbers detected');
  res.json({ passed: findings.length === 0, findings });
});

// ═══ Workflow definitions ═══
app.get('/api/workflows', (req, res) => {
  res.json({
    workflows: [
      { id: 'code-review', name: 'Code Review Pipeline', steps: 4, tags: ['code', 'review'] },
      { id: 'security-audit', name: 'Security Audit', steps: 4, tags: ['security', 'audit'] },
      { id: 'bug-fix', name: 'Bug Fix Pipeline', steps: 4, tags: ['bug', 'fix'] },
      { id: 'deploy-check', name: 'Pre-Deploy Checklist', steps: 5, tags: ['deploy', 'ci'] },
    ]
  });
});

// ═══ Task scheduler endpoints ═══
app.get('/api/schedules', (req, res) => {
  res.json({ tasks: [] });
});

// ═══ Custom tools registry ═══
app.get('/api/custom-tools', (req, res) => {
  res.json({ tools: [] });
});

// ═══ System capabilities ═══
app.get('/api/capabilities', (req, res) => {
  res.json({
    version: '4.6.0',
    features: [
      { id: 'vector-knowledge', name: '🧠 Vector Knowledge Base', description: 'Semantic search & RAG across all project memory' },
      { id: 'communication-bus', name: '📡 Communication Bus', description: 'Pub/sub messaging between agents' },
      { id: 'approval-gates', name: '🛡️ Approval Gates', description: 'Human-in-the-loop safety system' },
      { id: 'reflection-engine', name: '🔍 Self-Reflection Engine', description: 'Self-critique and quality analysis' },
      { id: 'observability', name: '📊 Observability', description: 'Full tracing and monitoring' },
      { id: 'web-search', name: '🌐 Web Search & Browsing', description: 'Live web intelligence' },
      { id: 'workflow-engine', name: '⚙️ DAG Workflow Engine', description: 'Multi-step automation' },
      { id: 'knowledge-graph', name: '🕸️ Knowledge Graph', description: 'Entity-relationship knowledge base' },
      { id: 'tool-registry', name: '🔧 Dynamic Tool Registry', description: 'Agent-created custom tools' },
      { id: 'cost-tracker', name: '💰 Cost Tracker', description: 'LLM usage & spend analytics' },
      { id: 'task-scheduler', name: '⏰ Task Scheduler', description: 'Recurring automated tasks' },
      { id: 'agent-evaluator', name: '🏆 Agent Evaluator', description: 'Benchmarking and scoring' },
      { id: 'multi-modal', name: '🖼️ Multi-modal Engine', description: 'Image and file processing' },
      { id: 'guardrails', name: '🛡️ Guardrails', description: 'Content filtering and validation' },
      { id: 'code-sandbox', name: '📦 Code Sandbox', description: 'Secure isolated code execution' },
    ]
  });
});

// ═══ Contact Form & Newsletter Endpoints ═══
app.post('/api/contact', express.json(), (req, res) => {
  try {
    const { name, email, company, service, message } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const entry = {
      id: Date.now().toString(36),
      name, email, company: company || '',
      service: service || '',
      message: message || '',
      timestamp: new Date().toISOString(),
      ip: req.ip || req.socket.remoteAddress,
    };
    const logDir = join(dirname(fileURLToPath(import.meta.url)), 'data');
    import('fs').then(fs => {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = join(logDir, 'contacts.json');
      let records = [];
      try { records = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
      records.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(records, null, 2));
    });
    console.log(`[Contact] ${name} <${email}> - ${company || 'N/A'} / ${service || 'General'}`);
    sendEmailNotification({
      subject: `New Contact: ${name} from ${company || email}`,
      html: '<h2>New Contact Form Submission</h2><p><b>Name:</b> ' + escapeHtml(name) + '</p><p><b>Email:</b> ' + escapeHtml(email) + '</p><p><b>Company:</b> ' + escapeHtml(company || 'N/A') + '</p><p><b>Service:</b> ' + escapeHtml(service || 'General') + '</p><p><b>Message:</b></p><blockquote style="padding:12px;background:#f5f5f5;border-left:4px solid #b45309;">' + escapeHtml(message || 'N/A') + '</blockquote><p><small>Received: ' + entry.timestamp + '</small></p>',
      text: `New Contact: ${name} (${email}) - ${company || 'N/A'}\nService: ${service || 'General'}\nMessage: ${message || 'N/A'}`,
    });
    res.json({ success: true, message: 'Thank you! We will contact you within 24 hours.' });
  } catch (e) {
    console.error('[Contact] Error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/subscribe', express.json(), (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    const entry = {
      email,
      subscribedAt: new Date().toISOString(),
      ip: req.ip || req.socket.remoteAddress,
    };
    const logDir = join(dirname(fileURLToPath(import.meta.url)), 'data');
    import('fs').then(fs => {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = join(logDir, 'subscribers.json');
      let records = [];
      try { records = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
      // Avoid duplicates
      const exists = records.some(r => r.email === email);
      if (!exists) records.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(records, null, 2));
    });
    console.log(`[Subscribe] New subscriber: ${email}`);
    sendEmailNotification({
      subject: `New Subscriber: ${email}`,
      html: '<h2>New Newsletter Subscriber</h2><p><b>Email:</b> ' + escapeHtml(email) + '</p><p><small>Subscribed: ' + entry.subscribedAt + '</small></p>',
      text: `New subscriber: ${email}`,
    });
    res.json({ success: true, message: 'Subscribed successfully! Check your inbox for confirmation.' });
  } catch (e) {
    console.error('[Subscribe] Error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══ Blog CMS Endpoints ═══
const BLOG_FILE = join(dirname(fileURLToPath(import.meta.url)), 'data', 'blog-posts.json');

function loadBlogPosts() {
  try {
    if (fsSync.existsSync(BLOG_FILE)) {
      return JSON.parse(fsSync.readFileSync(BLOG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}
function saveBlogPosts(posts) {
  const dir = dirname(BLOG_FILE);
  if (!fsSync.existsSync(dir)) fsSync.mkdirSync(dir, { recursive: true });
  fsSync.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2));
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post';
}

// Seed default posts
function seedBlogPosts() {
  let posts = loadBlogPosts();
  if (posts.length > 0) return;
  posts = [
    {
      id: 'post-1', slug: 'how-autonomous-ai-agents-are-transforming-customer-support',
      title: 'How Autonomous AI Agents Are Transforming Customer Support',
      excerpt: 'Discover how businesses use autonomous AI agents to handle 80% of support tickets autonomously.',
      content: '<p>Customer support is undergoing a radical transformation. Autonomous AI agents can now handle the majority of customer inquiries without human intervention.</p><h2>The Numbers</h2><p>80% reduction in first-response time. 60% lower support costs. 35% improvement in CSAT scores. 24/7 availability.</p><h2>How It Works</h2><p>Modern AI agents understand context, access knowledge bases, execute actions, and escalate to humans only when needed.</p>',
      author: 'Lalit Pandit', date: '2026-05-18', readTime: '8 min read',
      category: 'AI Agents', tags: ['AI Agents', 'Customer Support', 'Automation'], icon: 'Bot', published: true,
      createdAt: '2026-05-18T00:00:00.000Z', updatedAt: '2026-05-18T00:00:00.000Z',
    },
    {
      id: 'post-2', slug: 'geo-vs-seo-why-your-business-needs-both-in-2026',
      title: 'GEO vs SEO: Why Your Business Needs Both in 2026',
      excerpt: 'Generative Engine Optimization (GEO) is the new frontier for appearing in AI answer engines.',
      content: '<p>2026 marks a pivotal year in search. While traditional SEO remains essential for Google rankings, GEO has emerged for AI-powered engines like ChatGPT and Perplexity.</p><h2>What is GEO?</h2><p>GEO optimizes content for AI models that generate answers, focusing on entity-rich data and citation-ready content.</p><h2>The Dual Strategy</h2><p>Winning in 2026 requires both: SEO for click-through traffic, and GEO for AI-generated answer inclusion.</p>',
      author: 'Neel Pandit', date: '2026-05-12', readTime: '6 min read',
      category: 'SEO / GEO', tags: ['GEO', 'SEO', 'AI Citations', 'Digital Marketing'], icon: 'Search', published: true,
      createdAt: '2026-05-12T00:00:00.000Z', updatedAt: '2026-05-12T00:00:00.000Z',
    },
    {
      id: 'post-3', slug: 'roi-of-ai-automation-a-practical-framework',
      title: 'ROI of AI Automation: A Practical Framework for Decision Makers',
      excerpt: 'A step-by-step framework to calculate the real ROI of AI automation projects.',
      content: '<p>AI automation investments require rigorous ROI analysis. Here is our proven framework.</p><h2>The Framework</h2><p><b>Direct Savings:</b> Labor cost + error reduction + speed<br/><b>Revenue Impact:</b> Time-to-market + capacity scaling<br/><b>Hidden Costs:</b> Integration + maintenance + training</p><h2>Results</h2><p>Our clients typically see 3-5x ROI within the first year.</p>',
      author: 'Lalit Pandit', date: '2026-05-05', readTime: '10 min read',
      category: 'Automation', tags: ['ROI', 'Automation', 'Business Strategy'], icon: 'BarChart3', published: true,
      createdAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z',
    },
  ];
  saveBlogPosts(posts);
}
seedBlogPosts();

// GET /api/blog - list published posts (without content for listing)
app.get('/api/blog', (req, res) => {
  const posts = loadBlogPosts();
  const published = posts.filter(p => p.published).map(({ content, ...rest }) => rest);
  res.json({ posts: published });
});

// GET /api/blog/:slug - single post with full content
app.get('/api/blog/:slug', (req, res) => {
  const posts = loadBlogPosts();
  const post = posts.find(p => p.slug === req.params.slug && p.published);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { content, ...meta } = post;
  res.json({ post, content });
});

// GET /api/blog/admin/all - all posts (auth required)
app.get('/api/blog/admin/all', authGuard, (req, res) => {
  res.json({ posts: loadBlogPosts() });
});

// POST /api/blog - create post (auth required)
app.post('/api/blog', authGuard, express.json(), (req, res) => {
  try {
    const { title, excerpt, content, author, category, tags, icon, published } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const posts = loadBlogPosts();
    const post = {
      id: 'post-' + Date.now().toString(36),
      slug: slugify(title),
      title, excerpt: excerpt || '', content,
      author: author || 'RudraX Team',
      date: new Date().toISOString().split('T')[0],
      readTime: Math.max(1, Math.ceil((content.length || 0) / 1500)) + ' min read',
      category: category || 'General',
      tags: tags || [], icon: icon || 'FileText',
      published: published !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts.unshift(post);
    saveBlogPosts(posts);
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/blog/:id - update post (auth required)
app.put('/api/blog/:id', authGuard, express.json(), (req, res) => {
  try {
    const posts = loadBlogPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    const { title, excerpt, content, author, category, tags, icon, published } = req.body;
    if (title) { posts[idx].title = title; posts[idx].slug = slugify(title); }
    if (content !== undefined) { posts[idx].content = content; posts[idx].readTime = Math.max(1, Math.ceil(content.length / 1500)) + ' min read'; }
    if (excerpt !== undefined) posts[idx].excerpt = excerpt;
    if (author) posts[idx].author = author;
    if (category) posts[idx].category = category;
    if (tags) posts[idx].tags = tags;
    if (icon) posts[idx].icon = icon;
    if (published !== undefined) posts[idx].published = published;
    posts[idx].updatedAt = new Date().toISOString();
    if (!posts[idx].date) posts[idx].date = new Date().toISOString().split('T')[0];
    saveBlogPosts(posts);
    res.json({ success: true, post: posts[idx] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/blog/:id (auth required)
app.delete('/api/blog/:id', authGuard, (req, res) => {
  try {
    let posts = loadBlogPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    posts.splice(idx, 1);
    saveBlogPosts(posts);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══ Admin Pages ═══
app.get('/admin', (req, res) => {
  res.redirect('/admin/blog');
});
app.get('/admin/blog', (req, res) => {
  res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'admin', 'blog.html'));
});
app.get('/admin/subscribers', authGuard, (req, res) => {
  try {
    const f = join(dirname(fileURLToPath(import.meta.url)), 'data', 'subscribers.json');
    const subs = fsSync.existsSync(f) ? JSON.parse(fsSync.readFileSync(f, 'utf-8')) : [];
    res.json({ subscribers: subs });
  } catch (e) { res.json({ subscribers: [] }); }
});
app.get('/admin/contacts', authGuard, (req, res) => {
  try {
    const f = join(dirname(fileURLToPath(import.meta.url)), 'data', 'contacts.json');
    const cts = fsSync.existsSync(f) ? JSON.parse(fsSync.readFileSync(f, 'utf-8')) : [];
    res.json({ contacts: cts });
  } catch (e) { res.json({ contacts: [] }); }
});

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
      console.log('  ║    🔱 RudraX Army v4.6.0 - 349 Agents 🔱  ║');
      console.log('  ║    Build · Break · Deploy · Orchestrate      ║');
      console.log('  ╠══════════════════════════════════════════════╣');
      console.log(`  ║  http://localhost:${serverPort}                      ║`);
      console.log('  ║  🤖 349 Agents  🎭 9 Squads  🧠 15 Capabilities  ║');
      console.log('  ╚══════════════════════════════════════════════╝');
      console.log('');
      console.log('  💡 Integrated Capabilities:');
      console.log('     🧠 Vector KB · 📡 Comm Bus · 🛡️ Gates · 🔍 Reflection');
      console.log('     📊 Observability · 🌐 Web Search · ⚙️ Workflows');
      console.log('     🕸️ Knowledge Graph · 🔧 Tool Registry · 💰 Cost Tracker');
      console.log('     ⏰ Scheduler · 🏆 Evaluator · 📦 Sandbox · 🖼️ Multi-Modal');
      console.log('');
      console.log(`  🔱 RudraX v4.6.0 - Build · Break · Deploy · Orchestrate`);
      console.log(`  By Lalit Pandit | ॐ नमः शिवाय\n`);
      resolve(serverPort);
    });
  });
}

// ── Stuck-State Recovery ───────────────────────────────────────────────────
// If a context has been running for more than STUCK_TIMEOUT_MS without any activity,
// auto-reset its running state so the UI un-sticks.
const STUCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

setInterval(() => {
  for (const ctx of contexts.values()) {
    if (ctx.running && (Date.now() - ctx.lastActivity) > STUCK_TIMEOUT_MS) {
      console.warn(`[RudraX] Context ${ctx.id} stuck for ${STUCK_TIMEOUT_MS / 1000}s - auto-recovering`);
      ctx.running = false;
      ctx.lastActivity = Date.now();
      broadcastState(ctx);
    }
  }
}, 30_000); // Check every 30 seconds

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