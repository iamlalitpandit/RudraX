import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Team All Extension
 * Icon: 👥
 */

export default function (pi: ExtensionAPI) {
  // Squad activation command
  pi.registerCommand("squad:team-all", {
    description: "Activate Team All (👥)",
    handler: async (args, ctx) => {
      ctx.ui.notify("👥 Activating Team All...", "info");
      
      const agents = ["aios-orchestrator","aios-developer","*"];
      const workflows = ["brownfield-fullstack.yaml","brownfield-service.yaml","brownfield-ui.yaml","greenfield-fullstack.yaml","greenfield-service.yaml","greenfield-ui.yaml"];
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 👥 Team All Activated
**Description:** Includes every core system agent.

**Team Members:**
${agents.map(a => '- @' + a).join('\n')}

**Available Workflows:**
${workflows.map(w => '- ' + w).join('\n')}

Use these agents together for comprehensive development workflows.
`
        }]
      });
      
      // Notify about each agent
      for (const agent of agents) {
        ctx.ui.notify(`🤖 @${agent} ready`, "info");
      }
    },
  });

  // Squad info command
  pi.registerCommand("squad:team-all:info", {
    description: "Show Team All information",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `👥 **Team All**

Includes every core system agent.

**Purpose:** Squad-based collaborative development
`
        }]
      });
    },
  });
}
