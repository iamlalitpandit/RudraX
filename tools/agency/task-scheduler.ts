/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ⏰ RUDRAX TASK SCHEDULER — Cron-Based Recurring Tasks
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Schedule tasks to run periodically: code reviews, security scans,
 * health checks, backup operations, and recurring workflows.
 * Uses a simple interval-based scheduler (no system cron dependency).
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  type: "agent_dispatch" | "workflow" | "bash" | "llm_query";
  target: string;        // Agent name, workflow ID, bash command, or LLM prompt
  interval: number;       // ms between runs
  lastRun: number;
  nextRun: number;
  enabled: boolean;
  created: number;
  createdBy: string;
  runCount: number;
  tags: string[];
  maxRuns?: number;       // Null = unlimited
}

const SCHED_DIR = path.join(os.homedir(), ".rudrax", "agent", "scheduler");

function ensureDir(): void { if (!fs.existsSync(SCHED_DIR)) fs.mkdirSync(SCHED_DIR, { recursive: true }); }
function schedPath(): string { ensureDir(); return path.join(SCHED_DIR, "tasks.json"); }

function loadTasks(): ScheduledTask[] {
  const sp = schedPath();
  if (fs.existsSync(sp)) { try { return JSON.parse(fs.readFileSync(sp, "utf-8")); } catch {} }
  return [];
}

function saveTasks(tasks: ScheduledTask[]): void {
  fs.writeFileSync(schedPath(), JSON.stringify(tasks, null, 2), "utf-8");
}

