/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🧠 RUDRAX AGENCY ORCHESTRATOR — Autonomous Multi-Agent System
 * ═══════════════════════════════════════════════════════════════════════
 *
 * The brain of RudraX's autonomous stack. This extension transforms
 * RudraX from a single-agent coding tool into a multi-agent orchestration
 * platform that:
 *
 *   1. ANALYZES user prompts → decomposes into categorized atomic tasks
 *   2. PLANS execution order → dependency graph with parallel lanes
 *   3. DISPATCHES tasks → spawns specialized agents from The Agency roster
 *   4. MONITORS progress → tracks completion, handles failures, re-dispatches
 *   5. COORDINATES output → merges results, maintains context across agents
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────┐
 * │  User Prompt                                         │
 * │       ↓                                              │
 * │  ┌──────────────┐                                   │
 * │  │  ORCHESTRATOR │ ← before_agent_start intercept    │
 * │  │  (Planner)    │                                   │
 * │  └──┬─────┬─────┘                                   │
 * │     │     │     │                                    │
 * │  ┌──▼──┐┌▼───┐┌▼───┐  ← Parallel agent dispatch     │
 * │  │Agent││Agent││Agent│                               │
 * │  │  A  ││  B  ││  C  │  ← Each has specialized skill │
 * │  └──┬──┘└┬───┘└┬───┘                               │
 * │     │     │     │                                    │
 * │  ┌──▼─────▼─────▼──┐                                │
 * │  │  ORCHESTRATOR    │ ← Merge results, monitor       │
 * │  │  (Monitor)       │                                │
 * │  └─────────────────┘                                │
 * └─────────────────────────────────────────────────────┘
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TaskNode {
  id: string;
  description: string;
  category: string;
  agent: string;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: string;
  startedAt?: number;
  completedAt?: number;
}

interface ExecutionPlan {
  id: string;
  originalPrompt: string;
  tasks: TaskNode[];
  lanes: string[][];        // Parallel execution lanes (each lane = array of task IDs)
  currentLane: number;
  status: "planning" | "executing" | "monitoring" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
}

