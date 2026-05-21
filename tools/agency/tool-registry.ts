/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🔧 RUDRAX DYNAMIC TOOL REGISTRY — Agent-Created Tools & Skills
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Enables agents to dynamically create, register, and use new tools
 * at runtime. Tools can be:
 *   - Bash scripts (any executable command)
 *   - JavaScript/TypeScript functions
 *   - Composite tools (chains of existing tools)
 *   - API wrappers (REST endpoints)
 *
 * Each tool is validated, documented, and made available to all agents.
 * Tools persist across sessions in ~/.rudrax/agent/custom-tools/
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

interface CustomTool {
  id: string;
  name: string;
  description: string;
  type: "bash" | "javascript" | "composite" | "api";
  code: string;
  parameters: Record<string, { type: string; description: string; required: boolean }>;
  output: string;
  tags: string[];
  created: number;
  createdBy: string;
  usage: { count: number; lastUsed: number; avgDuration: number };
  version: string;
}

const TOOLS_DIR = path.join(os.homedir(), ".rudrax", "agent", "custom-tools");
const REGISTRY_FILE = path.join(TOOLS_DIR, "registry.json");

function ensureToolsDir(): void { if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true }); }

function loadRegistry(): CustomTool[] {
  ensureToolsDir();
  if (fs.existsSync(REGISTRY_FILE)) { try { return JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf-8")); } catch {} }
  return [];
}

function saveRegistry(tools: CustomTool[]): void {
  ensureToolsDir();
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(tools, null, 2), "utf-8");
}

export default function (pi: ExtensionAPI) {
  let registry: CustomTool[] = loadRegistry();

  pi.registerCommand("tool-registry", {
    description: "Dynamic Tool Registry: create, list, and manage custom tools. Usage: /tool-registry <list|create|show|delete|test>",
    getArgumentCompletions(prefix: string) {
      const subs = ["list", "create", "show", "delete", "test"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "list";
      registry = loadRegistry();

      if (sub === "list") {
        if (registry.length === 0) { ctx.ui.notify("📦 No custom tools registered.", "info"); return; }
        const lines = registry.map(t => `  🔧 **${t.name}** (${t.type}) — ${t.description.slice(0, 80)} — used ${t.usage.count}x`);
        ctx.ui.notify(`📦 **Custom Tools** (${registry.length})\n${lines.join("\n")}`, "info");
        return;
      }

      if (sub === "create" && parts.length >= 3) {
        const type = parts[1] as CustomTool["type"];
        const name = parts[2];
        const code = parts.slice(3).join(" ");
        if (!["bash", "javascript", "composite", "api"].includes(type)) {
          ctx.ui.notify("⚠️ Type must be: bash, javascript, composite, or api", "error");
          return;
        }
        const tool: CustomTool = {
          id: `ct_${Date.now().toString(36)}`,
          name, type, code,
          description: `Custom ${type} tool: ${name}`,
          parameters: {},
          output: "text",
          tags: ["custom"],
          created: Date.now(),
          createdBy: ctx.agent?.name || "user",
          usage: { count: 0, lastUsed: 0, avgDuration: 0 },
          version: "1.0",
        };
        registry.push(tool);
        saveRegistry(registry);
        ctx.ui.notify(`✅ Created custom tool "${name}" (${type})`, "info");
        return;
      }

      if (sub === "show" && parts[1]) {
        const tool = registry.find(t => t.name === parts[1] || t.id === parts[1]);
        if (!tool) { ctx.ui.notify(`Tool not found: ${parts[1]}`, "warn"); return; }
        ctx.ui.notify(`🔧 **${tool.name}** (${tool.type}) v${tool.version}\nCreated by: ${tool.createdBy}\nUsed: ${tool.usage.count}x\nCode:\n\`\`\`\n${tool.code.slice(0, 500)}\n\`\`\``, "info");
        return;
      }

      if (sub === "delete" && parts[1]) {
        const idx = registry.findIndex(t => t.name === parts[1] || t.id === parts[1]);
        if (idx === -1) { ctx.ui.notify(`Tool not found: ${parts[1]}`, "warn"); return; }
        const removed = registry.splice(idx, 1)[0];
        saveRegistry(registry);
        ctx.ui.notify(`🗑️ Deleted tool: ${removed.name}`, "info");
        return;
      }

      ctx.ui.notify("Usage: /tool-registry <list|create <type> <name> <code>|show <name>|delete <name>>", "info");
    },
  });

  pi.registerTool({
    name: "tool_registry_create",
    label: "Create Custom Tool",
    description: "Create a new custom tool that can be used by any agent. Supports bash scripts, JavaScript, composite tool chains, and API wrappers.",
    promptSnippet: "Create a new reusable custom tool",
    parameters: Type.Object({
      name: Type.String({ description: "Tool name (snake_case)" }),
      type: Type.Union([Type.Literal("bash"), Type.Literal("javascript"), Type.Literal("composite"), Type.Literal("api")], { description: "Tool type" }),
      description: Type.String({ description: "What this tool does" }),
      code: Type.String({ description: "The tool code/script content" }),
      parameters: Type.Optional(Type.Record(Type.String(), Type.Object({
        type: Type.String({ description: "Parameter type: string, number, boolean" }),
        description: Type.String({ description: "Parameter description" }),
        required: Type.Boolean({ description: "Is this parameter required?" }),
      }), { description: "Tool parameters" })),
      tags: Type.Optional(Type.Array(Type.String(), { description: "Search tags" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      registry = loadRegistry();
      if (registry.find(t => t.name === params.name)) {
        return { content: [{ type: "text", text: `⚠️ Tool "${params.name}" already exists. Use tool_registry_update to modify.` }], details: { error: "exists" } };
      }
      const tool: CustomTool = {
        id: `ct_${Date.now().toString(36)}`, name: params.name, type: params.type,
        description: params.description, code: params.code,
        parameters: params.parameters || {},
        output: "text", tags: params.tags || ["custom"], created: Date.now(),
        createdBy: ctx.agent?.name || "agent",
        usage: { count: 0, lastUsed: 0, avgDuration: 0 }, version: "1.0",
      };
      registry.push(tool);
      saveRegistry(registry);
      return { content: [{ type: "text", text: `✅ Created tool "${params.name}" (${params.type}). All agents can now use it.` }], details: { toolId: tool.id } };
    },
  });

  pi.registerTool({
    name: "tool_registry_list",
    label: "List Custom Tools",
    description: "List all available custom tools in the registry.",
    promptSnippet: "List available custom tools",
    parameters: Type.Object({ tag: Type.Optional(Type.String({ description: "Filter by tag" })) }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      registry = loadRegistry();
      let tools = registry;
      if (params.tag) tools = tools.filter(t => t.tags.includes(params.tag!));
      if (tools.length === 0) return { content: [{ type: "text", text: "📦 No custom tools available." }], details: { count: 0 } };
      const listing = tools.map(t => `🔧 **${t.name}** (${t.type}) — ${t.description} — ${t.usage.count}x used`).join("\n");
      return { content: [{ type: "text", text: `📦 **Custom Tools**\n${listing}` }], details: { count: tools.length } };
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    registry = loadRegistry();
    if (registry.length > 0) ctx.ui.notify(`🔧 ${registry.length} custom tools available in registry`, "info");
  });

  return { loadRegistry, saveRegistry };
}
