import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Generate Pattern Library Documentation
 * ID: generate-documentation
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:generate-documentation", {
    description: "Execute task: Generate Pattern Library Documentation",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Generate Pattern Library Documentation", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Generate Pattern Library Documentation

## Execution Modes...

Use *task generate-documentation to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:generate-documentation:info", {
    description: "Show Generate Pattern Library Documentation details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Generate Pattern Library Documentation

**ID:** generate-documentation
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
