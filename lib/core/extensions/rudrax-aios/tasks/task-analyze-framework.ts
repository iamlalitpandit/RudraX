import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Analyze Framework
 * ID: analyze-framework
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:analyze-framework", {
    description: "Execute task: Task: Analyze Framework",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Analyze Framework", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Analyze Framework

## Description...

Use *task analyze-framework to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:analyze-framework:info", {
    description: "Show Task: Analyze Framework details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Analyze Framework

**ID:** analyze-framework
**Source:** AIOX-Core

## Description...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
