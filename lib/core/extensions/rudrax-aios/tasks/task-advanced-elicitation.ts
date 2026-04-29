import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: advanced-elicitation
 * ID: advanced-elicitation
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:advanced-elicitation", {
    description: "Execute task: advanced-elicitation",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: advanced-elicitation", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: advanced-elicitation

## Execution Modes...

Use *task advanced-elicitation to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:advanced-elicitation:info", {
    description: "Show advanced-elicitation details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 advanced-elicitation

**ID:** advanced-elicitation
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
