/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🛡️ RUDRAX APPROVAL GATES — Human-in-the-Loop Safety System
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Critical operations require human approval before execution. This system
 * defines Gates that intercept sensitive tool calls and prompt the user
 * for confirmation.
 *
 * Gates can be configured at three levels:
 *   🟢 L1 — Informational (log only, no block)
 *   🟡 L2 — Warning (notify user, but auto-continue after N seconds)
 *   🔴 L3 — Blocking (must get explicit user approval)
 *
 * Categories gated:
 *   - FILE_DELETE: Permanent file/directory removal
 *   - FILE_OVERWRITE: Overwriting existing files  
 *   - BASH_DESTRUCTIVE: Dangerous bash commands (rm -rf, dd, etc.)
 *   - DEPLOY: Production deployments
 *   - API_KEY_ACCESS: Reading or exposing credentials
 *   - NETWORK_OPERATION: External API calls with side effects
 *   - AGENT_SPAWN: Creating sub-agents (cost control)
 *   - EXPENSIVE_COMPUTE: Costly LLM calls
 *   - CODE_MIGRATION: Large-scale code changes
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type GateLevel = "L1_info" | "L2_warning" | "L3_blocking";
type GateCategory =
  | "FILE_DELETE" | "FILE_OVERWRITE" | "BASH_DESTRUCTIVE"
  | "DEPLOY" | "API_KEY_ACCESS" | "NETWORK_OPERATION"
  | "AGENT_SPAWN" | "EXPENSIVE_COMPUTE" | "CODE_MIGRATION"
  | "DATABASE_WRITE" | "PERMISSION_CHANGE" | "ENV_MODIFICATION";

interface Gate {
  category: GateCategory;
  level: GateLevel;
  description: string;
  pattern: RegExp | string;  // Pattern to match against tool call args
  timeout?: number;           // Auto-approve after N ms (for L2)
  whitelist?: string[];       // Always-allow strings
}

interface ApprovalRequest {
  id: string;
  timestamp: number;
  category: GateCategory;
  toolName: string;
  args: string;
  summary: string;
  status: "pending" | "approved" | "denied" | "timed_out";
  resolvedAt?: number;
  resolver?: "user" | "auto";
}

