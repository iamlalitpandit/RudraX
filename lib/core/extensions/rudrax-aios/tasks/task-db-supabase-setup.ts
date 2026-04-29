import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Supabase Setup Guide
 * ID: db-supabase-setup
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-supabase-setup", {
    description: "Execute task: Task: Supabase Setup Guide",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Supabase Setup Guide", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Supabase Setup Guide

## Execution Modes...

Use *task db-supabase-setup to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-supabase-setup:info", {
    description: "Show Task: Supabase Setup Guide details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Supabase Setup Guide

**ID:** db-supabase-setup
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
