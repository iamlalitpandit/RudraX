import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Apply RLS Policy Template
 * ID: db-policy-apply
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-policy-apply", {
    description: "Execute task: Task: Apply RLS Policy Template",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Apply RLS Policy Template", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Apply RLS Policy Template

## Execution Modes...

Use *task db-policy-apply to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-policy-apply:info", {
    description: "Show Task: Apply RLS Policy Template details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Apply RLS Policy Template

**ID:** db-policy-apply
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
