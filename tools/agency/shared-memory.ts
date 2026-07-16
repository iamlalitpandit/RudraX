/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🗂️ RUDRAX SHARED MEMORY — Cross-Agent Communication Layer
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Every project/context gets a shared memory file that ALL agents read from
 * and write to. This creates a "shared brain" so multi-agent teams can:
 *
 *   1. READ what other agents have done (avoid duplicate work)
 *   2. WRITE their own results (handoff context)
 *   3. QUERY the project structure (understand the codebase)
 *   4. TRACK decisions (avoid conflicting approaches)
 *   5. FLAG blockers (visible to all agents)
 *
 * Architecture:
 * ┌────────────────────────────────────────────────────┐
 * │  Agent A ──writes──→ ┌──────────┐ ←──reads── Agent B │
 * │                     │  SHARED  │                      │
 * │  Agent C ──writes──→│  MEMORY  │←──reads── Agent D  │
 * │                     │  FILE    │                      │
 * │  Orchestrator ─────→│          │←──── Agent E        │
 * │                     └──────────┘                      │
 * └────────────────────────────────────────────────────┘
 *
 * Memory files stored at:
 *   ~/.rudrax/agent/memory/{context-id}.md
 *
 * File format: YAML frontmatter + structured Markdown sections
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface MemoryEntry {
  agent: string;
  timestamp: number;
  type: "task_result" | "decision" | "file_changed" | "structure_update" | "blocker" | "note" | "handoff";
  content: string;
  metadata?: Record<string, string>;
}

interface ProjectStructure {
  lastUpdated: number;
  tree: string;
}

interface TaskBoard {
  [taskId: string]: {
    agent: string;
    status: "pending" | "in_progress" | "completed" | "blocked";
    description: string;
    result?: string;
    updatedAt: number;
  };
}

interface SharedMemoryFile {
  // Frontmatter
  project: string;
  contextId: string;
  created: number;
  updated: number;
  status: "active" | "paused" | "completed" | "archived";

  // Sections
  overview: string;
  structure: ProjectStructure;
  activityLog: MemoryEntry[];
  taskBoard: TaskBoard;
  decisions: MemoryEntry[];
  filesChanged: string[];
  blockers: MemoryEntry[];
  handoffs: MemoryEntry[];
  notes: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY MANAGER — Core read/write/query engine
// ═══════════════════════════════════════════════════════════════════════════

const MEMORY_DIR = path.join(os.homedir(), ".rudrax", "agent", "memory");

/** Ensure the memory directory exists */
function ensureMemoryDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

/** Get memory file path for a context */
function memoryPath(contextId: string): string {
  ensureMemoryDir();
  // Sanitize context ID for filename
  const safeId = contextId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(MEMORY_DIR, `${safeId}.md`);
}

/** Check if memory exists for a context */
function memoryExists(contextId: string): boolean {
  return fs.existsSync(memoryPath(contextId));
}

// ─── Serialization ────────────────────────────────────────────────────

/** Parse a shared memory file from disk */
function parseMemoryFile(filePath: string): SharedMemoryFile | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw) return null;

    // Parse YAML frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
    const frontmatter: Record<string, any> = {};
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (kv) {
          try { frontmatter[kv[1]] = JSON.parse(kv[2]); } catch { frontmatter[kv[1]] = kv[2]; }
        }
      }
    }

    const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

    // Parse structured sections from markdown
    const sections = parseSections(body);

    return {
      project: frontmatter.project || "",
      contextId: frontmatter.context_id || "",
      created: frontmatter.created || Date.now(),
      updated: frontmatter.updated || Date.now(),
      status: frontmatter.status || "active",
      overview: sections.overview || "",
      structure: sections.structure || { lastUpdated: 0, tree: "" },
      activityLog: sections.activityLog || [],
      taskBoard: sections.taskBoard || {},
      decisions: sections.decisions || [],
      filesChanged: sections.filesChanged || [],
      blockers: sections.blockers || [],
      handoffs: sections.handoffs || [],
      notes: sections.notes || [],
    };
  } catch (e) {
    return null;
  }
}

interface ParsedSections {
  overview?: string;
  structure?: ProjectStructure;
  activityLog?: MemoryEntry[];
  taskBoard?: TaskBoard;
  decisions?: MemoryEntry[];
  filesChanged?: string[];
  blockers?: MemoryEntry[];
  handoffs?: MemoryEntry[];
  notes?: string[];
}

/** Parse markdown sections into structured data */
function parseSections(body: string): ParsedSections {
  const result: ParsedSections = {};
  const sectionRegex = /^## ([\w &]+)\n([\s\S]*?)(?=\n## |\n*$)/gm;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(body)) !== null) {
    const title = match[1].toLowerCase().trim();
    const content = match[2].trim();

    switch (title) {
      case "project overview":
        result.overview = content;
        break;
      case "project structure":
        result.structure = {
          lastUpdated: Date.now(),
          tree: content.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim(),
        };
        break;
      case "activity log":
        result.activityLog = parseLogEntries(content);
        break;
      case "task board":
        result.taskBoard = parseTaskBoard(content);
        break;
      case "decisions":
        result.decisions = parseLogEntries(content);
        break;
      case "files changed":
        result.filesChanged = content.split("\n").map(l => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
        break;
      case "blockers":
        result.blockers = parseLogEntries(content);
        break;
      case "handoffs":
        result.handoffs = parseLogEntries(content);
        break;
      case "notes":
        result.notes = content.split("\n").filter(l => l.trim());
        break;
    }
  }

  return result;
}

