import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: RLS Audit
 * ID: db-rls-audit
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-rls-audit", {
    description: "Execute task: Task: RLS Audit",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: RLS Audit", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: RLS Audit

## Execution Modes...

Use *task db-rls-audit to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-rls-audit:info", {
    description: "Show Task: RLS Audit details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: RLS Audit

**ID:** db-rls-audit
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
