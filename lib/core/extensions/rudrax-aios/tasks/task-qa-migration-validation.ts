import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Migration Validation Task
 * ID: qa-migration-validation
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:qa-migration-validation", {
    description: "Execute task: Migration Validation Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Migration Validation Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Migration Validation Task

## Execution Modes...

Use *task qa-migration-validation to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:qa-migration-validation:info", {
    description: "Show Migration Validation Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Migration Validation Task

**ID:** qa-migration-validation
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
