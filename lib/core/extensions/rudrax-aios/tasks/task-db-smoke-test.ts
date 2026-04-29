import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: DB Smoke Test
 * ID: db-smoke-test
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-smoke-test", {
    description: "Execute task: Task: DB Smoke Test",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: DB Smoke Test", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: DB Smoke Test

## Process...

Use *task db-smoke-test to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-smoke-test:info", {
    description: "Show Task: DB Smoke Test details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: DB Smoke Test

**ID:** db-smoke-test
**Source:** AIOX-Core

## Process...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
