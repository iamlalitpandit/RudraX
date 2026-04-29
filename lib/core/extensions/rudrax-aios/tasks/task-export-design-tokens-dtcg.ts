import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Export Design Tokens to W3C DTCG
 * ID: export-design-tokens-dtcg
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:export-design-tokens-dtcg", {
    description: "Execute task: Export Design Tokens to W3C DTCG",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Export Design Tokens to W3C DTCG", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Export Design Tokens to W3C DTCG

## Execution Modes...

Use *task export-design-tokens-dtcg to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:export-design-tokens-dtcg:info", {
    description: "Show Export Design Tokens to W3C DTCG details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Export Design Tokens to W3C DTCG

**ID:** export-design-tokens-dtcg
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
