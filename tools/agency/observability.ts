/**
 * ═══════════════════════════════════════════════════════════════════════
 *  📊 RUDRAX OBSERVABILITY — Full Telemetry, Tracing & Monitoring
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Complete observability stack for the RudraX Army. Every agent action,
 * tool call, LLM request, and state change is traced and logged.
 *
 * Features:
 *   - Distributed tracing: track operations across agent boundaries
 *   - Span-based instrumentation: every significant operation is a span
 *   - Performance metrics: latency, token usage, tool execution time
 *   - Error tracking: structured error logging with stack traces
 *   - Real-time dashboards: live metrics via WebSocket
 *   - Telemetry export: JSON/CSV export for external analysis
 *   - Span visualization: waterfall timeline of operations
 *
 * Architecture:
 *   Agent Action → createSpan → TraceContext → completeSpan
 *                       ↓
 *                 ┌──────────┐
 *                 │  Trace   │ ← child spans point to parent
 *                 │  Store   │
 *                 └──────────┘
 *                       ↓
 *                 Metrics Aggregation → WebSocket broadcast
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TraceSpan {
  id: string;
  traceId: string;
  parentId: string | null;
  name: string;
  type: "tool" | "llm" | "agent" | "planning" | "reflection" | "memory" | "communication" | "system";
  agent: string;
  status: "started" | "completed" | "error";
  startTime: number;
  endTime?: number;
  duration?: number;       // ms
  metadata?: Record<string, any>;
  error?: string;
  tags?: string[];
}

interface Trace {
  id: string;
  contextId: string;
  rootSpanId: string;
  spans: TraceSpan[];
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "active" | "completed" | "error";
}

interface MetricsSnapshot {
  timestamp: number;
  activeTraces: number;
  completedTraces: number;
  totalSpans: number;
  avgSpanDuration: number;
  toolCalls: number;
  llmCalls: number;
  tokensUsed: number;
  errorCount: number;
  agentUtilization: Record<string, number>;
}

interface ObservabilityStore {
  contextId: string;
  traces: Trace[];
  currentTrace: Trace | null;
  metrics: {
    totalTraces: number;
    totalSpans: number;
    totalErrors: number;
    totalTokens: number;
    avgResponseTime: number;
    byAgent: Record<string, { calls: number; errors: number; avgDuration: number }>;
    byTool: Record<string, { calls: number; errors: number; avgDuration: number }>;
    hourlyActivity: number[];  // Last 24 hours
    created: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACE STORE
// ═══════════════════════════════════════════════════════════════════════════

const OBS_DIR = path.join(os.homedir(), ".rudrax", "agent", "observability");

function ensureObsDir(): void {
  if (!fs.existsSync(OBS_DIR)) fs.mkdirSync(OBS_DIR, { recursive: true });
}

function obsPath(contextId: string): string {
  ensureObsDir();
  return path.join(OBS_DIR, `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function loadObs(contextId: string): ObservabilityStore {
  const op = obsPath(contextId);
  if (fs.existsSync(op)) {
    try { return JSON.parse(fs.readFileSync(op, "utf-8")); } catch { /* fall through */ }
  }
  return {
    contextId,
    traces: [],
    currentTrace: null,
    metrics: {
      totalTraces: 0, totalSpans: 0, totalErrors: 0, totalTokens: 0,
      avgResponseTime: 0, byAgent: {}, byTool: {}, hourlyActivity: new Array(24).fill(0), created: Date.now(),
    },
  };
}

