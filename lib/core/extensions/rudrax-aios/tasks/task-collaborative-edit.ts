import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: collaborative-edit
 * ID: collaborative-edit
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:collaborative-edit", {
    description: "Execute task: collaborative-edit",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: collaborative-edit", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: collaborative-edit

## Execution Modes...

Use *task collaborative-edit to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:collaborative-edit:info", {
    description: "Show collaborative-edit details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 collaborative-edit

**ID:** collaborative-edit
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
