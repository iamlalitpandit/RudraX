import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Extract Patterns
 * ID: extract-patterns
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:extract-patterns", {
    description: "Execute task: Extract Patterns",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Extract Patterns", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Extract Patterns

## Purpose...

Use *task extract-patterns to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:extract-patterns:info", {
    description: "Show Extract Patterns details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Extract Patterns

**ID:** extract-patterns
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
