import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Greenfield Service/API Development Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:greenfield-service", {
    description: "Execute Greenfield Service/API Development workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Greenfield Service/API Development workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Greenfield Service/API Development

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for building backend services from concept to development. Supports both comprehensive planning for complex services and rapid prototyping for simple APIs.

This workflow is now ready to execute. Use *workflow greenfield-service to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:greenfield-service:info", {
    description: "Show Greenfield Service/API Development workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Greenfield Service/API Development

**ID:** greenfield-service
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for building backend services from concept to development. Supports both comprehensive planning for complex services and rapid prototyping for simple APIs.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
