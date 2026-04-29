import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Load CSV Data Safely
 * ID: db-load-csv
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-load-csv", {
    description: "Execute task: Task: Load CSV Data Safely",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Load CSV Data Safely", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Load CSV Data Safely

## Execution Modes...

Use *task db-load-csv to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-load-csv:info", {
    description: "Show Task: Load CSV Data Safely details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Load CSV Data Safely

**ID:** db-load-csv
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
