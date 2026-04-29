import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Verify DDL Ordering
 * ID: db-verify-order
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-verify-order", {
    description: "Execute task: Task: Verify DDL Ordering",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Verify DDL Ordering", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Verify DDL Ordering

## Execution Modes...

Use *task db-verify-order to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-verify-order:info", {
    description: "Show Task: Verify DDL Ordering details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Verify DDL Ordering

**ID:** db-verify-order
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
