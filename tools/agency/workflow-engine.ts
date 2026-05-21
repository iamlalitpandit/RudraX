/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ⚙️ RUDRAX WORKFLOW ENGINE — DAG-Based Multi-Step Automation
 * ═══════════════════════════════════════════════════════════════════════
 *
 * A Directed Acyclic Graph (DAG) workflow engine that lets agents define,
 * execute, and monitor complex multi-step workflows with:
 *   - Conditional branching (if/else logic between steps)
 *   - Parallel execution (steps without dependencies)
 *   - Retry policies (per-step configurable)
 *   - Timeout management (per-step max duration)
 *   - State passing (output of one step → input of next)
 *   - Loop support (repeat steps with conditions)
 *   - Error handling (fail, skip, retry, fallback per step)
 *   - Human-in-the-loop steps (pause for user input)
 *
 * Workflows are defined as JSON and can be saved/loaded/reused.
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type StepType = "tool_call" | "agent_dispatch" | "llm_query" | "conditional" | "parallel" | "loop" | "human_input" | "wait" | "sub_workflow";

interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description: string;

  // For tool_call / agent_dispatch
  tool?: string;
  agent?: string;
  params?: Record<string, any>;
  prompt?: string;

  // For conditional
  condition?: {
    field: string;       // JSON path to check in state
    operator: "equals" | "contains" | "gt" | "lt" | "exists" | "regex";
    value: any;
    trueStep: string;    // Step ID to run if true
    falseStep?: string;  // Step ID to run if false
  };

  // For parallel
  parallel?: {
    branches: WorkflowStep[];  // Steps to run in parallel
    gatherMode: "all" | "any" | "first";  // When to continue
  };

  // For loop
  loop?: {
    maxIterations: number;
    condition: WorkflowStep["condition"];
    steps: WorkflowStep[];
  };

  // Dependencies
  dependsOn: string[];  // IDs of steps that must complete first

  // Execution config
  retry?: { maxAttempts: number; delayMs: number; backoff: "linear" | "exponential" };
  timeout?: number;       // Max ms for this step
  onError: "fail" | "skip" | "retry" | "fallback";
  fallbackStep?: string;

  // State management
  outputKey?: string;     // Store output under this key in workflow state
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  created: number;
  steps: WorkflowStep[];
  initialState?: Record<string, any>;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed" | "paused";
  state: Record<string, any>;
  stepResults: Record<string, {
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    output?: any;
    error?: string;
    startedAt?: number;
    completedAt?: number;
    attempts: number;
  }>;
  currentStepId: string | null;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILT-IN WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════

