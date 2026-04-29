import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Brownfield Service/API Enhancement Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:brownfield-service", {
    description: "Execute Brownfield Service/API Enhancement workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Brownfield Service/API Enhancement workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Brownfield Service/API Enhancement

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for enhancing existing backend services and APIs with new features, modernization, or performance improvements. Handles existing system analysis and safe integration.

This workflow is now ready to execute. Use *workflow brownfield-service to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:brownfield-service:info", {
    description: "Show Brownfield Service/API Enhancement workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Brownfield Service/API Enhancement

**ID:** brownfield-service
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for enhancing existing backend services and APIs with new features, modernization, or performance improvements. Handles existing system analysis and safe integration.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
