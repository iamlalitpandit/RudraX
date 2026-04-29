import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * QA Loop Orchestrator - Review Fix Re-review Cycle Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:qa-loop", {
    description: "Execute QA Loop Orchestrator - Review Fix Re-review Cycle workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting QA Loop Orchestrator - Review Fix Re-review Cycle workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ QA Loop Orchestrator - Review Fix Re-review Cycle

**Orchestrator:** TBD
**Version:** 1.0

Automated QA loop that orchestrates the review → fix → re-review cycle. Runs up to maxIterations (default 5), tracking each iteration's results. Escalates to human when max iterations reached or manual stop requested.
Part of Epic 6 - QA Evolution: Autonomous Development Engine (ADE).

This workflow is now ready to execute. Use *workflow qa-loop to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:qa-loop:info", {
    description: "Show QA Loop Orchestrator - Review Fix Re-review Cycle workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### QA Loop Orchestrator - Review Fix Re-review Cycle

**ID:** qa-loop
**Orchestrator:** N/A
**Version:** 1.0

Automated QA loop that orchestrates the review → fix → re-review cycle. Runs up to maxIterations (default 5), tracking each iteration's results. Escalates to human when max iterations reached or manual stop requested.
Part of Epic 6 - QA Evolution: Autonomous Development Engine (ADE).

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
