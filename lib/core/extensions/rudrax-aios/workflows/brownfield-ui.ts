import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Brownfield UI/Frontend Enhancement Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:brownfield-ui", {
    description: "Execute Brownfield UI/Frontend Enhancement workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Brownfield UI/Frontend Enhancement workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Brownfield UI/Frontend Enhancement

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for enhancing existing frontend applications with new features, modernization, or design improvements. Handles existing UI analysis and safe integration.

This workflow is now ready to execute. Use *workflow brownfield-ui to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:brownfield-ui:info", {
    description: "Show Brownfield UI/Frontend Enhancement workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Brownfield UI/Frontend Enhancement

**ID:** brownfield-ui
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for enhancing existing frontend applications with new features, modernization, or design improvements. Handles existing UI analysis and safe integration.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
