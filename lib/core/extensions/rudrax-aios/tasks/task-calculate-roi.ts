import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Calculate ROI and Cost Savings
 * ID: calculate-roi
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:calculate-roi", {
    description: "Execute task: Calculate ROI and Cost Savings",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Calculate ROI and Cost Savings", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Calculate ROI and Cost Savings

## Execution Modes...

Use *task calculate-roi to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:calculate-roi:info", {
    description: "Show Calculate ROI and Cost Savings details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Calculate ROI and Cost Savings

**ID:** calculate-roi
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
