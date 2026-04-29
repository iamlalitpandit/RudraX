import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Schema Audit
 * ID: db-schema-audit
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-schema-audit", {
    description: "Execute task: Task: Schema Audit",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Schema Audit", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Schema Audit

## Execution Modes...

Use *task db-schema-audit to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-schema-audit:info", {
    description: "Show Task: Schema Audit details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Schema Audit

**ID:** db-schema-audit
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