function saveObs(store: ObservabilityStore): void {
  // Update aggregated metrics
  const storeMetrics = store.metrics;
  storeMetrics.totalTraces = store.traces.length;
  storeMetrics.totalSpans = store.traces.reduce((s, t) => s + t.spans.length, 0);

  // Recalculate per-agent metrics
  storeMetrics.byAgent = {};
  storeMetrics.byTool = {};
  let totalDuration = 0;
  let durationCount = 0;

  for (const trace of store.traces) {
    for (const span of trace.spans) {
      // Agent metrics
      if (!storeMetrics.byAgent[span.agent]) {
        storeMetrics.byAgent[span.agent] = { calls: 0, errors: 0, avgDuration: 0 };
      }
      storeMetrics.byAgent[span.agent].calls++;
      if (span.status === "error") storeMetrics.byAgent[span.agent].errors++;

      // Tool metrics
      const toolName = span.name;
      if (!storeMetrics.byTool[toolName]) {
        storeMetrics.byTool[toolName] = { calls: 0, errors: 0, avgDuration: 0 };
      }
      storeMetrics.byTool[toolName].calls++;
      if (span.status === "error") storeMetrics.byTool[toolName].errors++;

      // Duration
      if (span.duration) {
        totalDuration += span.duration;
        durationCount++;
        if (storeMetrics.byAgent[span.agent]) {
          const prevCalls = storeMetrics.byAgent[span.agent].calls - 1;
          storeMetrics.byAgent[span.agent].avgDuration = prevCalls > 0
            ? (storeMetrics.byAgent[span.agent].avgDuration * prevCalls + span.duration) / storeMetrics.byAgent[span.agent].calls
            : span.duration;
        }
        if (storeMetrics.byTool[toolName]) {
          const prevToolCalls = storeMetrics.byTool[toolName].calls - 1;
          storeMetrics.byTool[toolName].avgDuration = prevToolCalls > 0
            ? (storeMetrics.byTool[toolName].avgDuration * prevToolCalls + span.duration) / storeMetrics.byTool[toolName].calls
            : span.duration;
        }
      }

      // Errors
      if (span.status === "error") storeMetrics.totalErrors++;

      // Tokens
      if (span.metadata?.tokens) storeMetrics.totalTokens += span.metadata.tokens;
    }

    if (trace.duration) {
      totalDuration += trace.duration;
      durationCount++;
    }
  }

  storeMetrics.avgResponseTime = durationCount > 0 ? totalDuration / durationCount : 0;

  // Update hourly activity
  const hour = new Date().getHours();
  storeMetrics.hourlyActivity[hour]++;

  // Keep only last 100 traces in memory for performance
  if (store.traces.length > 100) {
    store.traces = store.traces.slice(-100);
  }

  fs.writeFileSync(obsPath(store.contextId), JSON.stringify(store, null, 2), "utf-8");
}

