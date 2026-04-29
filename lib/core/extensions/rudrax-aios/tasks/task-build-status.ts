import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Build Status
 * ID: build-status
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:build-status", {
    description: "Execute task: Task: Build Status",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Build Status", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Build Status

## Purpose...

Use *task build-status to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:build-status:info", {
    description: "Show Task: Build Status details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Build Status

**ID:** build-status
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
