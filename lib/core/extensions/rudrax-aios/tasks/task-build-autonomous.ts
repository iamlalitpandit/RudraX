import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Build Autonomous
 * ID: build-autonomous
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:build-autonomous", {
    description: "Execute task: Task: Build Autonomous",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Build Autonomous", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Build Autonomous

## Purpose...

Use *task build-autonomous to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:build-autonomous:info", {
    description: "Show Task: Build Autonomous details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Build Autonomous

**ID:** build-autonomous
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