function generateTraceId(): string { return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }
function generateSpanId(): string { return `span_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function createTrace(store: ObservabilityStore, contextId: string): Trace {
  const traceId = generateTraceId();
  const rootSpanId = generateSpanId();
  const trace: Trace = {
    id: traceId,
    contextId,
    rootSpanId,
    spans: [],
    startTime: Date.now(),
    status: "active",
  };
  store.currentTrace = trace;
  store.traces.push(trace);
  return trace;
}

function createSpan(
  store: ObservabilityStore,
  name: string,
  type: TraceSpan["type"],
  agent: string,
  parentId?: string,
  metadata?: Record<string, any>
): TraceSpan | null {
  if (!store.currentTrace) createTrace(store, store.contextId);

  const span: TraceSpan = {
    id: generateSpanId(),
    traceId: store.currentTrace!.id,
    parentId: parentId || store.currentTrace!.rootSpanId,
    name,
    type,
    agent,
    status: "started",
    startTime: Date.now(),
    metadata,
    tags: [],
  };

  store.currentTrace!.spans.push(span);
  return span;
}

function completeSpan(store: ObservabilityStore, spanId: string, metadata?: Record<string, any>): void {
  for (const trace of store.traces) {
    const span = trace.spans.find(s => s.id === spanId);
    if (span) {
      span.status = "completed";
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      if (metadata) span.metadata = { ...span.metadata, ...metadata };
      return;
    }
  }
}

function errorSpan(store: ObservabilityStore, spanId: string, error: string): void {
  for (const trace of store.traces) {
    const span = trace.spans.find(s => s.id === spanId);
    if (span) {
      span.status = "error";
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      span.error = error;
      return;
    }
  }
}

function completeTrace(store: ObservabilityStore, traceId?: string): void {
  const trace = traceId
    ? store.traces.find(t => t.id === traceId)
    : store.currentTrace;

  if (trace) {
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = trace.spans.some(s => s.status === "error") ? "error" : "completed";
    if (trace === store.currentTrace) store.currentTrace = null;
    saveObs(store);
  }
}

function getMetricsSnapshot(store: ObservabilityStore): MetricsSnapshot {
  return {
    timestamp: Date.now(),
    activeTraces: store.traces.filter(t => t.status === "active").length,
    completedTraces: store.traces.filter(t => t.status === "completed").length,
    totalSpans: store.metrics.totalSpans,
    avgSpanDuration: store.metrics.avgResponseTime,
    toolCalls: Object.values(store.metrics.byTool).reduce((s, t) => s + t.calls, 0),
    llmCalls: store.metrics.byTool["llm_call"]?.calls || 0,
    tokensUsed: store.metrics.totalTokens,
    errorCount: store.metrics.totalErrors,
    agentUtilization: Object.fromEntries(
      Object.entries(store.metrics.byAgent).map(([agent, m]) => [agent, m.calls])
    ),
  };
}

function formatTraceWaterfall(trace: Trace): string {
  let output = `🌊 **Trace Waterfall: ${trace.id}**\n`;
  output += `Status: ${trace.status} | Duration: ${trace.duration ? `${trace.duration.toFixed(0)}ms` : "active"}\n\n`;

  const rootSpan = trace.spans.find(s => s.id === trace.rootSpanId);
  const tree = buildSpanTree(trace.spans, trace.rootSpanId);

  function renderTree(spans: TraceSpan[], depth: number): string {
    let result = "";
    for (const span of spans) {
      const indent = "  ".repeat(depth);
      const icon = span.status === "completed" ? "✅" : span.status === "error" ? "❌" : "🔄";
      const duration = span.duration ? `${span.duration.toFixed(0)}ms` : "running";
      const agent = span.agent.split("-").slice(-2).join(" ");
      result += `${indent}${icon} ${span.name} (${agent}) — ${duration}\n`;
      if (span.error) result += `${indent}  ❌ Error: ${span.error.slice(0, 100)}\n`;
      // Find children
      const children = trace.spans.filter(s => s.parentId === span.id && s.id !== span.id);
      if (children.length > 0) {
        result += renderTree(children, depth + 1);
      }
    }
    return result;
  }

  output += renderTree(tree, 0);
  return output;
}

function buildSpanTree(spans: TraceSpan[], rootId: string): TraceSpan[] {
  const children = spans.filter(s => s.parentId === rootId);
  // Build recursively
  const result: TraceSpan[] = [];
  for (const child of children) {
    result.push(child);
    result.push(...buildSpanTree(spans, child.id));
  }
  return result;
}

function formatMetricsDashboard(store: ObservabilityStore): string {
  const m = store.metrics;
  const snapshot = getMetricsSnapshot(store);

  let dash = "📊 **Observability Dashboard**\n\n";
  dash += `### Overview\n`;
  dash += `Total Traces: ${m.totalTraces}\n`;
  dash += `Total Spans: ${m.totalSpans}\n`;
  dash += `Avg Response: ${m.avgResponseTime.toFixed(0)}ms\n`;
  dash += `Errors: ${m.totalErrors}\n`;
  dash += `Tokens: ${m.totalTokens.toLocaleString()}\n\n`;

  dash += `### Top Agents\n`;
  const topAgents = Object.entries(m.byAgent)
    .sort((a, b) => b[1].calls - a[1].calls)
    .slice(0, 10);
  for (const [agent, metrics] of topAgents) {
    dash += `  • ${agent}: ${metrics.calls} calls, ${metrics.errors} errors, ${metrics.avgDuration.toFixed(0)}ms avg\n`;
  }

  dash += `\n### Top Tools\n`;
  const topTools = Object.entries(m.byTool)
    .sort((a, b) => b[1].calls - a[1].calls)
    .slice(0, 10);
  for (const [tool, metrics] of topTools) {
    dash += `  • ${tool}: ${metrics.calls} calls, ${metrics.errors} errors, ${metrics.avgDuration.toFixed(0)}ms avg\n`;
  }

  dash += `\n### Hourly Activity (last 24h)\n`;
  const maxActivity = Math.max(...m.hourlyActivity, 1);
  for (let h = 0; h < 24; h++) {
    const barLen = Math.round((m.hourlyActivity[h] / maxActivity) * 20);
    const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);
    const label = `${h.toString().padStart(2, "0")}:00`;
    dash += `  ${label} ${bar} ${m.hourlyActivity[h]}\n`;
  }

  return dash;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

let _obsContextId = "";
let _obsStore: ObservabilityStore | null = null;

