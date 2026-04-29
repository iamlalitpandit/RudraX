import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: cleanup-worktrees
 * ID: cleanup-worktrees
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:cleanup-worktrees", {
    description: "Execute task: cleanup-worktrees",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: cleanup-worktrees", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: cleanup-worktrees

## Purpose...

Use *task cleanup-worktrees to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:cleanup-worktrees:info", {
    description: "Show cleanup-worktrees details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 cleanup-worktrees

**ID:** cleanup-worktrees
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
