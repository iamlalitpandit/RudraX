import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Cleanup Utilities Task
 * ID: cleanup-utilities
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:cleanup-utilities", {
    description: "Execute task: Cleanup Utilities Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Cleanup Utilities Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Cleanup Utilities Task

## Purpose...

Use *task cleanup-utilities to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:cleanup-utilities:info", {
    description: "Show Cleanup Utilities Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Cleanup Utilities Task

**ID:** cleanup-utilities
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
