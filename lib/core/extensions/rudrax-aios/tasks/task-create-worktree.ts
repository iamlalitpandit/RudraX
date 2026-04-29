import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: create-worktree
 * ID: create-worktree
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-worktree", {
    description: "Execute task: create-worktree",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: create-worktree", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: create-worktree

## Execution Modes...

Use *task create-worktree to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-worktree:info", {
    description: "Show create-worktree details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 create-worktree

**ID:** create-worktree
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
