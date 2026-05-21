/**
 * ═══════════════════════════════════════════════════════════════════════
 *  📡 RUDRAX AGENT COMMUNICATION BUS — Pub/Sub Cross-Agent Messaging
 * ═══════════════════════════════════════════════════════════════════════
 *
 * A lightweight pub/sub message bus that enables direct agent-to-agent
 * communication. Agents can:
 *   1. PUBLISH messages to topics (broadcast to subscribers)
 *   2. SUBSCRIBE to topics (receive relevant broadcasts)
 *   3. SEND direct messages to specific agents
 *   4. QUERY message history for context
 *   5. CREATE topics dynamically
 *
 * Architecture:
 *   Agent A → publish("topic") → ┌──────────┐ → deliver → Agent B (subscribed)
 *   Agent C → send("Agent B") ──→│ Message  │ → deliver → Agent B
 *   Agent D → query("topic") ───→│   Bus    │ → history    
 *                                └──────────┘
 *
 * Messages are ephemeral (in-memory) but with optional persistence to
 * shared memory for cross-session continuity.
 *
 * Data stored at: ~/.rudrax/agent/bus/{context-id}.json
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BusMessage {
  id: string;
  type: "publish" | "direct" | "broadcast";
  topic?: string;
  from: string;
  to?: string;           // For direct messages
  content: string;
  metadata?: Record<string, string>;
  timestamp: number;
  priority: "low" | "normal" | "high" | "critical";
  ttl: number;           // Time-to-live in ms (0 = infinite)
}

interface Subscription {
  agent: string;
  topic: string;
  createdAt: number;
  filter?: (msg: BusMessage) => boolean;
}

interface BusState {
  contextId: string;
  messages: BusMessage[];
  subscriptions: Subscription[];
  topics: string[];
  maxMessages: number;
  created: number;
  updated: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS MANAGER
// ═══════════════════════════════════════════════════════════════════════════

const BUS_DIR = path.join(os.homedir(), ".rudrax", "agent", "bus");

function ensureBusDir(): void {
  if (!fs.existsSync(BUS_DIR)) fs.mkdirSync(BUS_DIR, { recursive: true });
}

function busPath(contextId: string): string {
  ensureBusDir();
  return path.join(BUS_DIR, `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function loadBus(contextId: string): BusState {
  const bp = busPath(contextId);
  if (fs.existsSync(bp)) {
    try { return JSON.parse(fs.readFileSync(bp, "utf-8")); } catch { /* fall through */ }
  }
  return {
    contextId,
    messages: [],
    subscriptions: [],
    topics: ["general", "alerts", "status", "handoffs"],
    maxMessages: 500,
    created: Date.now(),
    updated: Date.now(),
  };
}

function saveBus(bus: BusState): void {
  bus.updated = Date.now();
  // Purge expired messages
  const now = Date.now();
  bus.messages = bus.messages.filter(m => m.ttl === 0 || (now - m.timestamp) < m.ttl);
  // Keep within max
  if (bus.messages.length > bus.maxMessages) {
    bus.messages = bus.messages.slice(-bus.maxMessages);
  }
  fs.writeFileSync(busPath(bus.contextId), JSON.stringify(bus, null, 2), "utf-8");
}

// ─── Topic Management ─────────────────────────────────────────────────

function createTopic(bus: BusState, topic: string): boolean {
  if (bus.topics.includes(topic)) return false;
  bus.topics.push(topic);
  saveBus(bus);
  return true;
}

function subscribeAgent(bus: BusState, agent: string, topic: string): boolean {
  const exists = bus.subscriptions.some(s => s.agent === agent && s.topic === topic);
  if (exists) return false;
  bus.subscriptions.push({ agent, topic, createdAt: Date.now() });
  saveBus(bus);
  return true;
}

function unsubscribeAgent(bus: BusState, agent: string, topic?: string): number {
  const before = bus.subscriptions.length;
  if (topic) {
    bus.subscriptions = bus.subscriptions.filter(s => !(s.agent === agent && s.topic === topic));
  } else {
    bus.subscriptions = bus.subscriptions.filter(s => s.agent !== agent);
  }
  saveBus(bus);
  return before - bus.subscriptions.length;
}

function getSubscribedTopics(bus: BusState, agent: string): string[] {
  return bus.subscriptions
    .filter(s => s.agent === agent)
    .map(s => s.topic);
}

function getSubscribers(bus: BusState, topic: string): string[] {
  return bus.subscriptions
    .filter(s => s.topic === topic)
    .map(s => s.agent);
}

// ─── Message Operations ──────────────────────────────────────────────

