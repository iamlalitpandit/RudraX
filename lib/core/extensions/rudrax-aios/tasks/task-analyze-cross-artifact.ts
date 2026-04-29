import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Cross-Artifact Analysis Task
 * ID: analyze-cross-artifact
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:analyze-cross-artifact", {
    description: "Execute task: Cross-Artifact Analysis Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Cross-Artifact Analysis Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Cross-Artifact Analysis Task

## Purpose...

Use *task analyze-cross-artifact to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:analyze-cross-artifact:info", {
    description: "Show Cross-Artifact Analysis Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Cross-Artifact Analysis Task

**ID:** analyze-cross-artifact
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
