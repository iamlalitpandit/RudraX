import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Document Gotchas Task
 * ID: document-gotchas
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:document-gotchas", {
    description: "Execute task: Document Gotchas Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Document Gotchas Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Document Gotchas Task

## Purpose...

Use *task document-gotchas to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:document-gotchas:info", {
    description: "Show Document Gotchas Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Document Gotchas Task

**ID:** document-gotchas
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