function publishMessage(
  bus: BusState,
  topic: string,
  from: string,
  content: string,
  options: { priority?: "low" | "normal" | "high" | "critical"; ttl?: number; metadata?: Record<string, string> } = {}
): BusMessage {
  const msg: BusMessage = {
    id: `msg_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    type: "publish",
    topic,
    from,
    content,
    metadata: options.metadata,
    timestamp: Date.now(),
    priority: options.priority || "normal",
    ttl: options.ttl || 3600000, // 1 hour default
  };

  bus.messages.push(msg);
  saveBus(bus);
  return msg;
}

function sendDirectMessage(
  bus: BusState,
  from: string,
  to: string,
  content: string,
  options: { priority?: "low" | "normal" | "high" | "critical"; ttl?: number; metadata?: Record<string, string> } = {}
): BusMessage {
  const msg: BusMessage = {
    id: `dm_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    type: "direct",
    from,
    to,
    content,
    metadata: options.metadata,
    timestamp: Date.now(),
    priority: options.priority || "normal",
    ttl: options.ttl || 86400000, // 24 hours for DMs
  };

  bus.messages.push(msg);
  saveBus(bus);
  return msg;
}

function queryMessages(
  bus: BusState,
  options: {
    topic?: string;
    from?: string;
    to?: string;
    agent?: string;        // Messages by or to this agent
    since?: number;        // Timestamp
    limit?: number;
    priority?: string;
  } = {}
): BusMessage[] {
  let results = [...bus.messages];

  if (options.topic) {
    results = results.filter(m => m.topic === options.topic || m.metadata?.related_topic === options.topic);
  }
  if (options.from) {
    results = results.filter(m => m.from === options.from);
  }
  if (options.to) {
    results = results.filter(m => m.to === options.to);
  }
  if (options.agent) {
    results = results.filter(m => m.from === options.agent || m.to === options.agent);
  }
  if (options.since) {
    results = results.filter(m => m.timestamp >= options.since);
  }
  if (options.priority) {
    results = results.filter(m => m.priority === options.priority);
  }

  // Sort by priority then time
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  results.sort((a, b) => {
    const pa = priorityOrder[a.priority] || 2;
    const pb = priorityOrder[b.priority] || 2;
    if (pa !== pb) return pa - pb;
    return b.timestamp - a.timestamp; // Newest first
  });

  if (options.limit) results = results.slice(0, options.limit);
  return results;
}

function getPendingDirectMessages(bus: BusState, agent: string): BusMessage[] {
  return bus.messages.filter(m => m.type === "direct" && m.to === agent);
}

function getUnreadForAgent(bus: BusState, agent: string, lastReadTimestamp: number = 0): BusMessage[] {
  // Messages on topics the agent subscribes to, plus direct messages
  const subscribedTopics = getSubscribedTopics(bus, agent);

  return bus.messages.filter(m => {
    if (m.timestamp <= lastReadTimestamp) return false;
    if (m.type === "direct" && m.to === agent) return true;
    if (m.type === "publish" && subscribedTopics.includes(m.topic || "")) return true;
    if (m.type === "broadcast") return true;
    return false;
  }).sort((a, b) => b.timestamp - a.timestamp);
}

function formatMessageForPrompt(msg: BusMessage): string {
  const priorityIcons: Record<string, string> = {
    low: "📌", normal: "📨", high: "🔴", critical: "🚨",
  };
  const icon = priorityIcons[msg.priority] || "📨";
  const time = new Date(msg.timestamp).toLocaleTimeString();

  if (msg.type === "direct") {
    return `${icon} [DM] ${msg.from} → ${msg.to} (${time}): ${msg.content.slice(0, 200)}`;
  }
  if (msg.type === "publish") {
    return `${icon} [${msg.topic}] ${msg.from} (${time}): ${msg.content.slice(0, 200)}`;
  }
  return `${icon} ${msg.from} (${time}): ${msg.content.slice(0, 200)}`;
}

function formatBusDigest(bus: BusState, agent: string): string {
  const pending = getPendingDirectMessages(bus, agent);
  const unread = getUnreadForAgent(bus, agent);
  const topics = getSubscribedTopics(bus, agent);

  let digest = "\n<communication-bus>\n📡 **Agent Communication Bus**\n\n";

  if (pending.length > 0) {
    digest += `📩 **${pending.length} Pending Direct Messages:**\n`;
    for (const msg of pending.slice(0, 5)) {
      digest += `  ${formatMessageForPrompt(msg)}\n`;
    }
    digest += "\n";
  }

  if (unread.length > 0) {
    digest += `📬 **${unread.length} Unread Messages:**\n`;
    for (const msg of unread.slice(0, 8)) {
      digest += `  ${formatMessageForPrompt(msg)}\n`;
    }
    digest += "\n";
  }

  if (topics.length > 0) {
    digest += `📋 **Subscribed Topics:** ${topics.join(", ")}\n`;
  }

  digest += `💡 Use bus_publish to broadcast, bus_send for DMs, bus_read to check messages.\n`;
  digest += "</communication-bus>\n";

  return digest;
}

