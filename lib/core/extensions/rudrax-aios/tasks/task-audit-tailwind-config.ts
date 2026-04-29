import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Audit Tailwind v4 Configuration & Utility Health
 * ID: audit-tailwind-config
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:audit-tailwind-config", {
    description: "Execute task: Audit Tailwind v4 Configuration & Utility Health",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Audit Tailwind v4 Configuration & Utility Health", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Audit Tailwind v4 Configuration & Utility Health

## Execution Modes...

Use *task audit-tailwind-config to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:audit-tailwind-config:info", {
    description: "Show Audit Tailwind v4 Configuration & Utility Health details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Audit Tailwind v4 Configuration & Utility Health

**ID:** audit-tailwind-config
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
