import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: audit-utilities
 * ID: audit-utilities
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:audit-utilities", {
    description: "Execute task: audit-utilities",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: audit-utilities", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: audit-utilities

## Execution Modes...

Use *task audit-utilities to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:audit-utilities:info", {
    description: "Show audit-utilities details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 audit-utilities

**ID:** audit-utilities
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
