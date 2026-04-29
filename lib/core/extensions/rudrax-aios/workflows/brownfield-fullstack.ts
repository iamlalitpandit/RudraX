import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Brownfield Full-Stack Enhancement Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:brownfield-fullstack", {
    description: "Execute Brownfield Full-Stack Enhancement workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Brownfield Full-Stack Enhancement workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Brownfield Full-Stack Enhancement

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for enhancing existing full-stack applications with new features, modernization, or significant changes. Handles existing system analysis and safe integration.

This workflow is now ready to execute. Use *workflow brownfield-fullstack to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:brownfield-fullstack:info", {
    description: "Show Brownfield Full-Stack Enhancement workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Brownfield Full-Stack Enhancement

**ID:** brownfield-fullstack
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for enhancing existing full-stack applications with new features, modernization, or significant changes. Handles existing system analysis and safe integration.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
