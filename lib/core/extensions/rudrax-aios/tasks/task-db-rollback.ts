import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Rollback Database
 * ID: db-rollback
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-rollback", {
    description: "Execute task: Task: Rollback Database",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Rollback Database", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Rollback Database

## Execution Modes...

Use *task db-rollback to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-rollback:info", {
    description: "Show Task: Rollback Database details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Rollback Database

**ID:** db-rollback
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
