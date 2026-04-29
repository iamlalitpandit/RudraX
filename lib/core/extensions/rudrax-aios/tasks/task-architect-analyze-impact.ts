import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: An
 * ID: architect-analyze-impact
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:architect-analyze-impact", {
    description: "Execute task: An",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: An", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: An

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

Use *task architect-analyze-impact to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:architect-analyze-impact:info", {
    description: "Show An details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 An

**ID:** architect-analyze-impact
**Source:** AIOX-Core

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
