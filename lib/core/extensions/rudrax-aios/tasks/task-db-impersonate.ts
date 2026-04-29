import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Impersonate User (RLS Testing)
 * ID: db-impersonate
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-impersonate", {
    description: "Execute task: Task: Impersonate User (RLS Testing)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Impersonate User (RLS Testing)", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Impersonate User (RLS Testing)

## Execution Modes...

Use *task db-impersonate to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-impersonate:info", {
    description: "Show Task: Impersonate User (RLS Testing) details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Impersonate User (RLS Testing)

**ID:** db-impersonate
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
