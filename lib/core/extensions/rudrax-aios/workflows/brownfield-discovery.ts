import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Brownfield Discovery - Complete Technical Debt Assessment Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:brownfield-discovery", {
    description: "Execute Brownfield Discovery - Complete Technical Debt Assessment workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Brownfield Discovery - Complete Technical Debt Assessment workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Brownfield Discovery - Complete Technical Debt Assessment

**Orchestrator:** TBD
**Version:** 2.0

Comprehensive multi-agent discovery workflow for existing projects. Includes specialist validation cycles and executive awareness report. Designed for projects migrating from Lovable, v0.dev, or legacy codebases.

This workflow is now ready to execute. Use *workflow brownfield-discovery to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:brownfield-discovery:info", {
    description: "Show Brownfield Discovery - Complete Technical Debt Assessment workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Brownfield Discovery - Complete Technical Debt Assessment

**ID:** brownfield-discovery
**Orchestrator:** N/A
**Version:** 2.0

Comprehensive multi-agent discovery workflow for existing projects. Includes specialist validation cycles and executive awareness report. Designed for projects migrating from Lovable, v0.dev, or legacy codebases.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
