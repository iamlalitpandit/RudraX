import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Greenfield Full-Stack Application Development Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:greenfield-fullstack", {
    description: "Execute Greenfield Full-Stack Application Development workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Greenfield Full-Stack Application Development workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Greenfield Full-Stack Application Development

**Orchestrator:** TBD
**Version:** 1.0

Agent workflow for building full-stack applications from concept to development. Supports both comprehensive planning for complex projects and rapid prototyping for simple ones. Includes Phase 0 environment bootstrap for proper tooling setup.

This workflow is now ready to execute. Use *workflow greenfield-fullstack to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:greenfield-fullstack:info", {
    description: "Show Greenfield Full-Stack Application Development workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Greenfield Full-Stack Application Development

**ID:** greenfield-fullstack
**Orchestrator:** N/A
**Version:** 1.0

Agent workflow for building full-stack applications from concept to development. Supports both comprehensive planning for complex projects and rapid prototyping for simple ones. Includes Phase 0 environment bootstrap for proper tooling setup.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
