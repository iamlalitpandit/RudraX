import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Develop Story Task
 * ID: dev-develop-story
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:dev-develop-story", {
    description: "Execute task: Develop Story Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Develop Story Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Develop Story Task

## Purpose...

Use *task dev-develop-story to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:dev-develop-story:info", {
    description: "Show Develop Story Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Develop Story Task

**ID:** dev-develop-story
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
