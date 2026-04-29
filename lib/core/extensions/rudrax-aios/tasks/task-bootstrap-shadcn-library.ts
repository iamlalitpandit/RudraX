import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Bootstrap Shadcn/Radix Component Library
 * ID: bootstrap-shadcn-library
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:bootstrap-shadcn-library", {
    description: "Execute task: Bootstrap Shadcn/Radix Component Library",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Bootstrap Shadcn/Radix Component Library", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Bootstrap Shadcn/Radix Component Library

## Execution Modes...

Use *task bootstrap-shadcn-library to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:bootstrap-shadcn-library:info", {
    description: "Show Bootstrap Shadcn/Radix Component Library details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Bootstrap Shadcn/Radix Component Library

**ID:** bootstrap-shadcn-library
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
