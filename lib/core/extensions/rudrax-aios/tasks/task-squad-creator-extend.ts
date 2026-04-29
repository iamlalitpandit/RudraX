import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Extend Squad Task
 * ID: squad-creator-extend
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:squad-creator-extend", {
    description: "Execute task: Extend Squad Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Extend Squad Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Extend Squad Task

## Purpose...

Use *task squad-creator-extend to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:squad-creator-extend:info", {
    description: "Show Extend Squad Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Extend Squad Task

**ID:** squad-creator-extend
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