interface AgentSpawn {
  taskId: string;
  agentName: string;
  skillLoaded: boolean;
  startedAt: number;
  output?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY — Maps categories to available Agency agents
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_REGISTRY: Record<string, { primary: string; fallback: string[] }> = {
  // Engineering
  "frontend":     { primary: "engineering-frontend-developer", fallback: ["engineering-rapid-prototyper", "engineering-senior-developer"] },
  "backend":      { primary: "engineering-backend-architect", fallback: ["engineering-senior-developer", "engineering-software-architect"] },
  "api":          { primary: "engineering-backend-architect", fallback: ["engineering-senior-developer"] },
  "database":     { primary: "engineering-database-optimizer", fallback: ["engineering-backend-architect"] },
  "devops":       { primary: "engineering-devops-automator", fallback: ["engineering-sre"] },
  "infra":        { primary: "engineering-devops-automator", fallback: ["engineering-sre"] },
  "security":     { primary: "engineering-security-engineer", fallback: ["engineering-threat-detection-engineer"] },
  "mobile":       { primary: "engineering-mobile-app-builder", fallback: ["engineering-frontend-developer"] },
  "ai-ml":        { primary: "engineering-ai-engineer", fallback: ["engineering-backend-architect"] },
  "code-review":  { primary: "engineering-code-reviewer", fallback: ["engineering-senior-developer"] },
  "testing":      { primary: "testing-api-tester", fallback: ["testing-reality-checker", "testing-evidence-collector"] },
  "performance":  { primary: "testing-performance-benchmarker", fallback: ["testing-reality-checker"] },
  "accessibility": { primary: "testing-accessibility-auditor", fallback: ["design-ux-researcher"] },
  "git":          { primary: "engineering-git-workflow-master", fallback: ["engineering-senior-developer"] },
  "docs":         { primary: "engineering-technical-writer", fallback: ["engineering-senior-developer"] },
  "smart-contract": { primary: "engineering-solidity-smart-contract-engineer", fallback: ["blockchain-security-auditor"] },

  // Design
  "ux":           { primary: "design-ux-architect", fallback: ["design-ux-researcher"] },
  "ui":           { primary: "design-ui-designer", fallback: ["design-brand-guardian"] },
  "brand":        { primary: "design-brand-guardian", fallback: ["design-visual-storyteller"] },
  "visual":       { primary: "design-visual-storyteller", fallback: ["design-ui-designer"] },
  "research":     { primary: "design-ux-researcher", fallback: ["academic-psychologist"] },

  // Product & Strategy
  "product":      { primary: "product-manager", fallback: ["product-sprint-prioritizer"] },
  "sprint":       { primary: "product-sprint-prioritizer", fallback: ["project-management-project-shepherd"] },
  "roadmap":      { primary: "product-manager", fallback: ["product-feedback-synthesizer"] },

  // Marketing
  "growth":       { primary: "marketing-growth-hacker", fallback: ["marketing-seo-specialist"] },
  "seo":          { primary: "marketing-seo-specialist", fallback: ["marketing-content-creator"] },
  "content":      { primary: "marketing-content-creator", fallback: ["marketing-social-media-strategist"] },
  "social":       { primary: "marketing-social-media-strategist", fallback: ["marketing-content-creator"] },
  "tiktok":       { primary: "marketing-tiktok-strategist", fallback: ["marketing-social-media-strategist"] },
  "linkedin":      { primary: "marketing-linkedin-content-creator", fallback: ["marketing-content-creator"] },

  // Sales
  "sales":        { primary: "sales-account-strategist", fallback: ["sales-deal-strategist"] },

  // Finance
  "finance":      { primary: "finance-financial-analyst", fallback: ["finance-bookkeeper-controller"] },
  "tax":          { primary: "finance-tax-strategist", fallback: ["finance-bookkeeper-controller"] },

  // Support
  "support":      { primary: "customer-service", fallback: ["customer-service"] },

  // Project Management
  "pm":           { primary: "project-management-project-shepherd", fallback: ["project-management-studio-producer"] },

  // Academic
  "academic":     { primary: "academic-psychologist", fallback: ["academic-historian"] },

  // Game Dev
  "game-dev":     { primary: "game-designer", fallback: ["level-designer"] },
  "unity":        { primary: "unity-architect", fallback: ["game-designer"] },
  "unreal":       { primary: "unreal-world-builder", fallback: ["game-designer"] },
  "godot":        { primary: "godot-gameplay-scripter", fallback: ["game-designer"] },

  // Spatial
  "spatial":      { primary: "visionos-spatial-engineer", fallback: ["xr-immersive-developer"] },
  "xr":           { primary: "xr-immersive-developer", fallback: ["xr-interface-architect"] },

  // Specialized
  "compliance":   { primary: "compliance-auditor", fallback: ["compliance-auditor"] },
  "legal":        { primary: "compliance-auditor", fallback: ["compliance-auditor"] },
  "blockchain":   { primary: "blockchain-security-auditor", fallback: ["engineering-solidity-smart-contract-engineer"] },
  "mcp":          { primary: "specialized-mcp-builder", fallback: ["engineering-backend-architect"] },

  // NEXUS orchestrator for complex multi-domain
  "orchestration": { primary: "deputy-chief-of-staff", fallback: ["deputy-chief-of-staff"] },
};

// Category keywords for prompt analysis
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  frontend: ["frontend", "ui", "react", "vue", "angular", "css", "html", "component", "page", "layout", "responsive", "website", "web app", "interface", "tailwind", "button", "form", "modal", "dashboard"],
  backend:  ["backend", "api", "server", "endpoint", "route", "rest", "graphql", "microservice", "controller", "middleware", "auth", "authentication", "authorization"],
  database: ["database", "db", "sql", "migration", "schema", "query", "postgres", "mysql", "mongodb", "table", "index", "orm"],
  devops:   ["deploy", "ci/cd", "docker", "kubernetes", "k8s", "pipeline", "infrastructure", "terraform", "cloud", "aws", "gcp", "azure", "monitoring"],
  security: ["security", "vulnerability", "auth", "encryption", "csrf", "xss", "sql injection", "pentest", "audit", "compliance", "gdpr"],
  testing:  ["test", "testing", "unit test", "integration test", "e2e", "qa", "quality", "coverage", "jest", "cypress", "playwright"],
  design:   ["design", "ux", "ui", "wireframe", "mockup", "prototype", "figma", "user experience", "usability", "accessibility", "color scheme", "typography"],
  product:  ["product", "roadmap", "feature", "requirement", "spec", "priority", "backlog", "sprint", "user story", "mvp"],
  content:  ["content", "blog", "article", "copy", "writing", "documentation", "readme", "guide", "tutorial"],
  marketing: ["marketing", "seo", "growth", "campaign", "analytics", "conversion", "landing page", "a/b test", "funnel"],
  sales:    ["sales", "deal", "proposal", "pitch", "demo", "crm", "lead", "outreach"],
  finance:  ["finance", "budget", "financial", "revenue", "cost", "roi", "investment", "tax", "accounting"],
  mobile:   ["mobile", "ios", "android", "app", "react native", "flutter", "swift", "kotlin"],
  ai_ml:    ["ai", "ml", "machine learning", "model", "neural", "training", "inference", "llm", "chatbot", "embedding", "rag"],
  docs:     ["docs", "documentation", "readme", "api docs", "swagger", "openapi", "guide", "tutorial"],
  infra:    ["infra", "infrastructure", "server", "hosting", "ssl", "certificate", "dns", "load balancer"],
};

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR STATE (per-session)
// ═══════════════════════════════════════════════════════════════════════════

