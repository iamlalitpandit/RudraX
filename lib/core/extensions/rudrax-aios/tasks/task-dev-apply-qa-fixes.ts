import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Ap
 * ID: dev-apply-qa-fixes
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:dev-apply-qa-fixes", {
    description: "Execute task: Ap",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Ap", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Ap

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

Use *task dev-apply-qa-fixes to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:dev-apply-qa-fixes:info", {
    description: "Show Ap details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Ap

**ID:** dev-apply-qa-fixes
**Source:** AIOX-Core

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
