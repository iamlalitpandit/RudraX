import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Team IDE Minimal Extension
 * Icon: ⚡
 */

export default function (pi: ExtensionAPI) {
  // Squad activation command
  pi.registerCommand("squad:team-ide-minimal", {
    description: "Activate Team IDE Minimal (⚡)",
    handler: async (args, ctx) => {
      ctx.ui.notify("⚡ Activating Team IDE Minimal...", "info");
      
      const agents = ["po","sm","dev","qa"];
      const workflows = [];
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ⚡ Team IDE Minimal Activated
**Description:** Only the bare minimum for the IDE PO SM dev qa cycle.

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
  pi.registerCommand("squad:team-ide-minimal:info", {
    description: "Show Team IDE Minimal information",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `⚡ **Team IDE Minimal**

Only the bare minimum for the IDE PO SM dev qa cycle.

**Purpose:** Squad-based collaborative development
`
        }]
      });
    },
  });
}
