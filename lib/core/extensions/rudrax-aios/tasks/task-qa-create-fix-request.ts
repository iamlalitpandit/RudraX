import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Create Fix Request Task
 * ID: qa-create-fix-request
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:qa-create-fix-request", {
    description: "Execute task: Create Fix Request Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Create Fix Request Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Create Fix Request Task

## Execution Modes...

Use *task qa-create-fix-request to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:qa-create-fix-request:info", {
    description: "Show Create Fix Request Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Create Fix Request Task

**ID:** qa-create-fix-request
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
