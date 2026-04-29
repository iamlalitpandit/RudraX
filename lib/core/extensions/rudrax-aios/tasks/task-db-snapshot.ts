import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Create Database Snapshot
 * ID: db-snapshot
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-snapshot", {
    description: "Execute task: Task: Create Database Snapshot",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Create Database Snapshot", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Create Database Snapshot

## Execution Modes...

Use *task db-snapshot to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-snapshot:info", {
    description: "Show Task: Create Database Snapshot details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Create Database Snapshot

**ID:** db-snapshot
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
