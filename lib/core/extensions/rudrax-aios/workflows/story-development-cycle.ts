import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Story Development Cycle Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:story-development-cycle", {
    description: "Execute Story Development Cycle workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Story Development Cycle workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Story Development Cycle

**Orchestrator:** TBD
**Version:** 1.0

Ciclo completo de desenvolvimento de stories. Automatiza o fluxo desde a criação até a entrega com quality gate: create → validate → implement → QA review. Aplicável a projetos greenfield e brownfield.

This workflow is now ready to execute. Use *workflow story-development-cycle to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:story-development-cycle:info", {
    description: "Show Story Development Cycle workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Story Development Cycle

**ID:** story-development-cycle
**Orchestrator:** N/A
**Version:** 1.0

Ciclo completo de desenvolvimento de stories. Automatiza o fluxo desde a criação até a entrega com quality gate: create → validate → implement → QA review. Aplicável a projetos greenfield e brownfield.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
