import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: check-docs-links
 * ID: check-docs-links
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:check-docs-links", {
    description: "Execute task: check-docs-links",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: check-docs-links", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: check-docs-links

## Metadata...

Use *task check-docs-links to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:check-docs-links:info", {
    description: "Show check-docs-links details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 check-docs-links

**ID:** check-docs-links
**Source:** AIOX-Core

## Metadata...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
