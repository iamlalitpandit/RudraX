import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Auto-Worktree - Automatic Isolated Development Environment Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:auto-worktree", {
    description: "Execute Auto-Worktree - Automatic Isolated Development Environment workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Auto-Worktree - Automatic Isolated Development Environment workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Auto-Worktree - Automatic Isolated Development Environment

**Orchestrator:** TBD
**Version:** 1.0

Automatically creates and manages isolated worktrees for story development. Triggered when @dev starts working on a story, ensuring parallel development capability and clean isolation between different development tasks.
Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.

This workflow is now ready to execute. Use *workflow auto-worktree to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:auto-worktree:info", {
    description: "Show Auto-Worktree - Automatic Isolated Development Environment workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Auto-Worktree - Automatic Isolated Development Environment

**ID:** auto-worktree
**Orchestrator:** N/A
**Version:** 1.0

Automatically creates and manages isolated worktrees for story development. Triggered when @dev starts working on a story, ensuring parallel development capability and clean isolation between different development tasks.
Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