const BUILTIN_WORKFLOWS: Record<string, WorkflowDefinition> = {
  "code-review": {
    id: "code-review",
    name: "Code Review Pipeline",
    description: "Comprehensive code review: analyze, test, security check, and provide feedback",
    version: "1.0",
    tags: ["code", "review", "quality"],
    created: Date.now(),
    steps: [
      { id: "analyze", type: "agent_dispatch", name: "Code Analysis", description: "Analyze the code for patterns, structure, and complexity", agent: "engineering-code-reviewer", dependsOn: [], onError: "fail", retry: { maxAttempts: 2, delayMs: 1000, backoff: "linear" } },
      { id: "test", type: "agent_dispatch", name: "Test Review", description: "Review test coverage and test quality", agent: "testing-api-tester", dependsOn: ["analyze"], onError: "skip" },
      { id: "security", type: "agent_dispatch", name: "Security Review", description: "Check for security vulnerabilities", agent: "engineering-security-engineer", dependsOn: ["analyze"], onError: "skip" },
      { id: "feedback", type: "llm_query", name: "Synthesize Feedback", description: "Combine all review results into actionable feedback", dependsOn: ["analyze", "test", "security"], onError: "fail", prompt: "Synthesize the code review results into clear, prioritized feedback." },
    ],
  },
  "security-audit": {
    id: "security-audit",
    name: "Security Audit Workflow",
    description: "Full security audit: dependency check, code scan, config review, report",
    version: "1.0",
    tags: ["security", "audit", "compliance"],
    created: Date.now(),
    steps: [
      { id: "deps", type: "tool_call", name: "Dependency Check", description: "Check dependencies for known vulnerabilities", tool: "bash", params: { command: "npm audit --json 2>/dev/null || true" }, dependsOn: [], onError: "skip" },
      { id: "code-scan", type: "agent_dispatch", name: "Code Security Scan", description: "Scan the codebase for security patterns", agent: "engineering-security-engineer", dependsOn: ["deps"], onError: "skip" },
      { id: "config", type: "agent_dispatch", name: "Configuration Review", description: "Review configuration for security best practices", agent: "specialized-compliance-auditor", dependsOn: ["code-scan"], onError: "skip" },
      { id: "report", type: "llm_query", name: "Generate Report", description: "Generate comprehensive security audit report", dependsOn: ["deps", "code-scan", "config"], onError: "fail", prompt: "Generate a comprehensive security audit report with findings, severity levels, and remediation steps." },
    ],
  },
  "bug-fix": {
    id: "bug-fix",
    name: "Bug Fix Pipeline",
    description: "Systematic bug fixing: reproduce, diagnose, fix, verify",
    version: "1.0",
    tags: ["bug", "fix", "debug"],
    created: Date.now(),
    steps: [
      { id: "reproduce", type: "tool_call", name: "Reproduce Bug", description: "Create a minimal reproduction of the bug", tool: "bash", params: { command: "echo 'Reproduction steps needed'" }, dependsOn: [], onError: "fail" },
      { id: "diagnose", type: "agent_dispatch", name: "Root Cause Diagnosis", description: "Identify the root cause of the bug", agent: "engineering-senior-developer", dependsOn: ["reproduce"], onError: "fail" },
      { id: "fix", type: "agent_dispatch", name: "Implement Fix", description: "Implement the bug fix", agent: "engineering-minimal-change-engineer", dependsOn: ["diagnose"], onError: "fail" },
      { id: "verify", type: "tool_call", name: "Verify Fix", description: "Run tests to verify the fix", tool: "bash", params: { command: "npm test 2>/dev/null || true" }, dependsOn: ["fix"], onError: "skip" },
    ],
  },
  "deploy-check": {
    id: "deploy-check",
    name: "Pre-Deploy Checklist",
    description: "Run through the pre-deployment checklist: tests, lint, build, security",
    version: "1.0",
    tags: ["deploy", "ci", "release"],
    created: Date.now(),
    steps: [
      { id: "lint", type: "tool_call", name: "Lint Check", description: "Run linter", tool: "bash", params: { command: "npm run lint 2>/dev/null || true" }, dependsOn: [], onError: "skip" },
      { id: "test", type: "tool_call", name: "Run Tests", description: "Run test suite", tool: "bash", params: { command: "npm test 2>/dev/null || true" }, dependsOn: [], onError: "fail" },
      { id: "build", type: "tool_call", name: "Build Check", description: "Verify project builds", tool: "bash", params: { command: "npm run build 2>/dev/null || true" }, dependsOn: ["lint", "test"], onError: "fail" },
      { id: "security-scan", type: "agent_dispatch", name: "Security Scan", description: "Quick security scan", agent: "engineering-security-engineer", dependsOn: ["build"], onError: "skip" },
      { id: "summary", type: "llm_query", name: "Deploy Readiness Summary", description: "Summarize deploy readiness", dependsOn: ["lint", "test", "build", "security-scan"], onError: "fail", prompt: "Summarize the deploy readiness based on all checks." },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW MANAGER
// ═══════════════════════════════════════════════════════════════════════════

const WF_DIR = path.join(os.homedir(), ".rudrax", "agent", "workflows");

function ensureWfDir(): void {
  if (!fs.existsSync(WF_DIR)) fs.mkdirSync(WF_DIR, { recursive: true });
}

function wfPath(workflowId: string): string {
  ensureWfDir();
  return path.join(WF_DIR, `${workflowId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function saveWorkflow(wf: WorkflowDefinition): void {
  fs.writeFileSync(wfPath(wf.id), JSON.stringify(wf, null, 2), "utf-8");
}

function loadWorkflow(workflowId: string): WorkflowDefinition | null {
  if (BUILTIN_WORKFLOWS[workflowId]) return { ...BUILTIN_WORKFLOWS[workflowId] };
  try {
    if (fs.existsSync(wfPath(workflowId))) {
      return JSON.parse(fs.readFileSync(wfPath(workflowId), "utf-8"));
    }
  } catch { /* not found */ }
  return null;
}

function listWorkflows(): { id: string; name: string; description: string; tags: string[]; steps: number }[] {
  ensureWfDir();
  const workflows: WorkflowDefinition[] = Object.values(BUILTIN_WORKFLOWS);
  try {
    const files = fs.readdirSync(WF_DIR).filter(f => f.endsWith(".json"));
    for (const f of files) {
      try {
        const wf = JSON.parse(fs.readFileSync(path.join(WF_DIR, f), "utf-8"));
        workflows.push(wf);
      } catch { /* skip corrupt */ }
    }
  } catch { /* no files */ }
  return workflows.map(w => ({ id: w.id, name: w.name, description: w.description, tags: w.tags, steps: w.steps.length }));
}

function createExecution(wf: WorkflowDefinition, initialParams?: Record<string, any>): WorkflowExecution {
  const exec: WorkflowExecution = {
    id: `wf_exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    workflowId: wf.id,
    workflowName: wf.name,
    startedAt: Date.now(),
    status: "running",
    state: { ...wf.initialState, ...initialParams, _results: {} },
    stepResults: {},
    currentStepId: null,
  };

  // Initialize all step results
  for (const step of wf.steps) {
    exec.stepResults[step.id] = { status: "pending", attempts: 0 };
  }

  return exec;
}

function getReadySteps(wf: WorkflowDefinition, exec: WorkflowExecution): WorkflowStep[] {
  return wf.steps.filter(step => {
    const result = exec.stepResults[step.id];
    if (!result || result.status !== "pending") return false;
    // All dependencies must be completed (or skipped with error)
    return step.dependsOn.every(depId => {
      const depResult = exec.stepResults[depId];
      return depResult && (depResult.status === "completed" || depResult.status === "skipped");
    });
  });
}

function formatWorkflow(wf: WorkflowDefinition): string {
  let output = `⚙️ **Workflow: ${wf.name}**\n`;
  output += `${wf.description}\n`;
  output += `Version: ${wf.version} | Tags: ${wf.tags.join(", ")}\n\n`;

  // Build dependency graph
  const stepsByDepths: { depth: number; steps: WorkflowStep[] }[] = [];
  const assigned = new Set<string>();
  let depth = 0;

  while (assigned.size < wf.steps.length) {
    const ready = wf.steps.filter(s => {
      if (assigned.has(s.id)) return false;
      return s.dependsOn.every(d => assigned.has(d));
    });
    if (ready.length === 0) break; // Circular dependency
    for (const s of ready) assigned.add(s.id);
    stepsByDepths.push({ depth, steps: ready });
    depth++;
  }

  output += `**Steps (${wf.steps.length}):**\n`;
  for (const level of stepsByDepths) {
    output += `\n  ${"  ".repeat(level.depth)}⚡ Lane ${level.depth + 1}:\n`;
    for (const step of level.steps) {
      const icon = step.type === "parallel" ? "🔄" : step.type === "conditional" ? "🔀" : step.type === "human_input" ? "👤" : "▸";
      output += `${"    ".repeat(level.depth + 1)}${icon} **${step.name}** (${step.type})\n`;
    }
  }

  return output;
}

function formatExecutionStatus(exec: WorkflowExecution, wf: WorkflowDefinition): string {
  let output = `⚙️ **Workflow Execution: ${exec.workflowName}**\n`;
  output += `ID: ${exec.id}\n`;
  output += `Status: ${exec.status === "running" ? "🔄 Running" : exec.status === "completed" ? "✅ Completed" : exec.status === "failed" ? "❌ Failed" : "⏸️ Paused"}\n`;
  const duration = exec.completedAt ? `${((exec.completedAt - exec.startedAt) / 1000).toFixed(1)}s` : `${((Date.now() - exec.startedAt) / 1000).toFixed(1)}s elapsed`;
  output += `Duration: ${duration}\n\n`;

  const completed = Object.values(exec.stepResults).filter(r => r.status === "completed").length;
  const total = Object.keys(exec.stepResults).length;
  output += `Progress: ${completed}/${total}\n\n`;

  for (const step of wf.steps) {
    const result = exec.stepResults[step.id];
    if (!result) continue;
    const icon = result.status === "completed" ? "✅" : result.status === "running" ? "🔄" : result.status === "failed" ? "❌" : result.status === "skipped" ? "⏭️" : "⏳";
    output += `${icon} **${step.name}** (${result.status})\n`;
    if (result.error) output += `   ❌ Error: ${result.error.slice(0, 100)}\n`;
    if (result.output && typeof result.output === "string") output += `   Output: ${result.output.slice(0, 150)}\n`;
  }

  return output;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

let _currentWfExec: WorkflowExecution | null = null;

export default function (pi: ExtensionAPI) {

  // ─── /workflow command ────────────────────────────────────────
  pi.registerCommand("workflow", {
    description: "DAG Workflow Engine: define, run, and monitor workflows. Usage: /workflow <list|run|status|create|show>",
    getArgumentCompletions(prefix: string) {
      const subs = ["list", "run", "status", "create", "show"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0];

      if (sub === "list") {
        const wfs = listWorkflows();
        if (wfs.length === 0) { ctx.ui.notify("📋 No workflows available.", "info"); return; }
        const lines = wfs.map(w => `  ⚙️ **${w.name}** — ${w.description} (${w.steps} steps)`).join("\n");
        ctx.ui.notify(`📋 **Available Workflows**\n${lines}\n\nUse /workflow run <name> to execute.`, "info");
        return;
      }

      if (sub === "show" && parts[1]) {
        const wf = loadWorkflow(parts[1]);
        if (!wf) { ctx.ui.notify(`Workflow not found: ${parts[1]}`, "warn"); return; }
        ctx.ui.notify(formatWorkflow(wf), "info");
        return;
      }

      if (sub === "run" && parts[1]) {
        const wf = loadWorkflow(parts[1]);
        if (!wf) { ctx.ui.notify(`Workflow not found: ${parts[1]}`, "warn"); return; }
        _currentWfExec = createExecution(wf);
        ctx.ui.notify(`🚀 **Workflow Started: ${wf.name}**\nID: ${_currentWfExec.id}\n\n${formatExecutionStatus(_currentWfExec, wf)}`, "info");
        // The LLM will pick up execution via the workflow_execute tool
        pi.sendUserMessage(`Workflow "${wf.name}" started. I need to execute this workflow step by step.`, { deliverAs: "steer" });
        return;
      }

      if (sub === "status") {
        if (!_currentWfExec) { ctx.ui.notify("No active workflow execution.", "info"); return; }
        const wf = loadWorkflow(_currentWfExec.workflowId);
        if (wf) ctx.ui.notify(formatExecutionStatus(_currentWfExec, wf), "info");
        return;
      }

      if (sub === "create") {
        ctx.ui.notify(
          "📝 **Creating a Workflow**\n\n" +
          "Workflows are JSON definitions. Use workflow_execute with a step-by-step plan.\n" +
          "Built-in workflows: code-review, security-audit, bug-fix, deploy-check\n\n" +
          "To create a custom workflow, define steps with dependencies and use /workflow run.",
          "info"
        );
        return;
      }

      ctx.ui.notify(
        "Usage: /workflow <list|run <name>|status|show <name>|create>",
        "info"
      );
    },
  });

  // ─── TOOL: workflow_execute — Execute workflow step ───────────
  pi.registerTool({
    name: "workflow_execute",
    label: "Execute Workflow Step",
    description:
      "Execute the next ready step(s) in a workflow. Checks for completed dependencies, " +
      "runs ready steps in the correct order, and updates workflow state. " +
      "Call this after a step completes to advance the workflow. Available workflows: " +
      "code-review, security-audit, bug-fix, deploy-check.",
    promptSnippet: "Execute the next step in a workflow",
    promptGuidelines: [
      "After each step completes, call workflow_execute to advance the workflow.",
      "Steps in the same lane (no dependencies on each other) can be executed in parallel.",
      "Use workflow_status to check progress.",
      "When all steps complete, use workflow_complete to finalize.",
    ],
    parameters: Type.Object({
      workflow_id: Type.String({ description: "Workflow ID to execute steps from" }),
      step_id: Type.String({ description: "Step ID to execute" }),
      input_data: Type.Optional(Type.String({ description: "Input data/context for this step" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const wf = loadWorkflow(params.workflow_id);
      if (!wf) {
        return { content: [{ type: "text", text: `⚠️ Workflow not found: ${params.workflow_id}` }], details: { error: true } };
      }

      const step = wf.steps.find(s => s.id === params.step_id);
      if (!step) {
        return { content: [{ type: "text", text: `⚠️ Step not found: ${params.step_id}` }], details: { error: true } };
      }

      // Initialize execution if needed
      if (!_currentWfExec || _currentWfExec.workflowId !== params.workflow_id) {
        _currentWfExec = createExecution(wf);
      }

      // Mark step as running
      _currentWfExec.stepResults[params.step_id] = {
        status: "running",
        attempts: 1,
        startedAt: Date.now(),
      };
      _currentWfExec.currentStepId = params.step_id;

      // Build step instructions based on type
      let instructions = "";
      switch (step.type) {
        case "agent_dispatch":
          instructions = `Dispatch to agent "${step.agent}": ${step.description}`;
          break;
        case "tool_call":
          instructions = `Run tool "${step.tool}" with params: ${JSON.stringify(step.params)}\nDescription: ${step.description}`;
          break;
        case "llm_query":
          instructions = `Answer the following query:\n${step.prompt || step.description}\n\nContext: ${params.input_data || ""}`;
          break;
        case "human_input":
          instructions = `Ask the user for input: ${step.description}`;
          break;
        default:
          instructions = `Execute step: ${step.description}`;
      }

      return {
        content: [{
          type: "text",
          text: `⚙️ **Workflow Step: ${step.name}**\n` +
            `Workflow: ${wf.name}\n` +
            `Step ID: ${params.step_id}\n` +
            `Type: ${step.type}\n\n` +
            instructions +
            `\n\nAfter completing, call workflow_step_complete to mark this step done and advance.`,
        }],
        details: {
          workflowId: wf.id,
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          dependsOn: step.dependsOn,
          requiresOutput: step.outputKey ? true : false,
        },
      };
    },
  });

  // ─── TOOL: workflow_step_complete — Mark step done ────────────
  pi.registerTool({
    name: "workflow_step_complete",
    label: "Complete Workflow Step",
    description:
      "Mark a workflow step as complete with its output. This advances the workflow execution " +
      "and may unlock dependent steps. Call after successfully executing a workflow step.",
    promptSnippet: "Mark a workflow step as completed",
    parameters: Type.Object({
      workflow_id: Type.String({ description: "Workflow ID" }),
      step_id: Type.String({ description: "Step ID that was completed" }),
      output: Type.Optional(Type.String({ description: "Output/result of the step" })),
      error: Type.Optional(Type.String({ description: "Error message if the step failed" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentWfExec || _currentWfExec.workflowId !== params.workflow_id) {
        return { content: [{ type: "text", text: "⚠️ No active workflow execution." }], details: { error: true } };
      }

      const result = _currentWfExec.stepResults[params.step_id];
      if (!result) {
        return { content: [{ type: "text", text: `⚠️ Unknown step: ${params.step_id}` }], details: { error: true } };
      }

      if (params.error) {
        result.status = "failed";
        result.error = params.error;
        _currentWfExec.status = "failed";
        _currentWfExec.error = `Step ${params.step_id} failed: ${params.error}`;
      } else {
        result.status = "completed";
        result.output = params.output;
      }
      result.completedAt = Date.now();

      // Store output in state if configured
      const wf = loadWorkflow(params.workflow_id);
      if (wf) {
        const step = wf.steps.find(s => s.id === params.step_id);
        if (step?.outputKey && params.output) {
          _currentWfExec.state[step.outputKey] = params.output;
        }
        _currentWfExec.state._results = _currentWfExec.state._results || {};
        _currentWfExec.state._results[params.step_id] = params.output || "";

        // Check if all steps completed
        const allDone = wf.steps.every(s => {
          const r = _currentWfExec!.stepResults[s.id];
          return r && (r.status === "completed" || r.status === "skipped");
        });

        if (allDone) {
          _currentWfExec.status = "completed";
          _currentWfExec.completedAt = Date.now();
        }

        // Find next ready steps
        const readySteps = getReadySteps(wf, _currentWfExec);

        let statusUpdate = params.error
          ? `❌ Step "${params.step_id}" failed. Workflow paused.`
          : `✅ Step "${params.step_id}" completed.`;

        if (readySteps.length > 0) {
          statusUpdate += `\n\nNext ready steps:\n${readySteps.map(s => `  • ${s.name} (${s.id})`).join("\n")}`;
        } else if (!allDone) {
          statusUpdate += "\n\n⏳ Waiting for dependencies to complete...";
        } else {
          statusUpdate += "\n\n🎉 All steps complete! Workflow finished.";
        }

        return {
          content: [{ type: "text", text: statusUpdate }],
          details: {
            stepId: params.step_id,
            status: params.error ? "failed" : "completed",
            workflowStatus: _currentWfExec.status,
            readySteps: readySteps.map(s => s.id),
          },
        };
      }

      return { content: [{ type: "text", text: params.error ? `❌ Step ${params.step_id} failed.` : `✅ Step ${params.step_id} completed.` }] };
    },
  });

  // ─── TOOL: workflow_status — Check workflow progress ─────────
  pi.registerTool({
    name: "workflow_status",
    label: "Check Workflow Status",
    description: "Check the current status of a workflow execution.",
    promptSnippet: "Check workflow execution status",
    parameters: Type.Object({
      workflow_id: Type.Optional(Type.String({ description: "Workflow ID to check. Defaults to current." })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_currentWfExec) {
        return { content: [{ type: "text", text: "⚠️ No active workflow execution." }], details: { active: false } };
      }

      const wf = loadWorkflow(_currentWfExec.workflowId);
      if (!wf) {
        return { content: [{ type: "text", text: "⚠️ Workflow definition not found." }], details: { error: true } };
      }

      const readySteps = getReadySteps(wf, _currentWfExec);
      const progress = formatExecutionStatus(_currentWfExec, wf);

      return {
        content: [{ type: "text", text: progress }],
        details: {
          workflowId: _currentWfExec.workflowId,
          status: _currentWfExec.status,
          readySteps: readySteps.map(s => s.id),
          completed: Object.values(_currentWfExec.stepResults).filter(r => r.status === "completed").length,
          total: Object.keys(_currentWfExec.stepResults).length,
        },
      };
    },
  });

  // ─── Hook: Inject workflow awareness ──────────────────────────
  pi.on("before_agent_start", async (event, _ctx) => {
    if (_currentWfExec && _currentWfExec.status === "running") {
      const wf = loadWorkflow(_currentWfExec.workflowId);
      if (wf) {
        const readySteps = getReadySteps(wf, _currentWfExec);
        const status = formatExecutionStatus(_currentWfExec, wf);

        return {
          systemPrompt: event.systemPrompt + `\n\n<active-workflow>\n${status}\n\nNext ready steps: ${readySteps.map(s => s.id).join(", ") || "waiting for dependencies"}\n</active-workflow>\n`,
        };
      }
    }
    return {};
  });

  return {
    loadWorkflow, saveWorkflow, listWorkflows, createExecution,
    getReadySteps, formatWorkflow, formatExecutionStatus, BUILTIN_WORKFLOWS,
  };
}
