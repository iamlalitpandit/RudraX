import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Epic Wave Orchestration Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:epic-orchestration", {
    description: "Execute Epic Wave Orchestration workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Epic Wave Orchestration workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Epic Wave Orchestration

**Orchestrator:** TBD
**Version:** 1.0.0

Reusable template for executing epics with wave-based parallel development. Stories within each wave run the full development-cycle workflow (PO → Executor → Self-Healing → Quality Gate → DevOps → Checkpoint). Wave gates validate integration before proceeding to next wave. Supports worktree isolation for conflict-free parallel development.

This workflow is now ready to execute. Use *workflow epic-orchestration to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:epic-orchestration:info", {
    description: "Show Epic Wave Orchestration workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Epic Wave Orchestration

**ID:** epic-orchestration
**Orchestrator:** N/A
**Version:** 1.0.0

Reusable template for executing epics with wave-based parallel development. Stories within each wave run the full development-cycle workflow (PO → Executor → Self-Healing → Quality Gate → DevOps → Checkpoint). Wave gates validate integration before proceeding to next wave. Supports worktree isolation for conflict-free parallel development.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
