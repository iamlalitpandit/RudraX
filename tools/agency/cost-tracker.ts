/**
 * ═══════════════════════════════════════════════════════════════════════
 *  💰 RUDRAX COST TRACKER — LLM Usage & Spend Analytics
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Tracks every LLM call with token counts and estimates cost across
 * all providers. Provides budget management and cost alerts.
 *
 * Pricing (per 1M tokens, approximate):
 *   GPT-4:        $30 input / $60 output
 *   GPT-4o:       $5 input / $15 output
 *   Claude 3.5:   $3 input / $15 output
 *   Claude 3 Opus:$15 input / $75 output
 *   Gemini Pro:   $0.50 input / $1.50 output
 *   Ollama:       $0 (local)
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface CostEntry {
  timestamp: number;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  agent: string;
  tool: string;
  duration: number;
}

interface CostBudget {
  dailyLimit: number;
  monthlyLimit: number;
  alertThreshold: number; // 0-1, percentage of limit
  enabled: boolean;
}

interface CostStore {
  contextId: string;
  entries: CostEntry[];
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  dailyCost: number;
  monthlyCost: number;
  budget: CostBudget;
  created: number;
  resetDate: number;
}

const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4": { input: 30, output: 60 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4o": { input: 5, output: 15 },
  "gpt-4o-mini": { input: 0.5, output: 2 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3-sonnet": { input: 3, output: 15 },
  "claude-3-haiku": { input: 1, output: 5 },
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "gemini-pro": { input: 0.5, output: 1.5 },
  "gemini-ultra": { input: 10, output: 30 },
  "mistral-large": { input: 4, output: 12 },
  "llama-3-70b": { input: 2, output: 6 },
  "ollama": { input: 0, output: 0 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model.toLowerCase()] || { input: 5, output: 15 };
  return (inputTokens / 1000000 * pricing.input) + (outputTokens / 1000000 * pricing.output);
}

const COST_DIR = path.join(os.homedir(), ".rudrax", "agent", "costs");

function ensureDir(): void { if (!fs.existsSync(COST_DIR)) fs.mkdirSync(COST_DIR, { recursive: true }); }
function costPath(contextId: string): string { ensureDir(); return path.join(COST_DIR, `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`); }

function loadCosts(contextId: string): CostStore {
  const cp = costPath(contextId);
  if (fs.existsSync(cp)) { try { return JSON.parse(fs.readFileSync(cp, "utf-8")); } catch {} }
  return {
    contextId, entries: [], totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0,
    dailyCost: 0, monthlyCost: 0,
    budget: { dailyLimit: 50, monthlyLimit: 500, alertThreshold: 0.8, enabled: false },
    created: Date.now(), resetDate: Date.now(),
  };
}

function saveCosts(store: CostStore): void {
  store.totalCost = store.entries.reduce((s, e) => s + e.estimatedCost, 0);
  store.totalInputTokens = store.entries.reduce((s, e) => s + e.inputTokens, 0);
  store.totalOutputTokens = store.entries.reduce((s, e) => s + e.outputTokens, 0);

  const now = Date.now();
  const today = new Date().toDateString();
  const thisMonth = new Date().toISOString().slice(0, 7);
  store.dailyCost = store.entries.filter(e => new Date(e.timestamp).toDateString() === today).reduce((s, e) => s + e.estimatedCost, 0);
  store.monthlyCost = store.entries.filter(e => e.timestamp > Date.now() - 30 * 86400000).reduce((s, e) => s + e.estimatedCost, 0);

  fs.writeFileSync(costPath(store.contextId), JSON.stringify(store, null, 2), "utf-8");
}

function addCostEntry(store: CostStore, entry: CostEntry): void {
  store.entries.push(entry);
  if (store.entries.length > 10000) store.entries = store.entries.slice(-10000);
  saveCosts(store);
}

export default function (pi: ExtensionAPI) {
  let _costCtx = "";
  let _costStore: CostStore | null = null;

  pi.registerCommand("cost", {
    description: "Cost Tracker: LLM usage and spend analytics. Usage: /cost <status|dashboard|history|budget|reset>",
    getArgumentCompletions(prefix: string) {
      const subs = ["status", "dashboard", "history", "budget", "reset"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "dashboard";
      if (!_costCtx) _costCtx = ctx.session?.id || ctx.contextId || "";
      if (!_costCtx) { ctx.ui.notify("⚠️ No active context.", "warn"); return; }
      _costStore = loadCosts(_costCtx);

      if (sub === "status" || sub === "dashboard") {
        const s = _costStore;
        ctx.ui.notify(
          `💰 **Cost Dashboard**\n\n` +
          `Total Cost: $${s.totalCost.toFixed(4)}\n` +
          `Daily Cost: $${s.dailyCost.toFixed(4)}\n` +
          `Monthly Cost: $${s.monthlyCost.toFixed(4)}\n` +
          `Input Tokens: ${s.totalInputTokens.toLocaleString()}\n` +
          `Output Tokens: ${s.totalOutputTokens.toLocaleString()}\n` +
          `Total Calls: ${s.entries.length}\n\n` +
          (s.budget.enabled ? `Budget: $${s.budget.dailyLimit}/day, $${s.budget.monthlyLimit}/month` : "Budget tracking: disabled"),
          "info"
        );
        return;
      }

      if (sub === "history") {
        const recent = _costStore.entries.slice(-20).reverse();
        if (recent.length === 0) { ctx.ui.notify("No cost entries yet.", "info"); return; }
        const lines = recent.map(e => `  $${e.estimatedCost.toFixed(4)} — ${e.model} (${e.inputTokens}→${e.outputTokens} tokens) — ${e.agent}`);
        ctx.ui.notify(`💰 **Recent Costs**\n${lines.join("\n")}`, "info");
        return;
      }

      if (sub === "budget" && parts[1]) {
        const budget = parseFloat(parts[1]);
        if (isNaN(budget)) { ctx.ui.notify("⚠️ Usage: /cost budget <daily_limit>", "error"); return; }
        _costStore.budget.dailyLimit = budget;
        _costStore.budget.enabled = true;
        saveCosts(_costStore);
        ctx.ui.notify(`💰 Budget set to $${budget}/day. Alerts at $${(budget * 0.8).toFixed(2)}.`, "info");
        return;
      }

      if (sub === "reset") {
        _costStore.entries = []; _costStore.totalCost = 0; _costStore.totalInputTokens = 0; _costStore.totalOutputTokens = 0; _costStore.dailyCost = 0; _costStore.monthlyCost = 0;
        saveCosts(_costStore);
        ctx.ui.notify("💰 Cost data reset.", "info");
        return;
      }

      ctx.ui.notify("Usage: /cost <dashboard|history|budget <daily_limit>|reset>", "info");
    },
  });

  pi.registerTool({
    name: "cost_track",
    label: "Track LLM Call Cost",
    description: "Record an LLM API call with token counts to track spending across all providers.",
    promptSnippet: "Record LLM API cost",
    parameters: Type.Object({
      model: Type.String({ description: "Model name (e.g., gpt-4o, claude-3-sonnet)" }),
      provider: Type.String({ description: "Provider (openai, anthropic, google, ollama)" }),
      input_tokens: Type.Number({ description: "Input token count" }),
      output_tokens: Type.Number({ description: "Output token count" }),
      tool: Type.Optional(Type.String({ description: "Tool/feature that triggered this call" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_costCtx) _costCtx = ctx.session?.id || ctx.contextId || "";
      _costStore = loadCosts(_costCtx);
      const cost = estimateCost(params.model, params.input_tokens, params.output_tokens);
      addCostEntry(_costStore, {
        timestamp: Date.now(), model: params.model, provider: params.provider,
        inputTokens: params.input_tokens, outputTokens: params.output_tokens,
        estimatedCost: cost, agent: ctx.agent?.name || "agent",
        tool: params.tool || "unknown", duration: 0,
      });

      let alert = "";
      if (_costStore.budget.enabled && _costStore.dailyCost > _costStore.budget.dailyLimit * _costStore.budget.alertThreshold) {
        alert = ` ⚠️ ${(_costStore.dailyCost / _costStore.budget.dailyLimit * 100).toFixed(0)}% of daily budget used!`;
      }

      return { content: [{ type: "text", text: `💰 Tracked: $${cost.toFixed(6)} (${params.provider}/${params.model}) — Daily: $${_costStore.dailyCost.toFixed(4)}${alert}` }], details: { cost, dailyCost: _costStore.dailyCost } };
    },
  });

  pi.registerTool({
    name: "cost_check_budget",
    label: "Check Budget Status",
    description: "Check current spending against budget limits. Returns alerts if approaching limits.",
    promptSnippet: "Check LLM budget status",
    parameters: Type.Object({}),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_costCtx) _costCtx = ctx.session?.id || ctx.contextId || "";
      _costStore = loadCosts(_costCtx);
      const s = _costStore;
      let status = `💰 **Budget Status**\nTotal: $${s.totalCost.toFixed(4)} | Daily: $${s.dailyCost.toFixed(4)} | Monthly: $${s.monthlyCost.toFixed(4)}`;
      if (s.budget.enabled) {
        status += `\nDaily Limit: $${s.budget.dailyLimit.toFixed(2)} (${(s.dailyCost / s.budget.dailyLimit * 100).toFixed(1)}%)`;
        if (s.dailyCost > s.budget.dailyLimit) status += "\n🚨 **Daily budget exceeded!**";
        else if (s.dailyCost > s.budget.dailyLimit * 0.9) status += "\n⚠️ Approaching daily limit";
      }
      return { content: [{ type: "text", text: status }], details: { totalCost: s.totalCost, dailyCost: s.dailyCost } };
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    if (!_costCtx) _costCtx = ctx.session?.id || ctx.contextId || "";
    if (!_costCtx) return;
    try {
      _costStore = loadCosts(_costCtx);
      if (_costStore.totalCost > 0 || _costStore.entries.length > 0) {
        ctx.ui.notify(`💰 Total LLM cost: $${_costStore.totalCost.toFixed(4)} (${_costStore.entries.length} calls)`, "info");
      }
    } catch {}
  });

  return { loadCosts, addCostEntry, estimateCost };
}
