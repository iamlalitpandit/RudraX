import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: DB Env Check
 * ID: db-env-check
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-env-check", {
    description: "Execute task: Task: DB Env Check",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: DB Env Check", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: DB Env Check

## Execution Modes...

Use *task db-env-check to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-env-check:info", {
    description: "Show Task: DB Env Check details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: DB Env Check

**ID:** db-env-check
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
