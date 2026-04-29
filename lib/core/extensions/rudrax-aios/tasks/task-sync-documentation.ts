import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: sync-documentation
 * ID: sync-documentation
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:sync-documentation", {
    description: "Execute task: sync-documentation",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: sync-documentation", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: sync-documentation

## Purpose...

Use *task sync-documentation to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:sync-documentation:info", {
    description: "Show sync-documentation details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 sync-documentation

**ID:** sync-documentation
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
