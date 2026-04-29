import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Bootstrap Supabase Project
 * ID: db-bootstrap
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-bootstrap", {
    description: "Execute task: Task: Bootstrap Supabase Project",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Bootstrap Supabase Project", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Bootstrap Supabase Project

## Execution Modes...

Use *task db-bootstrap to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-bootstrap:info", {
    description: "Show Task: Bootstrap Supabase Project details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Bootstrap Supabase Project

**ID:** db-bootstrap
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
