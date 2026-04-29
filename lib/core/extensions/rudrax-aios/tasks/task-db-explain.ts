import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: EXPLAIN (ANALYZE, BUFFERS)
 * ID: db-explain
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-explain", {
    description: "Execute task: Task: EXPLAIN (ANALYZE, BUFFERS)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: EXPLAIN (ANALYZE, BUFFERS)", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: EXPLAIN (ANALYZE, BUFFERS)

## Execution Modes...

Use *task db-explain to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-explain:info", {
    description: "Show Task: EXPLAIN (ANALYZE, BUFFERS) details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: EXPLAIN (ANALYZE, BUFFERS)

**ID:** db-explain
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
