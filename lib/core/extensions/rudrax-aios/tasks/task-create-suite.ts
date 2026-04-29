import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: TODO: Create test-suite-checklist.md for validation (follow-up story needed)
 * ID: create-suite
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-suite", {
    description: "Execute task: TODO: Create test-suite-checklist.md for validation (follow-up story needed)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: TODO: Create test-suite-checklist.md for validation (follow-up story needed)", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: TODO: Create test-suite-checklist.md for validation (follow-up story needed)

# Task: Create Component Suite...

Use *task create-suite to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-suite:info", {
    description: "Show TODO: Create test-suite-checklist.md for validation (follow-up story needed) details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 TODO: Create test-suite-checklist.md for validation (follow-up story needed)

**ID:** create-suite
**Source:** AIOX-Core

# Task: Create Component Suite...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
