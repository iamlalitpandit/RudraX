import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Evidence Requirements Task
 * ID: qa-evidence-requirements
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:qa-evidence-requirements", {
    description: "Execute task: Evidence Requirements Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Evidence Requirements Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Evidence Requirements Task

## Task Definition...

Use *task qa-evidence-requirements to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:qa-evidence-requirements:info", {
    description: "Show Evidence Requirements Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Evidence Requirements Task

**ID:** qa-evidence-requirements
**Source:** AIOX-Core

## Task Definition...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
