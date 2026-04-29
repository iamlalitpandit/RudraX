import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Analyze Hot Query Paths
 * ID: db-analyze-hotpaths
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-analyze-hotpaths", {
    description: "Execute task: Task: Analyze Hot Query Paths",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Analyze Hot Query Paths", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Analyze Hot Query Paths

## Execution Modes...

Use *task db-analyze-hotpaths to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-analyze-hotpaths:info", {
    description: "Show Task: Analyze Hot Query Paths details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Analyze Hot Query Paths

**ID:** db-analyze-hotpaths
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