function clearBus(contextId: string): void {
  const bp = busPath(contextId);
  if (fs.existsSync(bp)) fs.unlinkSync(bp);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

let _currentContextId = "";
let _currentBus: BusState | null = null;
let _agentName = "";
let _lastReadTimestamp = 0;

export default function (pi: ExtensionAPI) {

  // ─── /bus command ─────────────────────────────────────────────
  pi.registerCommand("bus", {
    description: "Agent Communication Bus: pub/sub messaging between agents. Usage: /bus <status|topics|subscribe|unsubscribe|messages|pending|send|publish|clear>",
    getArgumentCompletions(prefix: string) {
      const subs = ["status", "topics", "subscribe", "unsubscribe", "messages", "pending", "send", "publish", "clear"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "status";

      if (!_currentContextId) {
        _currentContextId = ctx.session?.id || ctx.contextId || "";
      }
      if (!_currentContextId) { ctx.ui.notify("⚠️ No active context.", "warn"); return; }

      _currentBus = loadBus(_currentContextId);
      _agentName = ctx.agent?.name || "user";

      if (sub === "status") {
        const subs = _currentBus.subscriptions.filter(s => s.agent === _agentName);
        const dms = _currentBus.messages.filter(m => m.type === "direct" && m.to === _agentName);
        ctx.ui.notify(
          `📡 **Communication Bus**\n` +
          `  Topics: ${_currentBus.topics.length}\n` +
          `  Total messages: ${_currentBus.messages.length}\n` +
          `  Your subscriptions: ${subs.length}\n` +
          `  Pending DMs: ${dms.length}\n` +
          `  Agents on bus: ${new Set(_currentBus.subscriptions.map(s => s.agent)).size}`,
          "info"
        );
        return;
      }

      if (sub === "topics") {
        ctx.ui.notify(
          `📋 **Available Topics**\n${_currentBus.topics.map(t => `  • ${t}`).join("\n")}`,
          "info"
        );
        return;
      }

      if (sub === "subscribe" && parts[1]) {
        subscribeAgent(_currentBus, _agentName, parts[1]);
        ctx.ui.notify(`✅ Subscribed to topic: ${parts[1]}`, "info");
        return;
      }

      if (sub === "unsubscribe") {
        const count = unsubscribeAgent(_currentBus, _agentName, parts[1]);
        ctx.ui.notify(`${count > 0 ? "✅" : "ℹ️"} Unsubscribed: ${parts[1] || "all topics"}`, "info");
        return;
      }

      if (sub === "messages") {
        const msgs = queryMessages(_currentBus, { limit: 20 });
        if (msgs.length === 0) { ctx.ui.notify("📭 No messages.", "info"); return; }
        const lines = msgs.map(m => formatMessageForPrompt(m)).join("\n");
        ctx.ui.notify(`📨 **Recent Messages** (${msgs.length})\n${lines}`, "info");
        return;
      }

      if (sub === "pending") {
        const msgs = getPendingDirectMessages(_currentBus, _agentName);
        if (msgs.length === 0) { ctx.ui.notify("📭 No pending direct messages.", "info"); return; }
        const lines = msgs.map(m => formatMessageForPrompt(m)).join("\n");
        ctx.ui.notify(`📩 **Pending DMs** (${msgs.length})\n${lines}`, "info");
        return;
      }

      if (sub === "send" && parts.length >= 3) {
        const to = parts[1];
        const content = parts.slice(2).join(" ");
        sendDirectMessage(_currentBus, _agentName, to, content);
        ctx.ui.notify(`📨 DM sent to ${to}`, "info");
        return;
      }

      if (sub === "publish" && parts.length >= 2) {
        const topic = parts[1];
        const content = parts.slice(2).join(" ");
        if (!_currentBus.topics.includes(topic)) {
          createTopic(_currentBus, topic);
        }
        publishMessage(_currentBus, topic, _agentName, content);
        ctx.ui.notify(`📢 Published to ${topic}`, "info");
        return;
      }

      if (sub === "clear") {
        clearBus(_currentContextId);
        _currentBus = loadBus(_currentContextId);
        ctx.ui.notify("🗑️ Bus cleared.", "info");
        return;
      }

      ctx.ui.notify(
        "Usage: /bus <status|topics|subscribe|unsubscribe|messages|pending|send|publish|clear>\n" +
        "  /bus subscribe <topic>     — Listen to a topic\n" +
        "  /bus send <agent> <msg>    — Send direct message\n" +
        "  /bus publish <topic> <msg> — Broadcast to topic",
        "info"
      );
    },
  });

  // ─── TOOL: bus_publish — Publish to topic ────────────────────
  pi.registerTool({
    name: "bus_publish",
    label: "Publish to Communication Bus",
    description:
      "Publish a message to a topic on the Agent Communication Bus. All agents subscribed to this topic " +
      "will see the message on their next turn. Use for status updates, findings, and coordination.",
    promptSnippet: "Publish a message to a topic on the agent communication bus",
    parameters: Type.Object({
      topic: Type.String({ description: "Topic to publish to (e.g., 'status', 'findings', 'alerts', 'code-review')" }),
      content: Type.String({ description: "The message content" }),
      priority: Type.Optional(Type.Union([
        Type.Literal("low"), Type.Literal("normal"), Type.Literal("high"), Type.Literal("critical"),
      ], { description: "Message priority (default: normal)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentContextId) _currentContextId = ctx.session?.id || ctx.contextId || "";
      _currentBus = loadBus(_currentContextId);
      _agentName = ctx.agent?.name || "agent";

      if (!_currentBus.topics.includes(params.topic)) createTopic(_currentBus, params.topic);

      const msg = publishMessage(_currentBus, params.topic, _agentName, params.content, {
        priority: params.priority || "normal",
      });

      const subscribers = getSubscribers(_currentBus, params.topic);
      return {
        content: [{
          type: "text",
          text: `📢 **Published to "${params.topic}"**\n\n` +
            `Message: ${params.content.slice(0, 200)}\n` +
            `Priority: ${params.priority || "normal"}\n` +
            `Subscribers: ${subscribers.length} agent(s)\n\n` +
            `Subscribed agents will receive this on their next turn.`,
        }],
        details: { messageId: msg.id, topic: params.topic, subscribers: subscribers.length },
      };
    },
  });

  // ─── TOOL: bus_send — Direct message ─────────────────────────
  pi.registerTool({
    name: "bus_send",
    label: "Send Direct Message to Agent",
    description:
      "Send a direct message to a specific agent on the Communication Bus. The target agent will " +
      "see this message on their next turn as a pending DM. Use for handoffs, questions, and coordination.",
    promptSnippet: "Send a direct message to another agent",
    parameters: Type.Object({
      to_agent: Type.String({ description: "The agent name to send the message to" }),
      content: Type.String({ description: "The message content" }),
      priority: Type.Optional(Type.Union([
        Type.Literal("low"), Type.Literal("normal"), Type.Literal("high"), Type.Literal("critical"),
      ], { description: "Message priority (default: normal)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentContextId) _currentContextId = ctx.session?.id || ctx.contextId || "";
      _currentBus = loadBus(_currentContextId);
      _agentName = ctx.agent?.name || "agent";

      const msg = sendDirectMessage(_currentBus, _agentName, params.to_agent, params.content, {
        priority: params.priority || "normal",
      });

      return {
        content: [{
          type: "text",
          text: `📨 **DM Sent to ${params.to_agent}**\n\n${params.content.slice(0, 200)}\n\nThis agent will receive this message on their next turn.`,
        }],
        details: { messageId: msg.id, to: params.to_agent },
      };
    },
  });

  // ─── TOOL: bus_read — Read pending messages ──────────────────
  pi.registerTool({
    name: "bus_read",
    label: "Read Communication Bus Messages",
    description:
      "Read pending direct messages and subscribed topic messages from the Communication Bus. " +
      "Call this at the start of every turn to check if other agents have sent you messages or " +
      "published updates to topics you care about.",
    promptSnippet: "Read pending messages from the agent communication bus",
    parameters: Type.Object({
      topic: Type.Optional(Type.String({ description: "Filter by topic" })),
      from: Type.Optional(Type.String({ description: "Filter by sender" })),
      limit: Type.Optional(Type.Number({ description: "Max messages to return (1-50)", default: 10 })),
      mark_read: Type.Optional(Type.Boolean({ description: "Mark messages as read (default: true)", default: true })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentContextId) _currentContextId = ctx.session?.id || ctx.contextId || "";
      _currentBus = loadBus(_currentContextId);
      _agentName = ctx.agent?.name || "agent";

      const dms = getPendingDirectMessages(_currentBus, _agentName);
      const topicMsgs = params.topic
        ? queryMessages(_currentBus, { topic: params.topic, limit: params.limit || 10 })
        : queryMessages(_currentBus, { agent: _agentName, limit: params.limit || 10 });

      // Also get subscribed topics messages
      const subscribedTopics = getSubscribedTopics(_currentBus, _agentName);
      const subMsgs: BusMessage[] = [];
      for (const topic of subscribedTopics) {
        const msgs = queryMessages(_currentBus, { topic, since: _lastReadTimestamp, limit: 5 });
        subMsgs.push(...msgs);
      }

      // Merge & deduplicate
      const allMsgs = new Map<string, BusMessage>();
      for (const m of [...dms, ...topicMsgs, ...subMsgs]) allMsgs.set(m.id, m);
      const sorted = Array.from(allMsgs.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, params.limit || 10);

      if (params.mark_read !== false) _lastReadTimestamp = Date.now();

      if (sorted.length === 0) {
        return { content: [{ type: "text", text: "📭 No new messages on the bus." }], details: { count: 0 } };
      }

      const output = sorted.map(m => formatMessageForPrompt(m)).join("\n\n");
      const dmCount = sorted.filter(m => m.type === "direct" && m.to === _agentName).length;

      return {
        content: [{
          type: "text",
          text: `📡 **Communication Bus** (${sorted.length} messages${dmCount > 0 ? `, ${dmCount} DMs` : ""})\n\n${output}`,
        }],
        details: { count: sorted.length, dms: dmCount },
      };
    },
  });

  // ─── TOOL: bus_subscribe — Subscribe to topic ────────────────
  pi.registerTool({
    name: "bus_subscribe",
    label: "Subscribe to Bus Topic",
    description:
      "Subscribe to a topic on the Agent Communication Bus. You'll automatically receive " +
      "messages published to this topic on every turn. Default topics: general, alerts, status, handoffs.",
    promptSnippet: "Subscribe to a communication bus topic",
    parameters: Type.Object({
      topic: Type.String({ description: "Topic to subscribe to" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentContextId) _currentContextId = ctx.session?.id || ctx.contextId || "";
      _currentBus = loadBus(_currentContextId);
      _agentName = ctx.agent?.name || "agent";

      if (!_currentBus.topics.includes(params.topic)) createTopic(_currentBus, params.topic);
      const added = subscribeAgent(_currentBus, _agentName, params.topic);

      return {
        content: [{
          type: "text",
          text: added
            ? `✅ Subscribed to topic "${params.topic}". You'll now receive all messages published to this topic.`
            : `ℹ️ Already subscribed to "${params.topic}".`,
        }],
        details: { topic: params.topic, subscribed: added },
      };
    },
  });

  // ─── Hook: before_agent_start — Inject bus digest ────────────
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!_currentContextId) {
      _currentContextId = _ctx.session?.id || _ctx.contextId || "";
    }
    if (!_currentContextId) return {};

    try {
      _currentBus = loadBus(_currentContextId);
      _agentName = _ctx.agent?.name || "agent";

      // Auto-subscribe to default topics
      for (const topic of ["general", "alerts", "handoffs"]) {
        if (!_currentBus.subscriptions.some(s => s.agent === _agentName && s.topic === topic)) {
          subscribeAgent(_currentBus, _agentName, topic);
        }
      }

      const digest = formatBusDigest(_currentBus, _agentName);
      if (digest) {
        return { systemPrompt: event.systemPrompt + digest };
      }
    } catch { /* non-critical */ }

    return {};
  });

  // ─── session_start — Show bus status ─────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (!_currentContextId) _currentContextId = ctx.session?.id || ctx.contextId || "";
    if (!_currentContextId) return;

    try {
      _currentBus = loadBus(_currentContextId);
      const subs = _currentBus.subscriptions.filter(s => s.agent === _agentName);
      const activeAgents = new Set(_currentBus.subscriptions.map(s => s.agent)).size;
      ctx.ui.notify(
        `📡 Communication Bus: ${_currentBus.topics.length} topics, ${_currentBus.messages.length} messages, ${activeAgents} agents`,
        "info"
      );
    } catch { /* first time */ }
  });

  return {
    loadBus, saveBus, publishMessage, sendDirectMessage,
    queryMessages, subscribeAgent, unsubscribeAgent, createTopic,
    getPendingDirectMessages, getUnreadForAgent, clearBus, formatBusDigest,
  };
}