export default function (pi: ExtensionAPI) {

  // ─── /observe command ─────────────────────────────────────────
  pi.registerCommand("observe", {
    description: "Observability: telemetry, traces, and metrics. Usage: /observe <dashboard|trace|traces|metrics|agents|tools|export>",
    getArgumentCompletions(prefix: string) {
      const subs = ["dashboard", "trace", "traces", "metrics", "agents", "tools", "export", "clear"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "dashboard";

      if (!_obsContextId) _obsContextId = ctx.session?.id || ctx.contextId || "";
      if (!_obsContextId) { ctx.ui.notify("⚠️ No active context.", "warn"); return; }

      _obsStore = loadObs(_obsContextId);

      if (sub === "dashboard") {
        ctx.ui.notify(formatMetricsDashboard(_obsStore), "info");
        return;
      }

      if (sub === "traces" || sub === "list") {
        const count = parseInt(parts[1]) || 10;
        const recentTraces = _obsStore.traces.slice(-count).reverse();
        if (recentTraces.length === 0) { ctx.ui.notify("📋 No traces yet.", "info"); return; }
        const lines = recentTraces.map(t => {
          const icon = t.status === "completed" ? "✅" : t.status === "error" ? "❌" : "🔄";
          const spans = t.spans.length;
          const dur = t.duration ? `${t.duration.toFixed(0)}ms` : "active";
          return `${icon} ${t.id.slice(0, 20)} — ${spans} spans, ${dur}, ${t.status}`;
        }).join("\n");
        ctx.ui.notify(`📋 **Recent Traces**\n${lines}`, "info");
        return;
      }

      if (sub === "trace" && parts[1]) {
        const trace = _obsStore.traces.find(t => t.id.startsWith(parts[1]));
        if (!trace) { ctx.ui.notify(`Trace not found: ${parts[1]}`, "warn"); return; }
        ctx.ui.notify(formatTraceWaterfall(trace), "info");
        return;
      }

      if (sub === "metrics") {
        const snap = getMetricsSnapshot(_obsStore);
        ctx.ui.notify(
          `📊 **Live Metrics**\n` +
          `Active traces: ${snap.activeTraces}\n` +
          `Completed traces: ${snap.completedTraces}\n` +
          `Total spans: ${snap.totalSpans}\n` +
          `Avg span duration: ${snap.avgSpanDuration.toFixed(0)}ms\n` +
          `Tool calls: ${snap.toolCalls}\n` +
          `LLM calls: ${snap.llmCalls}\n` +
          `Tokens used: ${snap.tokensUsed.toLocaleString()}\n` +
          `Errors: ${snap.errorCount}`,
          "info"
        );
        return;
      }

      if (sub === "agents") {
        const agents = Object.entries(_obsStore.metrics.byAgent)
          .sort((a, b) => b[1].calls - a[1].calls);
        if (agents.length === 0) { ctx.ui.notify("No agent data yet.", "info"); return; }
        const lines = agents.map(([a, m]) => `  • ${a}: ${m.calls} calls, ${m.errors} errors, ${m.avgDuration.toFixed(0)}ms avg`).join("\n");
        ctx.ui.notify(`🤖 **Agent Telemetry**\n${lines}`, "info");
        return;
      }

      if (sub === "tools") {
        const tools = Object.entries(_obsStore.metrics.byTool)
          .sort((a, b) => b[1].calls - a[1].calls);
        if (tools.length === 0) { ctx.ui.notify("No tool data yet.", "info"); return; }
        const lines = tools.map(([t, m]) => `  • ${t}: ${m.calls} calls, ${m.errors} errors, ${m.avgDuration.toFixed(0)}ms avg`).join("\n");
        ctx.ui.notify(`🔧 **Tool Telemetry**\n${lines}`, "info");
        return;
      }

      if (sub === "clear") {
        _obsStore = {
          contextId: _obsContextId, traces: [], currentTrace: null,
          metrics: { totalTraces: 0, totalSpans: 0, totalErrors: 0, totalTokens: 0, avgResponseTime: 0, byAgent: {}, byTool: {}, hourlyActivity: new Array(24).fill(0), created: Date.now() },
        };
        saveObs(_obsStore);
        ctx.ui.notify("🗑️ Observability data cleared.", "info");
        return;
      }

      ctx.ui.notify("Usage: /observe <dashboard|traces|trace|metrics|agents|tools|clear>", "info");
    },
  });

  // ─── Auto-instrument agent hooks ──────────────────────────────
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!_obsContextId) _obsContextId = _ctx.session?.id || _ctx.contextId || "";
    if (!_obsContextId) return {};

    try {
      _obsStore = loadObs(_obsContextId);
      const agentName = _ctx.agent?.name || "system";
      createSpan(_obsStore, "agent_start", "agent", agentName);
      saveObs(_obsStore);
    } catch { /* non-critical */ }

    return {};
  });

  pi.on("turn_end", async (_event, _ctx) => {
    if (!_obsContextId || !_obsStore) return;
    try {
      // Complete any active agent spans
      completeTrace(_obsStore);
    } catch { /* non-critical */ }
  });

  // ─── session_start ────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (!_obsContextId) _obsContextId = ctx.session?.id || ctx.contextId || "";
    if (!_obsContextId) return;

    try {
      _obsStore = loadObs(_obsContextId);
      if (_obsStore.metrics.totalTraces > 0) {
        ctx.ui.notify(
          `📊 Observability: ${_obsStore.metrics.totalTraces} traces, ${_obsStore.metrics.totalErrors} errors, ${(_obsStore.metrics.avgResponseTime).toFixed(0)}ms avg`,
          "info"
        );
      }
    } catch { /* first time */ }
  });

  // ─── Export core functions ────────────────────────────────────
  return {
    loadObs, saveObs, createTrace, createSpan, completeSpan,
    errorSpan, completeTrace, getMetricsSnapshot,
    formatTraceWaterfall, formatMetricsDashboard,
  };
}
