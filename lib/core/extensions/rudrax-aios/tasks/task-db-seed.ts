import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Apply Seed Data
 * ID: db-seed
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-seed", {
    description: "Execute task: Task: Apply Seed Data",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Apply Seed Data", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Apply Seed Data

## Execution Modes...

Use *task db-seed to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-seed:info", {
    description: "Show Task: Apply Seed Data details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Apply Seed Data

**ID:** db-seed
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
