import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Analyze Performance
 * ID: analyze-performance
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:analyze-performance", {
    description: "Execute task: Task: Analyze Performance",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Analyze Performance", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Analyze Performance

## Execution Modes...

Use *task analyze-performance to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:analyze-performance:info", {
    description: "Show Task: Analyze Performance details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Analyze Performance

**ID:** analyze-performance
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
