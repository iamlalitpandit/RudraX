import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Story Checkpoint
 * ID: story-checkpoint
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:story-checkpoint", {
    description: "Execute task: Task: Story Checkpoint",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Story Checkpoint", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Story Checkpoint

## Story 11.3: Development Cycle Workflow...

Use *task story-checkpoint to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:story-checkpoint:info", {
    description: "Show Task: Story Checkpoint details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Story Checkpoint

**ID:** story-checkpoint
**Source:** AIOX-Core

## Story 11.3: Development Cycle Workflow...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
