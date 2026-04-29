import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Consolidate Patterns Using Intelligent Clustering
 * ID: consolidate-patterns
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:consolidate-patterns", {
    description: "Execute task: Consolidate Patterns Using Intelligent Clustering",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Consolidate Patterns Using Intelligent Clustering", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Consolidate Patterns Using Intelligent Clustering

## Execution Modes...

Use *task consolidate-patterns to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:consolidate-patterns:info", {
    description: "Show Consolidate Patterns Using Intelligent Clustering details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Consolidate Patterns Using Intelligent Clustering

**ID:** consolidate-patterns
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