interface GateConfig {
  enabled: boolean;
  gates: Gate[];
  pendingRequests: ApprovalRequest[];
  history: ApprovalRequest[];
  autoApprovePatterns: RegExp[];  // Patterns that auto-approve
  denyOnNoResponse: boolean;      // If user doesn't respond, deny
  maxPendingRequests: number;     // Max pending before auto-deny new ones
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT GATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_GATES: Gate[] = [
  // 🛑 File deletion
  {
    category: "FILE_DELETE",
    level: "L3_blocking",
    description: "Permanent file or directory deletion",
    pattern: /\brm\s+(-rf|-r|-f)\s+/,
  },
  {
    category: "FILE_DELETE",
    level: "L3_blocking",
    description: "Unlink/delete file operations",
    pattern: /\b(unlinkSync|unlink\s|rmSync|rmdirSync|removeSync)\s*\(/,
  },

  // 🛑 Destructive bash
  {
    category: "BASH_DESTRUCTIVE",
    level: "L3_blocking",
    description: "Dangerous bash commands",
    pattern: /\b(dd\s+|mkfs\.|fdisk|format\s+|shred\s+|kill\s+-9|pkill\s+)/,
  },
  {
    category: "BASH_DESTRUCTIVE",
    level: "L2_warning",
    description: "Recursive directory operations",
    pattern: /\b(chmod\s+-R|chown\s+-R|find\s+.*-delete|rm\s+-rf\s+\/)/,
    timeout: 30000,
  },

  // 🟡 Deployments
  {
    category: "DEPLOY",
    level: "L3_blocking",
    description: "Production deployment",
    pattern: /\b(deploy|publish|release|rollout)\s+.*(--prod|production|--env\s+prod)/i,
  },
  {
    category: "DEPLOY",
    level: "L2_warning",
    description: "Any deployment operation",
    pattern: /\b(deploy|publish|npm publish|docker push)/i,
    timeout: 30000,
  },

  // 🛑 API key / credential access
  {
    category: "API_KEY_ACCESS",
    level: "L3_blocking",
    description: "Reading credential files",
    pattern: /\.(env|credentials|pem|key|secret|cert)\b/i,
  },
  {
    category: "API_KEY_ACCESS",
    level: "L3_blocking",
    description: "Environment variable access for secrets",
    pattern: /\b(process\.env\.(?:API_KEY|SECRET|PASSWORD|TOKEN|AUTH))/i,
  },

  // 🟡 Network operations
  {
    category: "NETWORK_OPERATION",
    level: "L2_warning",
    description: "External HTTP requests",
    pattern: /\b(fetch|axios|got|request)\s*\(["']https?:\/\//,
    timeout: 15000,
  },

  // 🟡 Agent spawning (cost control)
  {
    category: "AGENT_SPAWN",
    level: "L2_warning",
    description: "Spawning new sub-agents",
    pattern: /\b(agency_dispatch|agency_parallel_dispatch|spawn_agent)\b/,
    timeout: 10000,
  },

  // 🟡 Expensive compute
  {
    category: "EXPENSIVE_COMPUTE",
    level: "L2_warning",
    description: "Potentially expensive LLM calls or computations",
    pattern: /\b(analyze_all|scan_repo|full_audit|rewrite_entire)/i,
    timeout: 15000,
  },

  // 🛑 Database writes
  {
    category: "DATABASE_WRITE",
    level: "L3_blocking",
    description: "Database write operations",
    pattern: /\b(INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE)/i,
  },

  // 🟡 Large-scale code migration
  {
    category: "CODE_MIGRATION",
    level: "L2_warning",
    description: "Large-scale code changes across many files",
    pattern: /\b(migrate|rename_all|restructure|refactor_all)/i,
    timeout: 30000,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// GATE MANAGER
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG_DIR = path.join(os.homedir(), ".rudrax", "agent", "gates");

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function configPath(): string {
  ensureConfigDir();
  return path.join(CONFIG_DIR, "gate-config.json");
}

function loadConfig(): GateConfig {
  const cp = configPath();
  if (fs.existsSync(cp)) {
    try { return JSON.parse(fs.readFileSync(cp, "utf-8")); } catch { /* fall through */ }
  }
  return {
    enabled: true,
    gates: DEFAULT_GATES,
    pendingRequests: [],
    history: [],
    autoApprovePatterns: [/^test/, /^example/, /^\/tmp\//],
    denyOnNoResponse: false,
    maxPendingRequests: 3,
  };
}

function saveConfig(config: GateConfig): void {
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), "utf-8");
}

function generateApprovalId(): string {
  return `gate_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function checkGates(
  toolName: string,
  args: string,
  config: GateConfig
): { gate: Gate; match: string } | null {
  if (!config.enabled) return null;

  const argStr = typeof args === "string" ? args : JSON.stringify(args);

  for (const gate of config.gates) {
    const pattern = typeof gate.pattern === "string"
      ? new RegExp(gate.pattern, "i")
      : gate.pattern;

    if (pattern.test(argStr)) {
      // Check whitelist
      if (gate.whitelist && gate.whitelist.some(w => argStr.includes(w))) continue;

      const match = argStr.match(pattern);
      return { gate, match: match ? match[0] : argStr };
    }
  }

  return null;
}

function createApprovalRequest(
  gate: Gate,
  toolName: string,
  args: string,
  config: GateConfig
): ApprovalRequest & { timeout?: ReturnType<typeof setTimeout> } {
  const request: ApprovalRequest & { timeout?: any } = {
    id: generateApprovalId(),
    timestamp: Date.now(),
    category: gate.category,
    toolName,
    args: typeof args === "string" ? args.slice(0, 500) : JSON.stringify(args).slice(0, 500),
    summary: `${gate.description} — "${toolName}"`,
    status: "pending",
  };

  config.pendingRequests.push(request);
  if (config.pendingRequests.length > config.maxPendingRequests) {
    config.pendingRequests.shift();
  }

  // For L2_warning, set auto-timeout
  if (gate.level === "L2_warning" && gate.timeout) {
    request.timeout = setTimeout(() => {
      request.status = "timed_out";
      request.resolvedAt = Date.now();
      request.resolver = "auto";
      // Auto-approve on timeout for L2
    }, gate.timeout);
  }

  saveConfig(config);
  return request;
}

function approveRequest(requestId: string, config: GateConfig): boolean {
  const request = config.pendingRequests.find(r => r.id === requestId);
  if (!request) return false;

  request.status = "approved";
  request.resolvedAt = Date.now();
  request.resolver = "user";
  config.pendingRequests = config.pendingRequests.filter(r => r.id !== requestId);
  config.history.push(request);
  if (config.history.length > 100) config.history = config.history.slice(-100);
  saveConfig(config);
  return true;
}

function denyRequest(requestId: string, config: GateConfig): void {
  const request = config.pendingRequests.find(r => r.id === requestId);
  if (!request) return;

  request.status = "denied";
  request.resolvedAt = Date.now();
  request.resolver = "user";
  config.pendingRequests = config.pendingRequests.filter(r => r.id !== requestId);
  config.history.push(request);
  if (config.history.length > 100) config.history = config.history.slice(-100);
  saveConfig(config);
}

function isApproved(requestId: string, config: GateConfig): boolean {
  const request = config.history.find(r => r.id === requestId);
  return request?.status === "approved";
}

function getPendingSummary(config: GateConfig): string {
  if (config.pendingRequests.length === 0) return "";

  let summary = "\n<approval-gates>\n🛡️ **${config.pendingRequests.length} Pending Approval Requests**\n\n";

  for (const req of config.pendingRequests) {
    const elapsed = ((Date.now() - req.timestamp) / 1000).toFixed(0);
    const levelIcon = req.category.includes("DELETE") || req.category.includes("DESTRUCTIVE") ? "🔴" : "🟡";
    summary += `${levelIcon} **[${req.id}]** ${req.summary}\n`;
    summary += `   Args: ${req.args.slice(0, 150)}\n`;
    summary += `   Waiting: ${elapsed}s\n\n`;
  }

  summary += `Use gate_approve or gate_deny to respond.\n`;
  summary += "</approval-gates>\n";

  return summary;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

let config: GateConfig = loadConfig();

export default function (pi: ExtensionAPI) {

  // ─── /gate command ────────────────────────────────────────────
  pi.registerCommand("gate", {
    description: "Approval Gates: human-in-the-loop safety. Usage: /gate <status|approve|deny|enable|disable|level|list>",
    getArgumentCompletions(prefix: string) {
      const subs = ["status", "approve", "deny", "enable", "disable", "level", "list", "history"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "status";
      config = loadConfig();

      if (sub === "status") {
        const pending = config.pendingRequests.length;
        const activeGates = config.gates.filter(g => g.level === "L3_blocking").length;
        ctx.ui.notify(
          `🛡️ **Approval Gates**\n` +
          `  Status: ${config.enabled ? "🟢 Active" : "🔴 Disabled"}\n` +
          `  Pending requests: ${pending}\n` +
          `  Blocking gates: ${activeGates}\n` +
          `  Total gates: ${config.gates.length}\n` +
          `  Deny on no response: ${config.denyOnNoResponse}`,
          "info"
        );
        return;
      }

      if (sub === "approve" && parts[1]) {
        if (approveRequest(parts[1], config)) {
          ctx.ui.notify(`✅ Approved request: ${parts[1]}`, "info");
        } else {
          ctx.ui.notify(`⚠️ Request not found: ${parts[1]}`, "warn");
        }
        return;
      }

      if (sub === "deny" && parts[1]) {
        denyRequest(parts[1], config);
        ctx.ui.notify(`❌ Denied request: ${parts[1]}`, "info");
        return;
      }

      if (sub === "enable") {
        config.enabled = true;
        saveConfig(config);
        ctx.ui.notify("🛡️ Approval gates ENABLED", "info");
        return;
      }

      if (sub === "disable") {
        config.enabled = false;
        saveConfig(config);
        ctx.ui.notify("⚠️ Approval gates DISABLED", "warn");
        return;
      }

      if (sub === "level" && parts[1] && parts[2]) {
        const gate = config.gates.find(g => g.category === parts[1].toUpperCase());
        if (gate && ["L1_info", "L2_warning", "L3_blocking"].includes(parts[2])) {
          gate.level = parts[2] as GateLevel;
          saveConfig(config);
          ctx.ui.notify(`✅ Gate ${parts[1]} set to ${parts[2]}`, "info");
        } else {
          ctx.ui.notify(`Unknown gate category or level. Categories: ${config.gates.map(g => g.category).join(", ")}`, "error");
        }
        return;
      }

      if (sub === "list") {
        const byLevel = config.gates.reduce((acc, g) => {
          acc[g.level] = acc[g.level] || [];
          acc[g.level].push(g);
          return acc;
        }, {} as Record<string, Gate[]>);

        let output = "🛡️ **Approval Gates**\n\n";
        for (const [level, gates] of Object.entries(byLevel)) {
          const icon = level === "L3_blocking" ? "🔴" : level === "L2_warning" ? "🟡" : "🟢";
          output += `${icon} **${level}** (${gates.length} gates)\n`;
          for (const g of gates) {
            output += `  • ${g.category}: ${g.description}\n`;
          }
          output += "\n";
        }
        ctx.ui.notify(output, "info");
        return;
      }

      if (sub === "history") {
        const recent = config.history.slice(-20).reverse();
        if (recent.length === 0) { ctx.ui.notify("📋 No approval history.", "info"); return; }
        const lines = recent.map(r => {
          const icon = r.status === "approved" ? "✅" : r.status === "denied" ? "❌" : "⏳";
          const time = new Date(r.timestamp).toLocaleTimeString();
          return `${icon} [${time}] ${r.summary} → ${r.status}`;
        }).join("\n");
        ctx.ui.notify(`📋 **Approval History** (last ${recent.length})\n${lines}`, "info");
        return;
      }

      if (sub === "pending") {
        if (config.pendingRequests.length === 0) {
          ctx.ui.notify("✅ No pending approval requests.", "info");
          return;
        }
        const lines = config.pendingRequests.map(r => {
          const elapsed = ((Date.now() - r.timestamp) / 1000).toFixed(0);
          return `🔴 [${r.id}] ${r.summary} (${elapsed}s ago)\n   ${r.args.slice(0, 100)}`;
        }).join("\n\n");
        ctx.ui.notify(`📋 **Pending Approvals** (${config.pendingRequests.length})\n${lines}`, "info");
        return;
      }

      ctx.ui.notify(
        "Usage: /gate <status|approve|deny|enable|disable|level|list|history|pending>\n" +
        "  /gate approve <id>  — Approve pending request\n" +
        "  /gate deny <id>     — Deny pending request\n" +
        "  /gate level <cat> <L1|L2|L3>  — Change gate level\n" +
        "  /gate list          — List all gates with levels",
        "info"
      );
    },
  });

  // ─── TOOL: gate_check — Check if operation is approved ───────
  pi.registerTool({
    name: "gate_check",
    label: "Check Approval Gate",
    description:
      "Check if a proposed operation passes the approval gates. Returns whether the operation is " +
      "allowed, or if it requires human approval. ALWAYS call this before executing potentially " +
      "destructive operations like file deletion, deployments, or credential access.",
    promptSnippet: "Check if an operation passes approval gates",
    promptGuidelines: [
      "Always call gate_check before destructive operations (rm -rf, deploy, credential access).",
      "If the result says 'requires_approval', wait for user to approve before proceeding.",
      "If the result says 'blocked', do NOT attempt the operation.",
      "For L2_warning gates, the operation auto-approves after a timeout if no response.",
    ],
    parameters: Type.Object({
      tool_name: Type.String({ description: "Name of the tool/operation to check" }),
      args: Type.String({ description: "The arguments or command that would be executed" }),
      description: Type.Optional(Type.String({ description: "Human-readable description of what you're trying to do" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      config = loadConfig();

      const result = checkGates(params.tool_name, params.args, config);

      if (!result) {
        return {
          content: [{ type: "text", text: `✅ No gate triggered. Operation "${params.tool_name}" is safe to proceed.` }],
          details: { allowed: true, gateTriggered: false },
        };
      }

      const { gate, match } = result;

      if (gate.level === "L1_info") {
        return {
          content: [{
            type: "text",
            text: `ℹ️ **Gate L1 (Info): ${gate.category}**\nOperation: ${params.description || gate.description}\nPattern matched: "${match}"\n\nThis operation is logged but not blocked. Proceed with awareness.`,
          }],
          details: { allowed: true, level: "L1_info", category: gate.category },
        };
      }

      if (gate.level === "L2_warning") {
        const request = createApprovalRequest(gate, params.tool_name, params.args, config);
        const timeout = gate.timeout ? `${(gate.timeout / 1000).toFixed(0)}s` : "N/A";

        return {
          content: [{
            type: "text",
            text: `🟡 **Gate L2 (Warning): ${gate.category}**\n` +
              `Operation: ${params.description || gate.description}\n` +
              `Pattern matched: "${match}"\n\n` +
              `⚠️ This operation will proceed automatically after ${timeout} unless denied.\n` +
              `Use /gate deny ${request.id} to block it.\n` +
              `Approval ID: ${request.id}`,
          }],
          details: {
            allowed: true,
            level: "L2_warning",
            category: gate.category,
            approvalId: request.id,
            autoApproveAfter: gate.timeout,
          },
        };
      }

      if (gate.level === "L3_blocking") {
        const request = createApprovalRequest(gate, params.tool_name, params.args, config);

        // Notify UI about pending approval
        ctx.ui.notify(
          `🔴 **BLOCKED: ${gate.category}** — ${params.description || gate.description}\nApproval required: /gate approve ${request.id}`,
          "warn"
        );

        return {
          content: [{
            type: "text",
            text: `🔴 **Gate L3 (Blocked): ${gate.category}**\n` +
              `Operation: ${params.description || gate.description}\n` +
              `Pattern matched: "${match}"\n\n` +
              `⛔ This operation requires human approval.\n` +
              `Please ask the user to run: /gate approve ${request.id}\n` +
              `Or deny with: /gate deny ${request.id}\n\n` +
              `Waiting for user response...`,
          }],
          details: {
            allowed: false,
            level: "L3_blocking",
            category: gate.category,
            approvalId: request.id,
            requiresApproval: true,
          },
        };
      }

      return {
        content: [{ type: "text", text: `✅ Operation allowed.` }],
        details: { allowed: true },
      };
    },
  });

  // ─── TOOL: gate_approve — Approve pending request ────────────
  pi.registerTool({
    name: "gate_approve",
    label: "Approve Pending Gate Request",
    description:
      "Approve a pending approval gate request. Use this when the user tells you to proceed " +
      "with a blocked operation. The approval ID is provided by gate_check.",
    promptSnippet: "Approve a blocked operation",
    parameters: Type.Object({
      request_id: Type.String({ description: "The approval request ID from gate_check" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      config = loadConfig();
      if (approveRequest(params.request_id, config)) {
        ctx.ui.notify(`✅ Approved: ${params.request_id}`, "info");
        return {
          content: [{ type: "text", text: `✅ **Request Approved**\n\nRequest ${params.request_id} has been approved. You may now proceed with the operation.` }],
          details: { approved: true, requestId: params.request_id },
        };
      }
      return {
        content: [{ type: "text", text: `⚠️ Request not found: ${params.request_id}` }],
        details: { approved: false },
      };
    },
  });

  // ─── TOOL: gate_deny — Deny pending request ──────────────────
  pi.registerTool({
    name: "gate_deny",
    label: "Deny Pending Gate Request",
    description: "Deny a pending approval gate request. The operation will be blocked.",
    promptSnippet: "Deny a blocked operation",
    parameters: Type.Object({
      request_id: Type.String({ description: "The approval request ID from gate_check" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      config = loadConfig();
      denyRequest(params.request_id, config);
      return {
        content: [{ type: "text", text: `❌ **Request Denied**\n\nRequest ${params.request_id} has been denied. Do NOT proceed with the operation.` }],
        details: { denied: true, requestId: params.request_id },
      };
    },
  });

  // ─── Hook: before_agent_start — Inject pending gates ─────────
  pi.on("before_agent_start", async (event, _ctx) => {
    config = loadConfig();
    const pendingSummary = getPendingSummary(config);
    if (pendingSummary) {
      return { systemPrompt: event.systemPrompt + pendingSummary };
    }
    return {};
  });

  // ─── session_start — Show gate status ────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    config = loadConfig();
    if (config.enabled && config.pendingRequests.length > 0) {
      ctx.ui.notify(`🛡️ ${config.pendingRequests.length} pending approval requests. Use /gate status to review.`, "info");
    }
  });

  return {
    loadConfig, saveConfig, checkGates, approveRequest, denyRequest,
    createApprovalRequest, getPendingSummary, DEFAULT_GATES,
  };
}
