import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Dev Task: Register Technical Debt
 * ID: dev-backlog-debt
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:dev-backlog-debt", {
    description: "Execute task: Dev Task: Register Technical Debt",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Dev Task: Register Technical Debt", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Dev Task: Register Technical Debt

## Execution Modes...

Use *task dev-backlog-debt to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:dev-backlog-debt:info", {
    description: "Show Dev Task: Register Technical Debt details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Dev Task: Register Technical Debt

**ID:** dev-backlog-debt
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
