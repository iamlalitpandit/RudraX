import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: learn-patterns
 * ID: learn-patterns
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:learn-patterns", {
    description: "Execute task: learn-patterns",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: learn-patterns", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: learn-patterns

## Execution Modes...

Use *task learn-patterns to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:learn-patterns:info", {
    description: "Show learn-patterns details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 learn-patterns

**ID:** learn-patterns
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
