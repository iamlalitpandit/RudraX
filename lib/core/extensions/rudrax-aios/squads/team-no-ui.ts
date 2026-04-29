import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Team No UI Extension
 * Icon: 🔧
 */

export default function (pi: ExtensionAPI) {
  // Squad activation command
  pi.registerCommand("squad:team-no-ui", {
    description: "Activate Team No UI (🔧)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🔧 Activating Team No UI...", "info");
      
      const agents = ["aios-orchestrator","analyst","pm","architect","po"];
      const workflows = ["greenfield-service.yaml","brownfield-service.yaml"];
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🔧 Team No UI Activated
**Description:** Team with no UX or UI Planning.

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
  pi.registerCommand("squad:team-no-ui:info", {
    description: "Show Team No UI information",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `🔧 **Team No UI**

Team with no UX or UI Planning.

**Purpose:** Squad-based collaborative development
`
        }]
      });
    },
  });
}