let orchestratorActive = false;
let currentPlan: ExecutionPlan | null = null;
let activeSpawns: Map<string, AgentSpawn> = new Map();
let completedTasks: Map<string, TaskNode> = new Map();
let planHistory: ExecutionPlan[] = [];
let agentMode: "auto" | "manual" = "auto";  // auto = orchestrator plans, manual = user picks agents

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function categorizePrompt(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const categories: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      categories.push(category);
    }
  }

  // If no specific category found, classify as general engineering
  if (categories.length === 0) {
    categories.push("frontend"); // Default to frontend for code tasks
  }

  return categories;
}

function resolveAgent(category: string): string {
  const normalized = category.replace(/[_\s]/g, "-").toLowerCase();
  const entry = AGENT_REGISTRY[normalized] || AGENT_REGISTRY[category];
  if (entry) {
    return entry.primary;
  }
  // Try fuzzy match
  for (const [key, val] of Object.entries(AGENT_REGISTRY)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return val.primary;
    }
  }
  return "engineering-senior-developer"; // Universal fallback
}

function generatePlanId(): string {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateTaskId(planId: string, index: number): string {
  return `${planId}-task-${index}`;
}

function dependencyOrder(tasks: TaskNode[]): string[][] {
  // Build dependency graph and compute parallel lanes
  // Lane 0: tasks with no dependencies
  // Lane N: tasks whose dependencies are all in lanes 0..N-1
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const assigned = new Set<string>();
  const lanes: string[][] = [];
  const remaining = new Set(tasks.map(t => t.id));
  let safety = 0;

  while (remaining.size > 0 && safety < 100) {
    safety++;
    const lane: string[] = [];

    for (const taskId of remaining) {
      const task = taskMap.get(taskId)!;
      const allDepsMet = task.dependencies.every(dep => assigned.has(dep) || !taskMap.has(dep));
      if (allDepsMet) {
        lane.push(taskId);
      }
    }

    if (lane.length === 0) {
      // Circular dep or orphan — force remaining into last lane
      for (const taskId of remaining) {
        lane.push(taskId);
      }
    }

    for (const taskId of lane) {
      assigned.add(taskId);
      remaining.delete(taskId);
    }

    lanes.push(lane);
  }

  return lanes;
}

function formatPlan(plan: ExecutionPlan): string {
  let output = `🧠 **Execution Plan: ${plan.id}**\n`;
  output += `   Prompt: "${plan.originalPrompt.slice(0, 80)}${plan.originalPrompt.length > 80 ? "..." : ""}"\n`;
  output += `   Status: ${plan.status}\n\n`;

  for (let i = 0; i < plan.lanes.length; i++) {
    const laneTasks = plan.lanes[i];
    const isCurrent = i === plan.currentLane;
    output += `${isCurrent ? "▶️" : (i < plan.currentLane ? "✅" : "⏳")} **Lane ${i + 1}** (parallel):\n`;

    for (const taskId of laneTasks) {
      const task = plan.tasks.find(t => t.id === taskId)!;
      const icon = task.status === "completed" ? "✅" :
                    task.status === "running" ? "🔄" :
                    task.status === "failed" ? "❌" :
                    task.status === "skipped" ? "⏭️" : "⏳";
      output += `  ${icon} ${task.id}: [${task.category}] ${task.description.slice(0, 60)} → ${task.agent}\n`;
    }
    output += "\n";
  }

  const completed = plan.tasks.filter(t => t.status === "completed").length;
  const total = plan.tasks.length;
  output += `📊 Progress: ${completed}/${total} tasks (${Math.round(completed / total * 100)}%)\n`;

  return output;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {

  // ─── /orchestrate command — Manual orchestration trigger ────────
  pi.registerCommand("orchestrate", {
    description: "Agency Orchestrator: analyze, plan, dispatch tasks to specialized agents. Usage: /orchestrate <prompt> or /orchestrate status|plan|stop|auto|manual",
    getArgumentCompletions(prefix: string) {
      const subcommands = ["status", "plan", "stop", "auto", "manual", "reset"];
      if (!prefix) return subcommands.map(s => ({ value: s, label: s }));

      const parts = prefix.split(/\s+/);
      if (subcommands.includes(parts[0])) {
        return [{ value: parts[0], label: parts[0] }];
      }

      return subcommands
        .filter(s => s.startsWith(parts[0]))
        .map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0];

      if (sub === "status") {
        if (!currentPlan) {
          ctx.ui.notify("🧠 No active plan. Use /orchestrate <your prompt> to start.", "info");
        } else {
          ctx.ui.notify(formatPlan(currentPlan), "info");
        }
        return;
      }

      if (sub === "plan") {
        // Show current plan details
        if (!currentPlan) {
          ctx.ui.notify("🧠 No active plan.", "info");
        } else {
          ctx.ui.notify(formatPlan(currentPlan), "info");
        }
        return;
      }

      if (sub === "stop") {
        if (currentPlan) {
          currentPlan.status = "failed";
          planHistory.push(currentPlan);
          currentPlan = null;
          activeSpawns.clear();
          ctx.ui.notify("🛑 Orchestrator stopped. Current plan archived.", "info");
        } else {
          ctx.ui.notify("🧠 No active plan to stop.", "info");
        }
        return;
      }

      if (sub === "auto") {
        agentMode = "auto";
        ctx.ui.notify("🧠 Orchestrator mode: AUTO (plans and dispatches automatically)", "info");
        return;
      }

      if (sub === "manual") {
        agentMode = "manual";
        ctx.ui.notify("🧠 Orchestrator mode: MANUAL (you pick agents, orchestrator plans)", "info");
        return;
      }

      if (sub === "reset") {
        if (currentPlan) {
          planHistory.push(currentPlan);
        }
        currentPlan = null;
        activeSpawns.clear();
        completedTasks.clear();
        orchestratorActive = false;
        ctx.ui.notify("🧠 Orchestrator reset.", "info");
        return;
      }

      // Treat the entire args as a prompt to orchestrate
      if (!args.trim()) {
        ctx.ui.notify("Usage: /orchestrate <prompt>  or  /orchestrate status|plan|stop|auto|manual|reset", "error");
        return;
      }

      // Submit the prompt for orchestration
      pi.sendUserMessage(args.trim(), { deliverAs: "steer" });
    },
  });

  // ─── /dispatch command — Quick agent dispatch ──────────────────
  pi.registerCommand("dispatch", {
    description: "Dispatch a task directly to a specific agent. Usage: /dispatch <agent-name> <task>",
    getArgumentCompletions(prefix: string) {
      const agents = Object.values(AGENT_REGISTRY).map(r => r.primary);
      if (!prefix) return agents.slice(0, 20).map(a => ({ value: a, label: a }));

      const parts = prefix.split(/\s+/);
      const matches = agents.filter(a => a.startsWith(parts[0]));
      return (matches.length > 0 ? matches : agents.slice(0, 20)).map(a => ({ value: a, label: a }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      if (parts.length < 2) {
        ctx.ui.notify("Usage: /dispatch <agent-name> <task description>", "error");
        return;
      }

      const agentName = parts[0];
      const taskDesc = parts.slice(1).join(" ");

      ctx.ui.notify(`🚀 Dispatching to ${agentName}: ${taskDesc}`, "info");
      pi.sendUserMessage(`/skill:${agentName}\n\nTask: ${taskDesc}`, { deliverAs: "steer" });
    },
  });

  // ─── TOOL: agency_analyze — Prompt decomposition for LLM ──────
  pi.registerTool({
    name: "agency_analyze",
    label: "Analyze & Decompose Prompt",
    description:
      "Analyze a user prompt and break it into categorized atomic tasks with execution dependencies. " +
      "Returns a structured plan with task IDs, categories, recommended agents, and parallel execution lanes. " +
      "Use this FIRST before dispatching any tasks. Always call agency_analyze before agency_dispatch.",
    promptSnippet: "Analyze and decompose a complex prompt into atomic tasks",
    promptGuidelines: [
      "For complex multi-domain prompts, ALWAYS call agency_analyze first to create a plan.",
      "Then call agency_dispatch for each task in lane order (parallel tasks in the same lane can be dispatched together).",
      "After all tasks complete, call agency_report to get the final summary.",
      "Simple single-domain prompts don't need analysis — just handle them directly.",
    ],
    parameters: Type.Object({
      prompt: Type.String({
        description: "The user prompt to analyze and decompose into tasks.",
      }),
      max_tasks: Type.Optional(Type.Number({
        description: "Maximum number of tasks to decompose into (default: 8)",
        default: 8,
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const prompt = params.prompt;
      const maxTasks = params.max_tasks || 8;

      // Categorize the prompt
      const categories = categorizePrompt(prompt);

      // Create execution plan
      const planId = generatePlanId();
      const tasks: TaskNode[] = [];
      const now = Date.now();

      // Decompose based on categories found
      // This is a heuristic decomposition — the LLM will refine via agency_dispatch
      if (categories.length === 1) {
        // Single category — may still need sub-tasks
        const cat = categories[0];
        tasks.push({
          id: generateTaskId(planId, 0),
          description: prompt,
          category: cat,
          agent: resolveAgent(cat),
          dependencies: [],
          status: "pending",
        });
      } else {
        // Multi-category — create tasks for each category
        categories.slice(0, maxTasks).forEach((cat, i) => {
          tasks.push({
            id: generateTaskId(planId, i),
            description: `Handle ${cat} aspects of: ${prompt}`,
            category: cat,
            agent: resolveAgent(cat),
            dependencies: i > 0 ? [generateTaskId(planId, 0)] : [], // First task has no deps, rest depend on it
            status: "pending",
          });
        });
      }

      // Always add an integration/review task
      if (tasks.length > 1) {
        tasks.push({
          id: generateTaskId(planId, tasks.length),
          description: `Review and integrate all outputs into a cohesive result`,
          category: "product",
          agent: "product-manager",
          dependencies: tasks.slice(0, -0).map(t => t.id),
          status: "pending",
        });
      }

      // Compute parallel lanes
      const lanes = dependencyOrder(tasks);

      // Build the plan
      const plan: ExecutionPlan = {
        id: planId,
        originalPrompt: prompt,
        tasks,
        lanes,
        currentLane: 0,
        status: "planning",
        createdAt: now,
      };

      currentPlan = plan;
      orchestratorActive = true;

      return {
        content: [
          {
            type: "text",
            text: `🧠 **Prompt Analysis Complete**

**Original Prompt:** "${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}"

**Categories Detected:** ${categories.join(", ")}

**Execution Plan:** ${planId}
${lanes.map((lane, i) => {
  const laneTasks = lane.map(tid => tasks.find(t => t.id === tid)!);
  return `\n**Lane ${i + 1}** (parallel):\n${laneTasks.map(t => `- [${t.category}] → ${t.agent}: ${t.description.slice(0, 60)}`).join("\n")}`;
}).join("")}

**Next Steps:** Call agency_dispatch for each task in Lane 1. Tasks in the same lane can be dispatched in parallel.`,
          },
        ],
        details: {
          planId,
          tasks: tasks.map(t => ({
            id: t.id,
            category: t.category,
            agent: t.agent,
            description: t.description,
            dependencies: t.dependencies,
          })),
          lanes,
          categories,
        },
      };
    },
  });

  // ─── TOOL: agency_dispatch — Dispatch task to specialized agent ─
  pi.registerTool({
    name: "agency_dispatch",
    label: "Dispatch Task to Agent",
    description:
      "Dispatch a specific task to a specialized Agency agent. The agent will be activated with its " +
      "personality and skill loaded. Use after agency_analyze to get task IDs, or call directly " +
      "with a task description. Multiple dispatches can run in parallel for independent tasks.",
    promptSnippet: "Dispatch a task to a specialized Agency agent",
    promptGuidelines: [
      "Dispatch tasks in lane order — complete all tasks in Lane N before starting Lane N+1.",
      "Tasks within the same lane have no dependencies on each other and can be dispatched in parallel.",
      "After dispatching, wait for results before dispatching dependent tasks.",
      "Use agency_task_complete to mark tasks as done and collect their output.",
    ],
    parameters: Type.Object({
      task_id: Type.Optional(Type.String({
        description: "Task ID from agency_analyze (e.g., 'plan-abc123-task-0')",
      })),
      task_description: Type.String({
        description: "Clear description of the task to accomplish.",
      }),
      agent: Type.String({
        description: "Agent name to dispatch to (e.g., 'engineering-frontend-developer'). Use category name for auto-resolution.",
      }),
      context: Type.Optional(Type.String({
        description: "Additional context from previous task results to pass to this agent.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const taskId = params.task_id || generatePlanId() + "-manual-0";
      const taskDesc = params.task_description;
      let agentName = params.agent;

      // Resolve agent name if it's a category
      if (AGENT_REGISTRY[agentName]) {
        agentName = AGENT_REGISTRY[agentName].primary;
      } else if (!agentName.includes("-")) {
        // Try as category
        agentName = resolveAgent(agentName);
      }

      // Update plan if task exists
      if (currentPlan) {
        const task = currentPlan.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = "running";
          task.startedAt = Date.now();
        }
        if (currentPlan.status === "planning") {
          currentPlan.status = "executing";
        }
      }

      // Track the spawn
      const spawn: AgentSpawn = {
        taskId,
        agentName,
        skillLoaded: false,
        startedAt: Date.now(),
      };
      activeSpawns.set(taskId, spawn);

      // Build the dispatch message with context
      let dispatchMsg = `/skill:${agentName}\n\n🎯 **Task Assignment**\n\n${taskDesc}`;

      if (params.context) {
        dispatchMsg += `\n\n📋 **Context from Previous Work:**\n${params.context}`;
      }

      dispatchMsg += `\n\n---\n*When complete, use agency_task_complete to report results.*`;

      // Inject personality into system prompt for this agent
      // This is done via before_agent_start hook — we set the active dispatch agent

      // Send the dispatch as a steering message
      pi.sendUserMessage(dispatchMsg, { deliverAs: "steer" });

      // Update UI
      ctx.ui.notify(`🚀 Dispatched task ${taskId} to ${agentName}`, "info");
      if (currentPlan) {
        ctx.ui.setStatus("orchestrator", `🔄 Task ${taskId} → ${agentName}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `🚀 **Task Dispatched**

- **Task ID:** ${taskId}
- **Agent:** ${agentName}
- **Description:** ${taskDesc.slice(0, 100)}

The agent has been activated with its specialized personality. When the agent completes the task, use agency_task_complete to mark it done and capture the output.

${currentPlan ? formatPlan(currentPlan) : ""}`,
          },
        ],
        details: {
          taskId,
          agent: agentName,
          dispatched: true,
        },
      };
    },
  });

  // ─── TOOL: agency_task_complete — Mark task done ──────────────
  pi.registerTool({
    name: "agency_task_complete",
    label: "Mark Task Complete",
    description:
      "Mark a dispatched task as complete with output results. This is called by the orchestrator " +
      "when a task finishes. It updates the execution plan and checks if dependent tasks can now start.",
    promptSnippet: "Mark an agent task as complete",
    promptGuidelines: [
      "Always call this when a dispatched agent finishes their task.",
      "Include the key output/result summary so downstream tasks can use it as context.",
      "After marking complete, check agency_task_status for remaining tasks.",
    ],
    parameters: Type.Object({
      task_id: Type.String({
        description: "Task ID that was dispatched.",
      }),
      result: Type.String({
        description: "Summary of the task's output — what was accomplished, key artifacts produced.",
      }),
      artifacts: Type.Optional(Type.Array(Type.String(), {
        description: "List of file paths or URLs created by the agent.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const taskId = params.task_id;

      // Update plan
      if (currentPlan) {
        const task = currentPlan.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = "completed";
          task.result = params.result;
          task.completedAt = Date.now();
        }

        // Move to active spawns → completed
        const spawn = activeSpawns.get(taskId);
        if (spawn) {
          spawn.output = params.result;
          activeSpawns.delete(taskId);
          completedTasks.set(taskId, task!);
        }

        // Check if current lane is complete
        const currentLaneTasks = currentPlan.lanes[currentPlan.currentLane] || [];
        const allLaneComplete = currentLaneTasks.every(tid => {
          const t = currentPlan.tasks.find(x => x.id === tid);
          return t && (t.status === "completed" || t.status === "failed" || t.status === "skipped");
        });

        if (allLaneComplete && currentPlan.currentLane < currentPlan.lanes.length - 1) {
          currentPlan.currentLane++;
          ctx.ui.notify(`✅ Lane ${currentPlan.currentLane} complete! Moving to Lane ${currentPlan.currentLane + 1}`, "info");
        }

        // Check if entire plan is complete
        const allComplete = currentPlan.tasks.every(
          t => t.status === "completed" || t.status === "failed" || t.status === "skipped"
        );
        if (allComplete) {
          currentPlan.status = "completed";
          currentPlan.completedAt = Date.now();
          planHistory.push(currentPlan);
          ctx.ui.notify("🎉 All tasks complete! Execution plan finished.", "info");
          ctx.ui.setStatus("orchestrator", undefined);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ **Task Completed**

- **Task ID:** ${taskId}
- **Result:** ${params.result.slice(0, 200)}
${params.artifacts ? `- **Artifacts:** ${params.artifacts.join(", ")}` : ""}

${currentPlan ? formatPlan(currentPlan) : ""}`,
          },
        ],
        details: {
          taskId,
          status: "completed",
          planStatus: currentPlan?.status,
        },
      };
    },
  });

  // ─── TOOL: agency_task_status — Check progress ────────────────
  pi.registerTool({
    name: "agency_task_status",
    label: "Check Task/Plan Status",
    description:
      "Check the status of the current execution plan, specific tasks, or all dispatched agents. " +
      "Use to monitor progress before dispatching next tasks.",
    promptSnippet: "Check status of the execution plan and tasks",
    parameters: Type.Object({
      task_id: Type.Optional(Type.String({
        description: "Specific task ID to check. Omit for full plan status.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentPlan) {
        return {
          content: [{ type: "text", text: "🧠 No active execution plan. Use agency_analyze to create one." }],
          details: { active: false },
        };
      }

      if (params.task_id) {
        const task = currentPlan.tasks.find(t => t.id === params.task_id);
        if (task) {
          const elapsed = task.completedAt && task.startedAt
            ? `${((task.completedAt - task.startedAt) / 1000).toFixed(1)}s`
            : task.startedAt
            ? `${((Date.now() - task.startedAt) / 1000).toFixed(1)}s elapsed`
            : "not started";
          return {
            content: [{
              type: "text",
              text: `${task.status === "completed" ? "✅" : task.status === "running" ? "🔄" : "⏳"} **Task ${task.id}**
- Status: ${task.status}
- Category: ${task.category}
- Agent: ${task.agent}
- Description: ${task.description}
- Time: ${elapsed}
- Result: ${task.result || "pending"}`,
            }],
            details: { task },
          };
        }
      }

      return {
        content: [{ type: "text", text: formatPlan(currentPlan) }],
        details: {
          planId: currentPlan.id,
          status: currentPlan.status,
          completedTasks: currentPlan.tasks.filter(t => t.status === "completed").length,
          totalTasks: currentPlan.tasks.length,
          currentLane: currentPlan.currentLane,
        },
      };
    },
  });

  // ─── TOOL: agency_report — Final summary ──────────────────────
  pi.registerTool({
    name: "agency_report",
    label: "Generate Final Report",
    description:
      "Generate a comprehensive summary of the execution plan — all task results, artifacts, " +
      "and time metrics. Call when all tasks are complete or when user asks for a summary.",
    promptSnippet: "Generate final execution report",
    parameters: Type.Object({
      plan_id: Type.Optional(Type.String({
        description: "Plan ID to report on. Defaults to current plan.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const plan = params.plan_id
        ? planHistory.find(p => p.id === params.plan_id) || currentPlan
        : currentPlan;

      if (!plan) {
        return {
          content: [{ type: "text", text: "🧠 No plan to report on." }],
          details: {},
        };
      }

      const completed = plan.tasks.filter(t => t.status === "completed");
      const failed = plan.tasks.filter(t => t.status === "failed");
      const totalDuration = plan.completedAt
        ? ((plan.completedAt - plan.createdAt) / 1000).toFixed(1)
        : "still running";

      let report = `📊 **Execution Report: ${plan.id}**\n\n`;
      report += `**Prompt:** "${plan.originalPrompt.slice(0, 100)}..."\n`;
      report += `**Status:** ${plan.status}\n`;
      report += `**Duration:** ${totalDuration}s\n`;
      report += `**Tasks Completed:** ${completed.length}/${plan.tasks.length}\n\n`;

      report += `### Task Results\n\n`;
      for (const task of plan.tasks) {
        const icon = task.status === "completed" ? "✅" : task.status === "failed" ? "❌" : "⏳";
        const time = task.completedAt && task.startedAt
          ? `${((task.completedAt - task.startedAt) / 1000).toFixed(1)}s`
          : "—";
        report += `${icon} **${task.category}** → ${task.agent} (${time})\n`;
        if (task.result) {
          report += `   Result: ${task.result.slice(0, 150)}${task.result.length > 150 ? "..." : ""}\n`;
        }
      }

      if (failed.length > 0) {
        report += `\n### ❌ Failed Tasks\n`;
        for (const task of failed) {
          report += `- ${task.id}: ${task.result || "unknown error"}\n`;
        }
      }

      report += `\n---\n*Report generated at ${new Date().toISOString()}*`;

      return {
        content: [{ type: "text", text: report }],
        details: {
          planId: plan.id,
          status: plan.status,
          completed: completed.length,
          failed: failed.length,
          total: plan.tasks.length,
        },
      };
    },
  });

  // ─── TOOL: agency_parallel_dispatch — Dispatch multiple tasks at once ─
  pi.registerTool({
    name: "agency_parallel_dispatch",
    label: "Parallel Dispatch (Multiple Agents)",
    description:
      "Dispatch multiple independent tasks to different agents simultaneously for parallel execution. " +
      "All tasks in the same lane are independent and can run concurrently. Use this for speed when " +
      "tasks have no dependencies on each other.",
    promptSnippet: "Dispatch multiple tasks to agents in parallel",
    promptGuidelines: [
      "Only use for tasks with NO dependencies on each other.",
      "Typically all tasks in the same lane are parallel-safe.",
      "Maximum 5 parallel tasks recommended to avoid context overload.",
    ],
    parameters: Type.Object({
      tasks: Type.Array(Type.Object({
        task_description: Type.String({ description: "Task description" }),
        agent: Type.String({ description: "Agent name or category" }),
        context: Type.Optional(Type.String({ description: "Additional context" })),
      }), { description: "Array of tasks to dispatch in parallel" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const dispatched: string[] = [];

      for (let i = 0; i < params.tasks.length && i < 5; i++) {
        const task = params.tasks[i];
        let agentName = task.agent;
        if (AGENT_REGISTRY[agentName]) {
          agentName = AGENT_REGISTRY[agentName].primary;
        }

        const taskId = generatePlanId() + "-parallel-" + i;

        // Track spawn
        activeSpawns.set(taskId, {
          taskId,
          agentName,
          skillLoaded: false,
          startedAt: Date.now(),
        });

        // Build dispatch message
        let dispatchMsg = `/skill:${agentName}\n\n🎯 **Task Assignment**\n\n${task.task_description}`;
        if (task.context) {
          dispatchMsg += `\n\n📋 **Context:** ${task.context}`;
        }

        // Update plan if exists
        if (currentPlan) {
          const planTask = currentPlan.tasks[i];
          if (planTask) {
            planTask.status = "running";
            planTask.startedAt = Date.now();
          }
        }

        // Dispatch as follow-up (queued, executed in order but conceptually parallel)
        pi.sendUserMessage(dispatchMsg, { deliverAs: i === 0 ? "steer" : "followUp" });
        dispatched.push(`${taskId} → ${agentName}`);
      }

      ctx.ui.notify(`🚀 Parallel dispatch: ${dispatched.length} agents activated`, "info");
      ctx.ui.setStatus("orchestrator", `🚀 ${dispatched.length} agents running in parallel`);

      return {
        content: [{
          type: "text",
          text: `🚀 **Parallel Dispatch Complete**

${dispatched.length} agents activated simultaneously:

${dispatched.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Each agent is now working on their assigned task. Use agency_task_complete to mark tasks done as they finish, and agency_task_status to check overall progress.`,
        }],
        details: { dispatchedCount: dispatched.length, dispatched },
      };
    },
  });

  // ─── before_agent_start — Inject orchestrator personality into system prompt ─
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!orchestratorActive && agentMode !== "auto") {
      return {};
    }

    let systemAddition = "";

    // If orchestrator is active, inject coordination context
    if (orchestratorActive && currentPlan) {
      const activeTasks = currentPlan.tasks.filter(t => t.status === "running");
      const completedResults = currentPlan.tasks
        .filter(t => t.status === "completed" && t.result)
        .map(t => `[${t.category}] ${t.result.slice(0, 200)}`)
        .join("\n");

      systemAddition = `

<agency-orchestrator>
🧠 **RudraX Agency Orchestrator Active**

Current Plan: ${currentPlan.id}
Status: ${currentPlan.status}
Lane: ${currentPlan.currentLane + 1}/${currentPlan.lanes.length}
Active Tasks: ${activeTasks.map(t => t.id).join(", ") || "none"}

${completedResults ? `Completed Results:\n${completedResults}` : ""}

**Your Role:** You are the 🔱 Chief of Staff. You receive missions from the user, forward them to the 🎛️ Deputy Chief of Staff for execution, and maintain situational awareness over all operations.
- When a task is dispatched to you, execute it with focus on your assigned domain.
- When you complete a task, summarize the key result concisely.
- Use agency_task_complete to report completion.
- Use agency_task_status to check what's next.
- For multi-domain tasks, use agency_analyze to break them down further.

Available Tools: agency_analyze, agency_dispatch, agency_task_complete, agency_task_status, agency_report, agency_parallel_dispatch
</agency-orchestrator>`;
    }

    // Always inject the orchestrator awareness (light weight) even when not actively running a plan
    if (!orchestratorActive) {
      systemAddition = `

<rudrax-chief-of-staff-awareness>
🧠 You have access to The Agency's 179 specialized agents via the agency tools.
- For complex multi-domain tasks, use agency_analyze to create a plan with parallel execution lanes.
- For single specialized tasks, use agency_dispatch to activate the right agent.
- You are the 🔱 Chief of Staff — receive user prompts, forward to the 🎛️ Deputy Chief of Staff, monitor execution, and deliver consolidated results.

Available Tools: agency_analyze, agency_dispatch, agency_task_complete, agency_task_status, agency_report, agency_parallel_dispatch
</rudrax-chief-of-staff-awareness>`;
    }

    return {
      systemPrompt: event.systemPrompt + systemAddition,
    };
  });

  // ─── session_start — Show orchestrator status ──────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (orchestratorActive && currentPlan) {
      const completed = currentPlan.tasks.filter(t => t.status === "completed").length;
      const total = currentPlan.tasks.length;
      ctx.ui.notify(
        `🧠 Agency Orchestrator: Plan ${currentPlan.id} active (${completed}/${total} tasks, Lane ${currentPlan.currentLane + 1})`,
        "info"
      );
      ctx.ui.setStatus("orchestrator", `🧠 ${completed}/${total} tasks`);
    } else {
      ctx.ui.setStatus("orchestrator", "🧠 Ready");
    }
  });

  // ─── turn_end — Auto-advance plan lanes ───────────────────────
  pi.on("turn_end", async (event, ctx) => {
    if (!currentPlan || currentPlan.status !== "executing") return;

    // Check if current lane tasks are all done
    const currentLaneIds = currentPlan.lanes[currentPlan.currentLane] || [];
    const allDone = currentLaneIds.every(tid => {
      const task = currentPlan.tasks.find(t => t.id === tid);
      return task && (task.status === "completed" || task.status === "failed" || task.status === "skipped");
    });

    if (allDone && currentPlan.currentLane < currentPlan.lanes.length - 1) {
      currentPlan.currentLane++;
      const nextLaneIds = currentPlan.lanes[currentPlan.currentLane];
      const nextTasks = nextLaneIds.map(tid => currentPlan.tasks.find(t => t.id === tid)!).filter(Boolean);

      ctx.ui.notify(
        `🧠 Lane ${currentPlan.currentLane + 1} starting: ${nextTasks.map(t => `${t.category}→${t.agent}`).join(", ")}`,
        "info"
      );
      ctx.ui.setStatus("orchestrator", `🧠 Lane ${currentPlan.currentLane + 1}/${currentPlan.lanes.length}`);
    }

    // Check if plan complete
    const planDone = currentPlan.tasks.every(
      t => t.status === "completed" || t.status === "failed" || t.status === "skipped"
    );
    if (planDone) {
      currentPlan.status = "completed";
      currentPlan.completedAt = Date.now();
      planHistory.push(currentPlan);
      ctx.ui.notify("🎉 Execution plan complete!", "info");
      ctx.ui.setStatus("orchestrator", "✅ Complete");
    }
  });
}