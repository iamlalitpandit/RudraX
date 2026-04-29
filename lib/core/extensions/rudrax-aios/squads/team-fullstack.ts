import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Team Fullstack Extension
 * Icon: 🚀
 */

export default function (pi: ExtensionAPI) {
  // Squad activation command
  pi.registerCommand("squad:team-fullstack", {
    description: "Activate Team Fullstack (🚀)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🚀 Activating Team Fullstack...", "info");
      
      const agents = ["aios-orchestrator","analyst","pm","ux-expert","architect","po"];
      const workflows = ["brownfield-fullstack.yaml","brownfield-service.yaml","brownfield-ui.yaml","greenfield-fullstack.yaml","greenfield-service.yaml","greenfield-ui.yaml"];
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🚀 Team Fullstack Activated
**Description:** Team capable of full stack, front end only, or service development.

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
  pi.registerCommand("squad:team-fullstack:info", {
    description: "Show Team Fullstack information",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `🚀 **Team Fullstack**

Team capable of full stack, front end only, or service development.

**Purpose:** Squad-based collaborative development
`
        }]
      });
    },
  });
}
