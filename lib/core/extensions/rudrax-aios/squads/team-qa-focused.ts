import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Team QA-Focused Extension
 * Icon: 🔍
 */

export default function (pi: ExtensionAPI) {
  // Squad activation command
  pi.registerCommand("squad:team-qa-focused", {
    description: "Activate Team QA-Focused (🔍)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🔍 Activating Team QA-Focused...", "info");
      
      const agents = ["dev","qa","github-devops"];
      const workflows = ["code-quality-gate.yaml","pr-validation.yaml","deployment-safety-check.yaml"];
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🔍 Team QA-Focused Activated
**Description:** Quality-focused team that orchestrates code review, testing, and deployment validation using CodeRabbit integration. Ideal for pre-PR reviews, deployment gates, and comprehensive quality assurance.

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
  pi.registerCommand("squad:team-qa-focused:info", {
    description: "Show Team QA-Focused information",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `🔍 **Team QA-Focused**

Quality-focused team that orchestrates code review, testing, and deployment validation using CodeRabbit integration. Ideal for pre-PR reviews, deployment gates, and comprehensive quality assurance.

**Purpose:** Squad-based collaborative development
`
        }]
      });
    },
  });
}
