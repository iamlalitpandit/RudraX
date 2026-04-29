import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Migration Dry-Run
 * ID: db-dry-run
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-dry-run", {
    description: "Execute task: Task: Migration Dry-Run",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Migration Dry-Run", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Migration Dry-Run

## Execution Modes...

Use *task db-dry-run to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-dry-run:info", {
    description: "Show Task: Migration Dry-Run details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Migration Dry-Run

**ID:** db-dry-run
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
