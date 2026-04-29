import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Extract Design Tokens from Consolidated Patterns
 * ID: extract-tokens
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:extract-tokens", {
    description: "Execute task: Extract Design Tokens from Consolidated Patterns",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Extract Design Tokens from Consolidated Patterns", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Extract Design Tokens from Consolidated Patterns

## Execution Modes...

Use *task extract-tokens to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:extract-tokens:info", {
    description: "Show Extract Design Tokens from Consolidated Patterns details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Extract Design Tokens from Consolidated Patterns

**ID:** extract-tokens
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
