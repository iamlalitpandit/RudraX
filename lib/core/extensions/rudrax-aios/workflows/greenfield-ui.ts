import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Greenfield UI/Frontend Development Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:greenfield-ui", {
    description: "Execute Greenfield UI/Frontend Development workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Greenfield UI/Frontend Development workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Greenfield UI/Frontend Development

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for building frontend applications from concept to development. Supports both comprehensive planning for complex UIs and rapid prototyping for simple interfaces.

This workflow is now ready to execute. Use *workflow greenfield-ui to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:greenfield-ui:info", {
    description: "Show Greenfield UI/Frontend Development workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Greenfield UI/Frontend Development

**ID:** greenfield-ui
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for building frontend applications from concept to development. Supports both comprehensive planning for complex UIs and rapid prototyping for simple interfaces.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
