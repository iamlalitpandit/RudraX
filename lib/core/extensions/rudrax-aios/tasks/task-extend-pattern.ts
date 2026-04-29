import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Extend Existing Pattern
 * ID: extend-pattern
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:extend-pattern", {
    description: "Execute task: Extend Existing Pattern",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Extend Existing Pattern", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Extend Existing Pattern

## Execution Modes...

Use *task extend-pattern to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:extend-pattern:info", {
    description: "Show Extend Existing Pattern details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Extend Existing Pattern

**ID:** extend-pattern
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
