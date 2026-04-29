import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Apply Migration (with snapshot + advisory lock)
 * ID: db-apply-migration
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-apply-migration", {
    description: "Execute task: Task: Apply Migration (with snapshot + advisory lock)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Apply Migration (with snapshot + advisory lock)", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Apply Migration (with snapshot + advisory lock)

## Execution Modes...

Use *task db-apply-migration to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-apply-migration:info", {
    description: "Show Task: Apply Migration (with snapshot + advisory lock) details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Apply Migration (with snapshot + advisory lock)

**ID:** db-apply-migration
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
