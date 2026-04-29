import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Template selection determined dynamically during task execution
 * ID: create-doc
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-doc", {
    description: "Execute task: Template selection determined dynamically during task execution",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Template selection determined dynamically during task execution", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Template selection determined dynamically during task execution

## Execution Modes...

Use *task create-doc to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-doc:info", {
    description: "Show Template selection determined dynamically during task execution details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Template selection determined dynamically during task execution

**ID:** create-doc
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
