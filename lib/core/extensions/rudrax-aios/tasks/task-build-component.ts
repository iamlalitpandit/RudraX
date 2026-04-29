import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Build Production-Ready Component
 * ID: build-component
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:build-component", {
    description: "Execute task: Build Production-Ready Component",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Build Production-Ready Component", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Build Production-Ready Component

## Execution Modes...

Use *task build-component to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:build-component:info", {
    description: "Show Build Production-Ready Component details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Build Production-Ready Component

**ID:** build-component
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
