import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Audit Codebase for UI Pattern Redundancy
 * ID: audit-codebase
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:audit-codebase", {
    description: "Execute task: Audit Codebase for UI Pattern Redundancy",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Audit Codebase for UI Pattern Redundancy", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Audit Codebase for UI Pattern Redundancy

## Execution Modes...

Use *task audit-codebase to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:audit-codebase:info", {
    description: "Show Audit Codebase for UI Pattern Redundancy details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Audit Codebase for UI Pattern Redundancy

**ID:** audit-codebase
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