export default function (pi: ExtensionAPI) {
  let tasks: ScheduledTask[] = loadTasks();
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  function startScheduler(): void {
    if (tickInterval) return;
    tickInterval = setInterval(() => {
      tasks = loadTasks();
      const now = Date.now();
      for (const task of tasks) {
        if (task.enabled && now >= task.nextRun) {
          task.lastRun = now;
          task.nextRun = now + task.interval;
          task.runCount++;
          saveTasks(tasks);

          // Execute the scheduled task
          if (task.type === "agent_dispatch") {
            pi.sendUserMessage(`/skill:${task.target}\n\n⏰ **Scheduled Task: ${task.name}**\n${task.description}`, { deliverAs: "steer" });
          } else if (task.type === "workflow") {
            pi.sendUserMessage(`/workflow run ${task.target}\n\n⏰ **Scheduled Workflow: ${task.name}**`, { deliverAs: "steer" });
          } else if (task.type === "bash") {
            pi.sendUserMessage(`Run scheduled command: ${task.target}\n\n⏰ **Scheduled Task: ${task.name}**`, { deliverAs: "steer" });
          }

          // Check max runs
          if (task.maxRuns && task.runCount >= task.maxRuns) {
            task.enabled = false;
            saveTasks(tasks);
          }
        }
      }
    }, 60000); // Check every minute
  }

  pi.registerCommand("schedule", {
    description: "Task Scheduler: recurring automated tasks. Usage: /schedule <list|add|remove|enable|disable|status>",
    getArgumentCompletions(prefix: string) {
      const subs = ["list", "add", "remove", "enable", "disable", "start", "stop", "status"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "list";

      if (sub === "status" || sub === "list") {
        tasks = loadTasks();
        if (tasks.length === 0) { ctx.ui.notify("⏰ No scheduled tasks.", "info"); return; }
        const lines = tasks.map(t => {
          const icon = t.enabled ? "🟢" : "🔴";
          const next = new Date(t.nextRun).toLocaleString();
          const interval = t.interval >= 86400000 ? `${t.interval / 86400000}d` : t.interval >= 3600000 ? `${t.interval / 3600000}h` : `${t.interval / 60000}m`;
          return `${icon} **${t.name}** — every ${interval} — next: ${next} — ran ${t.runCount}x`;
        }).join("\n");
        ctx.ui.notify(`⏰ **Scheduled Tasks** (${tasks.length})\n${lines}`, "info");
        return;
      }

      if (sub === "add" && parts.length >= 4) {
        const type = parts[1] as ScheduledTask["type"];
        const name = parts[2];
        const intervalMins = parseInt(parts[3]);
        const target = parts.slice(4).join(" ");
        if (isNaN(intervalMins) || intervalMins < 1) { ctx.ui.notify("⚠️ Interval must be minutes >= 1", "error"); return; }
        const task: ScheduledTask = {
          id: `sched_${Date.now().toString(36)}`, name, description: target.slice(0, 200),
          type: type || "agent_dispatch", target: target || name, interval: intervalMins * 60000,
          lastRun: 0, nextRun: Date.now() + intervalMins * 60000, enabled: true,
          created: Date.now(), createdBy: ctx.agent?.name || "user", runCount: 0, tags: [],
        };
        tasks.push(task);
        saveTasks(tasks);
        startScheduler();
        ctx.ui.notify(`⏰ Scheduled "${name}" every ${intervalMins} minutes. Next run: ${new Date(task.nextRun).toLocaleString()}`, "info");
        return;
      }

      if ((sub === "remove" || sub === "delete") && parts[1]) {
        tasks = loadTasks();
        const idx = tasks.findIndex(t => t.name === parts[1] || t.id === parts[1]);
        if (idx === -1) { ctx.ui.notify(`Task not found: ${parts[1]}`, "warn"); return; }
        tasks.splice(idx, 1);
        saveTasks(tasks);
        ctx.ui.notify(`🗑️ Removed scheduled task: ${parts[1]}`, "info");
        return;
      }

      if (sub === "enable" && parts[1]) {
        tasks = loadTasks();
        const task = tasks.find(t => t.name === parts[1] || t.id === parts[1]);
        if (!task) { ctx.ui.notify(`Task not found: ${parts[1]}`, "warn"); return; }
        task.enabled = true; saveTasks(tasks); startScheduler();
        ctx.ui.notify(`🟢 Enabled: ${task.name}`, "info");
        return;
      }

      if (sub === "disable" && parts[1]) {
        tasks = loadTasks();
        const task = tasks.find(t => t.name === parts[1] || t.id === parts[1]);
        if (!task) { ctx.ui.notify(`Task not found: ${parts[1]}`, "warn"); return; }
        task.enabled = false; saveTasks(tasks);
        ctx.ui.notify(`🔴 Disabled: ${task.name}`, "info");
        return;
      }

      if (sub === "start") { startScheduler(); ctx.ui.notify("⏰ Scheduler started", "info"); return; }
      if (sub === "stop") { if (tickInterval) { clearInterval(tickInterval); tickInterval = null; } ctx.ui.notify("⏰ Scheduler stopped", "info"); return; }

      ctx.ui.notify("Usage: /schedule <list|add <type> <name> <interval_min> <target>|remove|enable|disable|start|stop>", "info");
    },
  });

  pi.registerTool({
    name: "scheduler_add",
    label: "Schedule Recurring Task",
    description: "Schedule a task to run at a recurring interval. Supports agent dispatch, workflow execution, and bash commands.",
    promptSnippet: "Schedule a recurring task",
    parameters: Type.Object({
      name: Type.String({ description: "Task name" }),
      type: Type.Union([Type.Literal("agent_dispatch"), Type.Literal("workflow"), Type.Literal("bash")], { description: "Task type" }),
      target: Type.String({ description: "For agent_dispatch: agent name. For workflow: workflow ID. For bash: command." }),
      interval_minutes: Type.Number({ description: "Interval in minutes between runs" }),
      description: Type.Optional(Type.String({ description: "Description of what this task does" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      tasks = loadTasks();
      const task: ScheduledTask = {
        id: `sched_${Date.now().toString(36)}`, name: params.name,
        description: params.description || `Scheduled ${params.type}: ${params.target.slice(0, 100)}`,
        type: params.type, target: params.target,
        interval: params.interval_minutes * 60000, lastRun: 0,
        nextRun: Date.now() + params.interval_minutes * 60000, enabled: true,
        created: Date.now(), createdBy: ctx.agent?.name || "agent", runCount: 0, tags: [],
      };
      tasks.push(task);
      saveTasks(tasks);
      startScheduler();
      return { content: [{ type: "text", text: `⏰ Scheduled "${params.name}" every ${params.interval_minutes} min. Use scheduler_list to see all tasks.` }], details: { taskId: task.id, nextRun: task.nextRun } };
    },
  });

  pi.registerTool({
    name: "scheduler_list",
    label: "List Scheduled Tasks",
    description: "List all currently scheduled recurring tasks with their status and next run time.",
    promptSnippet: "List scheduled tasks",
    parameters: Type.Object({}),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      tasks = loadTasks();
      if (tasks.length === 0) return { content: [{ type: "text", text: "⏰ No scheduled tasks." }], details: { count: 0 } };
      const listing = tasks.map(t => `${t.enabled ? "🟢" : "🔴"} **${t.name}** — ${t.type} — every ${(t.interval / 60000).toFixed(0)}min — next: ${new Date(t.nextRun).toLocaleString()}`).join("\n");
      return { content: [{ type: "text", text: `⏰ **Scheduled Tasks**\n${listing}` }], details: { count: tasks.length } };
    },
  });

  // Auto-start scheduler on session start if tasks exist
  setTimeout(() => {
    tasks = loadTasks();
    if (tasks.some(t => t.enabled)) startScheduler();
  }, 5000);

  return { loadTasks, saveTasks };
}