/** Parse log entries from markdown list format */
function parseLogEntries(content: string): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  const lines = content.split("\n");
  const entryRegex = /^[-*]\s*\*\*\[([^]]+)\]\s*([^|]+)\|\s*(\w+)\|\s*(.+)/;

  for (const line of lines) {
    const m = line.match(entryRegex);
    if (m) {
      entries.push({
        agent: m[1].trim(),
        timestamp: new Date(m[2].trim()).getTime() || Date.now(),
        type: m[3].trim().toLowerCase() as MemoryEntry["type"],
        content: m[4].trim(),
      });
    } else if (line.match(/^[-*]\s*/)) {
      // Simpler format: - agent: content
      const simple = line.replace(/^[-*]\s*/, "").trim();
      if (simple) {
        entries.push({
          agent: "unknown",
          timestamp: Date.now(),
          type: "note",
          content: simple,
        });
      }
    }
  }

  return entries;
}

/** Parse task board from markdown */
function parseTaskBoard(content: string): TaskBoard {
  const board: TaskBoard = {};
  const lines = content.split("\n");
  const taskRegex = /^[-*]\s*`?([^`:\s]+)`?\s*[:–—]\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(.+)/;

  for (const line of lines) {
    const m = line.match(taskRegex);
    if (m) {
      board[m[1]] = {
        agent: m[2],
        status: m[3].toLowerCase() as TaskBoard[string]["status"],
        description: m[4].trim(),
        updatedAt: Date.now(),
      };
    }
  }

  return board;
}

// ─── Write Operations ────────────────────────────────────────────────

/** Initialize a new shared memory file for a context */
function initMemory(contextId: string, projectName: string): SharedMemoryFile {
  ensureMemoryDir();
  const now = Date.now();
  const mem: SharedMemoryFile = {
    project: projectName,
    contextId,
    created: now,
    updated: now,
    status: "active",
    overview: `${projectName} — Shared project memory for multi-agent coordination.`,
    structure: { lastUpdated: now, tree: "(not yet scanned)" },
    activityLog: [],
    taskBoard: {},
    decisions: [],
    filesChanged: [],
    blockers: [],
    handoffs: [],
    notes: [],
  };
  writeMemoryFile(contextId, mem);
  return mem;
}

/** Serialize and write memory to disk */
function writeMemoryFile(contextId: string, mem: SharedMemoryFile): void {
  mem.updated = Date.now();
  const filePath = memoryPath(contextId);

  let md = `---\nproject: ${JSON.stringify(mem.project)}\ncontext_id: ${JSON.stringify(mem.contextId)}\ncreated: ${mem.created}\nupdated: ${mem.updated}\nstatus: ${mem.status}\n---\n\n`;

  // Project Overview
  md += `## Project Overview\n\n${mem.overview || "(No overview yet)"}\n\n`;

  // Project Structure
  md += `## Project Structure\n\n`;
  md += `*Last scanned: ${new Date(mem.structure.lastUpdated).toISOString()}*\n\n`;
  md += `\`\`\`\n${mem.structure.tree || "(not yet scanned)"}\n\`\`\`\n\n`;

  // Task Board
  md += `## Task Board\n\n`;
  const tasks = Object.entries(mem.taskBoard);
  if (tasks.length === 0) {
    md += `*(No tasks tracked yet)*\n\n`;
  } else {
    md += `| Task ID | Agent | Status | Description |\n|---------|-------|--------|-------------|\n`;
    for (const [id, task] of tasks) {
      const statusIcon = task.status === "completed" ? "✅" : task.status === "in_progress" ? "🔄" : task.status === "blocked" ? "🚫" : "⏳";
      md += `| \`${id}\` | ${task.agent} | ${statusIcon} ${task.status} | ${task.description}${task.result ? ` → ${task.result.slice(0, 80)}` : ""} |\n`;
    }
    md += `\n`;
  }

  // Activity Log (last 50)
  md += `## Activity Log\n\n`;
  const recentLog = mem.activityLog.slice(-50);
  if (recentLog.length === 0) {
    md += `*(No activity yet)*\n\n`;
  } else {
    for (const entry of recentLog) {
      const time = new Date(entry.timestamp).toLocaleString();
      const icon = entry.type === "task_result" ? "✅" : entry.type === "decision" ? "💡" : entry.type === "blocker" ? "🚫" : entry.type === "handoff" ? "🤝" : entry.type === "file_changed" ? "📝" : entry.type === "structure_update" ? "🏗️" : "📌";
      md += `- **[${entry.agent}]** ${time} | ${entry.type.toUpperCase()} | ${icon} ${entry.content}\n`;
    }
    md += `\n`;
  }

  // Decisions
  md += `## Decisions\n\n`;
  if (mem.decisions.length === 0) {
    md += `*(No decisions recorded yet)*\n\n`;
  } else {
    for (const d of mem.decisions) {
      const time = new Date(d.timestamp).toLocaleString();
      md += `- **[${d.agent}]** ${time} | 💡 ${d.content}\n`;
    }
    md += `\n`;
  }

  // Files Changed
  md += `## Files Changed\n\n`;
  if (mem.filesChanged.length === 0) {
    md += `*(No files tracked yet)*\n\n`;
  } else {
    for (const f of mem.filesChanged) {
      md += `- \`${f}\`\n`;
    }
    md += `\n`;
  }

  // Blockers
  md += `## Blockers\n\n`;
  if (mem.blockers.length === 0) {
    md += `*(No blockers — smooth sailing!)*\n\n`;
  } else {
    for (const b of mem.blockers) {
      const time = new Date(b.timestamp).toLocaleString();
      md += `- **[${b.agent}]** ${time} | 🚫 ${b.content}\n`;
    }
    md += `\n`;
  }

  // Handoffs
  md += `## Handoffs\n\n`;
  if (mem.handoffs.length === 0) {
    md += `*(No handoffs yet)*\n\n`;
  } else {
    for (const h of mem.handoffs) {
      md += `- **[${h.agent}]** → **${h.metadata?.to || "next agent"}** | 🤝 ${h.content}\n`;
    }
    md += `\n`;
  }

  // Notes
  md += `## Notes\n\n`;
  if (mem.notes.length === 0) {
    md += `*(No notes)*\n\n`;
  } else {
    for (const note of mem.notes) {
      md += `- ${note}\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(filePath, md, "utf-8");
}

/** Read memory for a context, initializing if needed */
function readMemory(contextId: string): SharedMemoryFile {
  if (memoryExists(contextId)) {
    const mem = parseMemoryFile(memoryPath(contextId));
    if (mem) return mem;
  }
  // Auto-initialize
  return initMemory(contextId, `Project ${contextId.slice(0, 8)}`);
}

/** Append an entry to the activity log */
function appendLog(contextId: string, entry: MemoryEntry): void {
  const mem = readMemory(contextId);
  mem.activityLog.push(entry);
  // Keep last 200 entries
  if (mem.activityLog.length > 200) mem.activityLog = mem.activityLog.slice(-200);
  writeMemoryFile(contextId, mem);
}

/** Update or add a task to the task board */
function updateTask(contextId: string, taskId: string, update: Partial<TaskBoard[string]>): void {
  const mem = readMemory(contextId);
  if (mem.taskBoard[taskId]) {
    Object.assign(mem.taskBoard[taskId], update, { updatedAt: Date.now() });
  } else {
    mem.taskBoard[taskId] = {
      agent: update.agent || "unknown",
      status: update.status || "pending",
      description: update.description || "",
      result: update.result,
      updatedAt: Date.now(),
    };
  }
  writeMemoryFile(contextId, mem);
}

/** Record a decision */
function recordDecision(contextId: string, entry: MemoryEntry): void {
  const mem = readMemory(contextId);
  mem.decisions.push(entry);
  writeMemoryFile(contextId, mem);
}

/** Add a file to the changed files list */
function addFileChanged(contextId: string, filePath: string): void {
  const mem = readMemory(contextId);
  if (!mem.filesChanged.includes(filePath)) {
    mem.filesChanged.push(filePath);
    writeMemoryFile(contextId, mem);
  }
}

/** Add a blocker */
function addBlocker(contextId: string, entry: MemoryEntry): void {
  const mem = readMemory(contextId);
  mem.blockers.push(entry);
  writeMemoryFile(contextId, mem);
}

/** Remove a blocker (resolved) */
function resolveBlocker(contextId: string, contentSubstring: string): void {
  const mem = readMemory(contextId);
  mem.blockers = mem.blockers.filter(b => !b.content.includes(contentSubstring));
  writeMemoryFile(contextId, mem);
}

/** Create a handoff between agents */
function createHandoff(contextId: string, from: string, to: string, content: string): void {
  const mem = readMemory(contextId);
  mem.handoffs.push({
    agent: from,
    timestamp: Date.now(),
    type: "handoff",
    content,
    metadata: { to },
  });
  // Also log it
  mem.activityLog.push({
    agent: from,
    timestamp: Date.now(),
    type: "handoff",
    content: `Handoff to ${to}: ${content}`,
    metadata: { to },
  });
  writeMemoryFile(contextId, mem);
}

/** Update project overview */
function updateOverview(contextId: string, overview: string): void {
  const mem = readMemory(contextId);
  mem.overview = overview;
  writeMemoryFile(contextId, mem);
}

/** Update project structure */
function updateStructure(contextId: string, tree: string): void {
  const mem = readMemory(contextId);
  mem.structure = { lastUpdated: Date.now(), tree };
  writeMemoryFile(contextId, mem);
}

/** Update project name */
function updateProjectName(contextId: string, name: string): void {
  const mem = readMemory(contextId);
  mem.project = name;
  writeMemoryFile(contextId, mem);
}

/** Add a note */
function addNote(contextId: string, note: string): void {
  const mem = readMemory(contextId);
  mem.notes.push(note);
  writeMemoryFile(contextId, mem);
}

/** Generate a context snippet from memory for injection into agent prompts */
function memoryContextSnippet(contextId: string): string {
  if (!contextId) return "";
  try {
    const mem = readMemory(contextId);

    let snippet = `\n<shared-memory project="${mem.project}">\n`;
    snippet += `📍 **Project:** ${mem.project}\n`;
    snippet += `📊 **Status:** ${mem.status}\n`;
    snippet += `🕐 **Last updated:** ${new Date(mem.updated).toLocaleString()}\n\n`;

    // Overview
    if (mem.overview && mem.overview !== `Project ${contextId.slice(0, 8)} — Shared project memory for multi-agent coordination.`) {
      snippet += `### Overview\n${mem.overview}\n\n`;
    }

    // Structure (compact)
    if (mem.structure.tree && mem.structure.tree !== "(not yet scanned)") {
      snippet += `### Structure\n\`\`\`\n${mem.structure.tree.split("\n").slice(0, 30).join("\n")}\n\`\`\`\n\n`;
    }

    // Active tasks
    const activeTasks = Object.entries(mem.taskBoard).filter(([, t]) => t.status === "in_progress" || t.status === "pending");
    if (activeTasks.length > 0) {
      snippet += `### Active Tasks\n`;
      for (const [id, task] of activeTasks) {
        snippet += `- [${id}] ${task.agent}: ${task.description} (${task.status})\n`;
      }
      snippet += `\n`;
    }

    // Recent activity (last 10)
    const recent = mem.activityLog.slice(-10);
    if (recent.length > 0) {
      snippet += `### Recent Activity\n`;
      for (const entry of recent) {
        snippet += `- [${entry.agent}] ${entry.type}: ${entry.content.slice(0, 120)}\n`;
      }
      snippet += `\n`;
    }

    // Recent decisions (last 5)
    const recentDecisions = mem.decisions.slice(-5);
    if (recentDecisions.length > 0) {
      snippet += `### Key Decisions\n`;
      for (const d of recentDecisions) {
        snippet += `- [${d.agent}] ${d.content.slice(0, 120)}\n`;
      }
      snippet += `\n`;
    }

    // Active blockers
    if (mem.blockers.length > 0) {
      snippet += `### ⚠️ Blockers\n`;
      for (const b of mem.blockers) {
        snippet += `- [${b.agent}] ${b.content.slice(0, 120)}\n`;
      }
      snippet += `\n`;
    }

    // Pending handoffs to this agent
    // (We don't know the recipient agent here, so we show all pending handoffs)

    // Files changed (compact)
    if (mem.filesChanged.length > 0) {
      snippet += `### Files Changed\n${mem.filesChanged.slice(-20).map(f => `- \`${f}\``).join("\n")}\n\n`;
    }

    snippet += `</shared-memory>\n`;
    snippet += `\n💡 **IMPORTANT:** Read shared memory before starting work. Write your results back using memory_write when done. Check for handoffs addressed to you.`;

    return snippet;
  } catch (e) {
    return "";
  }
}

/** List all memory files */
function listMemoryFiles(): { contextId: string; project: string; updated: number }[] {
  ensureMemoryDir();
  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith(".md"));
  return files.map(f => {
    const mem = parseMemoryFile(path.join(MEMORY_DIR, f));
    return {
      contextId: mem?.contextId || f.replace(".md", ""),
      project: mem?.project || "Unknown",
      updated: mem?.updated || 0,
    };
  }).sort((a, b) => b.updated - a.updated);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION — Register tools, commands, and hooks
// ═══════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {

  // Track the current context for memory operations
  let currentContextId: string = "";

  /**
   * Resolve a stable context id, with workspace-based CWD fallback when the
   * harness does not expose session/contextId to API tool calls.
   */
  function resolveCtxId(ctx: any): string {
    const explicit = ctx?.session?.id || ctx?.contextId || ctx?.sessionId ||
      process.env.RUDRAX_CONTEXT_ID || process.env.RUDRAX_CONTEXT_ID || "";
    if (explicit) return String(explicit);
    const cwd = process.cwd?.() || os.homedir();
    const project = path.basename(cwd) || "default";
    const fallback = `cwd_${project.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const memPath = memoryPath(fallback);
    if (!fs.existsSync(memPath)) {
      initMemory(fallback, `Project ${project}`);
    }
    return fallback;
  }

  // ─── /memory command ──────────────────────────────────────────
  pi.registerCommand("memory", {
    description: "Shared Memory: cross-agent coordination hub. Usage: /memory [status|log|tasks|decisions|blockers|handoffs|overview|reset] or /memory <write> <content>",
    getArgumentCompletions(prefix: string) {
      const subcommands = ["status", "log", "tasks", "decisions", "blockers", "handoffs", "overview", "files", "structure", "reset", "list"];
      if (!prefix) return subcommands.map(s => ({ value: s, label: s }));
      return subcommands.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0];

      if (!currentContextId) {
        currentContextId = resolveCtxId(ctx);
      }
      if (!currentContextId) {
          ctx.ui.notify("⚠️ No active context. Start a chat first to use shared memory.", "warn");
          return;
        }
      }

      if (sub === "list" || sub === "ls") {
        const files = listMemoryFiles();
        if (files.length === 0) {
          ctx.ui.notify("📂 No shared memory files yet. Start an orchestration to create one.", "info");
        } else {
          const listing = files.map(f => `  📄 ${f.project} (${f.contextId}) — ${new Date(f.updated).toLocaleString()}`).join("\n");
          ctx.ui.notify(`📂 **Shared Memory Files**\n${listing}`, "info");
        }
        return;
      }

      if (sub === "status") {
        const mem = readMemory(currentContextId);
        const taskCount = Object.keys(mem.taskBoard).length;
        const activeTasks = Object.values(mem.taskBoard).filter(t => t.status === "in_progress").length;
        const completedTasks = Object.values(mem.taskBoard).filter(t => t.status === "completed").length;
        const blockerCount = mem.blockers.length;
        ctx.ui.notify(
          `🗂️ **Shared Memory: ${mem.project}**\n` +
          `  Status: ${mem.status}\n` +
          `  Tasks: ${completedTasks}/${taskCount} completed, ${activeTasks} active\n` +
          `  Activity: ${mem.activityLog.length} entries\n` +
          `  Decisions: ${mem.decisions.length}\n` +
          `  Blockers: ${blockerCount}${blockerCount > 0 ? " ⚠️" : ""}\n` +
          `  Files: ${mem.filesChanged.length} changed\n` +
          `  Last updated: ${new Date(mem.updated).toLocaleString()}`,
          "info"
        );
        return;
      }

      if (sub === "log") {
        const mem = readMemory(currentContextId);
        const count = parseInt(parts[1]) || 15;
        const log = mem.activityLog.slice(-count);
        if (log.length === 0) {
          ctx.ui.notify("📋 Activity log is empty.", "info");
        } else {
          const lines = log.map(e => {
            const icon = e.type === "task_result" ? "✅" : e.type === "decision" ? "💡" : e.type === "blocker" ? "🚫" : e.type === "handoff" ? "🤝" : e.type === "file_changed" ? "📝" : "📌";
            const time = new Date(e.timestamp).toLocaleTimeString();
            return `  ${icon} [${e.agent}] ${time} — ${e.content.slice(0, 100)}`;
          });
          ctx.ui.notify(`📋 **Activity Log** (last ${count})\n${lines.join("\n")}`, "info");
        }
        return;
      }

      if (sub === "tasks") {
        const mem = readMemory(currentContextId);
        const tasks = Object.entries(mem.taskBoard);
        if (tasks.length === 0) {
          ctx.ui.notify("📋 No tasks in the board yet.", "info");
        } else {
          const lines = tasks.map(([id, t]) => {
            const icon = t.status === "completed" ? "✅" : t.status === "in_progress" ? "🔄" : t.status === "blocked" ? "🚫" : "⏳";
            return `  ${icon} [${id}] ${t.agent}: ${t.description.slice(0, 60)}`;
          });
          ctx.ui.notify(`📋 **Task Board**\n${lines.join("\n")}`, "info");
        }
        return;
      }

      if (sub === "decisions") {
        const mem = readMemory(currentContextId);
        if (mem.decisions.length === 0) {
          ctx.ui.notify("💡 No decisions recorded yet.", "info");
        } else {
          const lines = mem.decisions.map(d => `  💡 [${d.agent}] ${d.content.slice(0, 100)}`);
          ctx.ui.notify(`💡 **Decisions**\n${lines.join("\n")}`, "info");
        }
        return;
      }

      if (sub === "blockers") {
        const mem = readMemory(currentContextId);
        if (mem.blockers.length === 0) {
          ctx.ui.notify("✅ No blockers!", "info");
        } else {
          const lines = mem.blockers.map(b => `  🚫 [${b.agent}] ${b.content.slice(0, 100)}`);
          ctx.ui.notify(`⚠️ **Blockers**\n${lines.join("\n")}`, "info");
        }
        return;
      }

      if (sub === "handoffs") {
        const mem = readMemory(currentContextId);
        if (mem.handoffs.length === 0) {
          ctx.ui.notify("🤝 No handoffs yet.", "info");
        } else {
          const lines = mem.handoffs.map(h => `  🤝 [${h.agent}] → [${h.metadata?.to || "?"}] ${h.content.slice(0, 80)}`);
          ctx.ui.notify(`🤝 **Handoffs**\n${lines.join("\n")}`, "info");
        }
        return;
      }

      if (sub === "overview") {
        const mem = readMemory(currentContextId);
        ctx.ui.notify(`📍 **Project Overview**\n${mem.overview}`, "info");
        return;
      }

      if (sub === "files") {
        const mem = readMemory(currentContextId);
        if (mem.filesChanged.length === 0) {
          ctx.ui.notify("📝 No files tracked yet.", "info");
        } else {
          ctx.ui.notify(`📝 **Files Changed**\n${mem.filesChanged.map(f => `  - ${f}`).join("\n")}`, "info");
        }
        return;
      }

      if (sub === "structure") {
        const mem = readMemory(currentContextId);
        ctx.ui.notify(`🏗️ **Project Structure** (scanned ${new Date(mem.structure.lastUpdated).toLocaleString()})\n\`\`\`\n${mem.structure.tree}\n\`\`\``, "info");
        return;
      }

      if (sub === "reset") {
        if (currentContextId) {
          initMemory(currentContextId, `Project ${currentContextId.slice(0, 8)}`);
          ctx.ui.notify("↺ Shared memory reset.", "info");
        }
        return;
      }

      // Default: show status
      if (!sub) {
        const mem = readMemory(currentContextId);
        ctx.ui.notify(
          `🗂️ **Shared Memory: ${mem.project}**\n` +
          `Usage: /memory <status|log|tasks|decisions|blockers|handoffs|overview|files|structure|reset|list>`,
          "info"
        );
        return;
      }
    },
  });

  // ─── TOOL: memory_read — Read shared memory ──────────────────
  pi.registerTool({
    name: "memory_read",
    label: "Read Shared Memory",
    description:
      "Read the shared project memory file. This contains ALL context from other agents working on " +
      "the same project — their results, decisions, blockers, and the project structure. " +
      "ALWAYS call this before starting work to understand what's already been done and avoid duplicates. " +
      "Call with section='overview' for a quick summary, or omit section for the full memory.",
    promptSnippet: "Read the shared project memory",
    promptGuidelines: [
      "ALWAYS read shared memory BEFORE starting any task to understand what other agents have already done.",
      "Check the Activity Log for recent changes by other agents.",
      "Check the Task Board to see which tasks are assigned and which are still available.",
      "Check Blockers to see if anything is preventing your work.",
      "Check Handoffs — another agent may have prepared context specifically for you.",
    ],
    parameters: Type.Object({
      section: Type.Optional(Type.Union([
        Type.Literal("overview"),
        Type.Literal("tasks"),
        Type.Literal("log"),
        Type.Literal("decisions"),
        Type.Literal("blockers"),
        Type.Literal("handoffs"),
        Type.Literal("structure"),
        Type.Literal("files"),
        Type.Literal("full"),
      ], {
        description: "Which section to read. 'overview' for summary, 'full' for everything, or a specific section.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentContextId) {
        currentContextId = resolveCtxId(ctx);
      }

      const mem = readMemory(currentContextId);
      const section = params.section || "overview";

      if (section === "full") {
        return {
          content: [{
            type: "text",
            text: `🗂️ **Shared Memory — ${mem.project}** (Full)\n\n` +
              `## Overview\n${mem.overview}\n\n` +
              `## Structure\n\`\`\`\n${mem.structure.tree}\n\`\`\`\n\n` +
              `## Task Board\n${Object.entries(mem.taskBoard).map(([id, t]) => `- [${id}] ${t.agent}: ${t.status} — ${t.description}`).join("\n") || "(empty)"}\n\n` +
              `## Activity Log\n${mem.activityLog.slice(-20).map(e => `- [${e.agent}] ${e.type}: ${e.content.slice(0, 150)}`).join("\n") || "(empty)"}\n\n` +
              `## Decisions\n${mem.decisions.map(d => `- [${d.agent}] ${d.content.slice(0, 150)}`).join("\n") || "(none)"}\n\n` +
              `## Blockers\n${mem.blockers.map(b => `- [${b.agent}] ${b.content.slice(0, 150)}`).join("\n") || "(none)"}\n\n` +
              `## Handoffs\n${mem.handoffs.map(h => `- [${h.agent}] → [${h.metadata?.to || "?"}] ${h.content.slice(0, 120)}`).join("\n") || "(none)"}\n\n` +
              `## Files Changed\n${mem.filesChanged.map(f => `- \`${f}\``).join("\n") || "(none)"}\n`,
          }],
        };
      }

      if (section === "overview") {
        const activeTasks = Object.entries(mem.taskBoard).filter(([, t]) => t.status === "in_progress");
        const blockers = mem.blockers.length;
        return {
          content: [{
            type: "text",
            text: `🗂️ **Shared Memory — ${mem.project}**\n\n` +
              `**Overview:** ${mem.overview}\n\n` +
              `**Active Tasks:** ${activeTasks.length} | **Blockers:** ${blockers}${blockers > 0 ? " ⚠️" : ""} | **Files:** ${mem.filesChanged.length}\n\n` +
              `${activeTasks.length > 0 ? `Currently working:\n${activeTasks.map(([id, t]) => `- [${id}] ${t.agent}: ${t.description.slice(0, 80)}`).join("\n")}\n\n` : ""}` +
              `${mem.activityLog.length > 0 ? `Latest activity:\n${mem.activityLog.slice(-5).map(e => `- [${e.agent}] ${e.type}: ${e.content.slice(0, 100)}`).join("\n")}\n` : ""}`,
          }],
        };
      }

      if (section === "tasks") {
        const tasks = Object.entries(mem.taskBoard);
        return {
          content: [{
            type: "text",
            text: `📋 **Task Board** (${tasks.length} tasks)\n\n` +
              (tasks.length === 0
                ? "(No tasks yet)"
                : tasks.map(([id, t]) => {
                    const icon = t.status === "completed" ? "✅" : t.status === "in_progress" ? "🔄" : t.status === "blocked" ? "🚫" : "⏳";
                    return `${icon} **[${id}]** ${t.agent} — ${t.status}\n   ${t.description}${t.result ? `\n   Result: ${t.result.slice(0, 100)}` : ""}`;
                  }).join("\n\n")),
          }],
        };
      }

      if (section === "log") {
        return {
          content: [{
            type: "text",
            text: `📋 **Activity Log** (last 30)\n\n` +
              (mem.activityLog.length === 0
                ? "(No activity yet)"
                : mem.activityLog.slice(-30).map(e => {
                    const icon = e.type === "task_result" ? "✅" : e.type === "decision" ? "💡" : e.type === "blocker" ? "🚫" : e.type === "handoff" ? "🤝" : e.type === "file_changed" ? "📝" : "📌";
                    return `${icon} [${e.agent}] ${e.type}: ${e.content.slice(0, 150)}`;
                  }).join("\n")),
          }],
        };
      }

      if (section === "decisions") {
        return {
          content: [{
            type: "text",
            text: `💡 **Decisions**\n\n` +
              (mem.decisions.length === 0
                ? "(No decisions yet)"
                : mem.decisions.map(d => `- [${d.agent}] ${d.content}`).join("\n")),
          }],
        };
      }

      if (section === "blockers") {
        return {
          content: [{
            type: "text",
            text: mem.blockers.length === 0
              ? "✅ No blockers!"
              : `⚠️ **Blockers**\n\n${mem.blockers.map(b => `🚫 [${b.agent}] ${b.content}`).join("\n")}`,
          }],
        };
      }

      if (section === "handoffs") {
        return {
          content: [{
            type: "text",
            text: mem.handoffs.length === 0
              ? "🤝 No handoffs yet."
              : `🤝 **Handoffs**\n\n${mem.handoffs.map(h => `- [${h.agent}] → [${h.metadata?.to || "?"}] ${h.content}`).join("\n")}`,
          }],
        };
      }

      if (section === "structure") {
        return {
          content: [{
            type: "text",
            text: `🏗️ **Project Structure**\n\`\`\`\n${mem.structure.tree}\n\`\`\`\n\n*Scanned: ${new Date(mem.structure.lastUpdated).toLocaleString()}*`,
          }],
        };
      }

      if (section === "files") {
        return {
          content: [{
            type: "text",
            text: `📝 **Files Changed**\n\n${mem.filesChanged.length === 0 ? "(none)" : mem.filesChanged.map(f => `- \`${f}\``).join("\n")}`,
          }],
        };
      }

      return { content: [{ type: "text", text: "Unknown section. Use: overview, tasks, log, decisions, blockers, handoffs, structure, files, full" }] };
    },
  });

  // ─── TOOL: memory_write — Write to shared memory ─────────────
  pi.registerTool({
    name: "memory_write",
    label: "Write to Shared Memory",
    description:
      "Write results, decisions, or updates to the shared project memory. Other agents will read " +
      "this to understand what you've done. ALWAYS call this after completing a task so the next " +
      "agent picking up your work has full context. This is how agents communicate!",
    promptSnippet: "Write results to shared memory for other agents",
    promptGuidelines: [
      "ALWAYS write your task results to shared memory when done — even if you think no one needs it.",
      "Use type='task_result' for completed work, 'decision' for architectural choices, 'blocker' for problems.",
      "Use type='handoff' with to_agent when passing work to another agent — include all context they need.",
      "Use type='file_changed' when you create or modify files — list every file touched.",
      "Use type='structure_update' when you discover or alter the project structure.",
      "Be concise but thorough — the next agent depends on your summary.",
    ],
    parameters: Type.Object({
      type: Type.Union([
        Type.Literal("task_result"),
        Type.Literal("decision"),
        Type.Literal("file_changed"),
        Type.Literal("structure_update"),
        Type.Literal("blocker"),
        Type.Literal("handoff"),
        Type.Literal("note"),
      ], {
        description: "Type of entry to write",
      }),
      content: Type.String({
        description: "The content to write — summarize what was done, decided, or needs attention.",
      }),
      task_id: Type.Optional(Type.String({
        description: "Task ID this relates to (for task board updates).",
      })),
      task_status: Type.Optional(Type.Union([
        Type.Literal("pending"),
        Type.Literal("in_progress"),
        Type.Literal("completed"),
        Type.Literal("blocked"),
      ], {
        description: "Update task status on the board.",
      })),
      to_agent: Type.Optional(Type.String({
        description: "For handoffs: the agent being handed off to.",
      })),
      files_changed: Type.Optional(Type.Array(Type.String(), {
        description: "List of file paths created or modified.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentContextId) {
        currentContextId = resolveCtxId(ctx);
      }

      const agentName = ctx.agent?.name || "orchestrator";

      // Append to activity log
      appendLog(currentContextId, {
        agent: agentName,
        timestamp: Date.now(),
        type: params.type as MemoryEntry["type"],
        content: params.content,
        metadata: params.to_agent ? { to: params.to_agent } : undefined,
      });

      // Handle specific types
      if (params.type === "decision") {
        recordDecision(currentContextId, {
          agent: agentName,
          timestamp: Date.now(),
          type: "decision",
          content: params.content,
        });
      }

      if (params.type === "blocker") {
        addBlocker(currentContextId, {
          agent: agentName,
          timestamp: Date.now(),
          type: "blocker",
          content: params.content,
        });
      }

      if (params.type === "handoff" && params.to_agent) {
        createHandoff(currentContextId, agentName, params.to_agent, params.content);
      }

      // Update task board if task_id provided
      if (params.task_id) {
        updateTask(currentContextId, params.task_id, {
          agent: agentName,
          status: params.task_status || (params.type === "task_result" ? "completed" : "in_progress"),
          description: params.content.slice(0, 200),
          result: params.type === "task_result" ? params.content : undefined,
        });
      }

      // Add files changed
      if (params.files_changed) {
        for (const f of params.files_changed) {
          addFileChanged(currentContextId, f);
        }
      }

      // If type is file_changed but no files_changed list, treat content as a file path
      if (params.type === "file_changed" && !params.files_changed) {
        addFileChanged(currentContextId, params.content);
      }

      // If type is structure_update, update the structure
      if (params.type === "structure_update") {
        updateStructure(currentContextId, params.content);
      }

      const typeIcons: Record<string, string> = {
        task_result: "✅",
        decision: "💡",
        file_changed: "📝",
        structure_update: "🏗️",
        blocker: "🚫",
        handoff: "🤝",
        note: "📌",
      };

      return {
        content: [{
          type: "text",
          text: `${typeIcons[params.type] || "📌"} **Memory Updated**\n\n` +
            `Type: ${params.type}\n` +
            `Content: ${params.content.slice(0, 150)}${params.content.length > 150 ? "..." : ""}` +
            `${params.task_id ? `\nTask: ${params.task_id} → ${params.task_status || "updated"}` : ""}` +
            `${params.to_agent ? `\nHandoff to: ${params.to_agent}` : ""}` +
            `${params.files_changed ? `\nFiles: ${params.files_changed.join(", ")}` : ""}\n\n` +
            `📝 Other agents will see this in their shared memory.`,
        }],
        details: {
          type: params.type,
          contextId: currentContextId,
        },
      };
    },
  });

  // ─── TOOL: memory_query — Search/query shared memory ──────────
  pi.registerTool({
    name: "memory_query",
    label: "Query Shared Memory",
    description:
      "Search the shared project memory for specific information. Find what a particular agent " +
      "has done, check for decisions about a specific topic, or look for files matching a pattern. " +
      "Use before starting work to avoid duplicating effort.",
    promptSnippet: "Search shared memory for specific information",
    promptGuidelines: [
      "Use this to find specific information in the shared memory without reading the entire file.",
      "Search by keyword to find relevant decisions, results, or blockers.",
      "Use agent=agent_name to find all entries by a specific agent.",
    ],
    parameters: Type.Object({
      keyword: Type.Optional(Type.String({
        description: "Search keyword to find in memory entries.",
      })),
      agent: Type.Optional(Type.String({
        description: "Filter to entries from a specific agent.",
      })),
      type: Type.Optional(Type.String({
        description: "Filter to entries of a specific type (task_result, decision, blocker, handoff, file_changed).",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentContextId) {
        currentContextId = resolveCtxId(ctx);
      }

      const mem = readMemory(currentContextId);
      const keyword = params.keyword?.toLowerCase() || "";
      const agentFilter = params.agent?.toLowerCase() || "";
      const typeFilter = params.type?.toLowerCase() || "";

      // Search across all sections
      const allEntries = [
        ...mem.activityLog,
        ...mem.decisions,
        ...mem.blockers,
        ...mem.handoffs,
      ];

      const results = allEntries.filter(e => {
        if (agentFilter && !e.agent.toLowerCase().includes(agentFilter)) return false;
        if (typeFilter && e.type !== typeFilter) return false;
        if (keyword && !e.content.toLowerCase().includes(keyword)) return false;
        return true;
      });

      // Also search task board
      const taskResults = Object.entries(mem.taskBoard).filter(([id, t]) => {
        if (keyword && !id.toLowerCase().includes(keyword) && !t.description.toLowerCase().includes(keyword)) return false;
        if (agentFilter && !t.agent.toLowerCase().includes(agentFilter)) return false;
        return true;
      });

      let response = `🔍 **Memory Query Results**\n\n`;

      if (results.length > 0) {
        response += `**${results.length} matching entries:**\n\n`;
        for (const e of results.slice(0, 20)) {
          const icon = e.type === "task_result" ? "✅" : e.type === "decision" ? "💡" : e.type === "blocker" ? "🚫" : e.type === "handoff" ? "🤝" : "📌";
          response += `${icon} [${e.agent}] ${e.type}: ${e.content.slice(0, 150)}\n`;
        }
      }

      if (taskResults.length > 0) {
        response += `\n**${taskResults.length} matching tasks:**\n\n`;
        for (const [id, t] of taskResults) {
          const icon = t.status === "completed" ? "✅" : t.status === "in_progress" ? "🔄" : "⏳";
          response += `${icon} [${id}] ${t.agent}: ${t.description.slice(0, 100)}\n`;
        }
      }

      if (results.length === 0 && taskResults.length === 0) {
        response += "No matching entries found.";
      }

      return { content: [{ type: "text", text: response }] };
    },
  });

  // ─── Hook: before_agent_start — Inject shared memory into system prompt ─
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!currentContextId) {
      currentContextId = _ctx.session?.id || _ctx.contextId || "";
    }

    if (currentContextId) {
      const memSnippet = memoryContextSnippet(currentContextId);
      if (memSnippet) {
        return {
          systemPrompt: event.systemPrompt + memSnippet,
        };
      }
    }

    return {};
  });

  // ─── Hook: session_start — Show memory status ─────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (!currentContextId) {
      currentContextId = ctx.session?.id || ctx.contextId || "";
    }

    if (currentContextId && memoryExists(currentContextId)) {
      const mem = readMemory(currentContextId);
      const activeTasks = Object.values(mem.taskBoard).filter(t => t.status === "in_progress").length;
      const blockers = mem.blockers.length;
      const note = blockers > 0 ? ` ⚠️ ${blockers} blockers!` : "";
      ctx.ui.notify(
        `🗂️ Shared Memory active: ${mem.project} — ${activeTasks} active tasks, ${mem.activityLog.length} entries${note}`,
        "info"
      );
      ctx.ui.setStatus("memory", `🗂️ ${mem.project}`);
    }
  });

  // ─── Hook: turn_end — Auto-update memory with activity ────────
  pi.on("turn_end", async (event, ctx) => {
    // Try to extract context ID from event
    if (!currentContextId && (ctx as any).contextId) {
      currentContextId = (ctx as any).contextId;
    }
  });

  // ─── Export internals for server-side use ────────────────────
  // These are accessible via the module's exports for the webui server

  return {
    // Expose core functions for external access
    memoryDir: MEMORY_DIR,
    readMemory,
    initMemory,
    writeMemoryFile,
    appendLog,
    updateTask,
    recordDecision,
    addFileChanged,
    addBlocker,
    resolveBlocker,
    createHandoff,
    updateOverview,
    updateStructure,
    memoryContextSnippet,
    listMemoryFiles,
    memoryExists,
  };
}