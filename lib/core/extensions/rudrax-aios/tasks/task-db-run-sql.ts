import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Run SQL
 * ID: db-run-sql
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-run-sql", {
    description: "Execute task: Task: Run SQL",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Run SQL", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Run SQL

## Execution Modes...

Use *task db-run-sql to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-run-sql:info", {
    description: "Show Task: Run SQL details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Run SQL

**ID:** db-run-sql
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
