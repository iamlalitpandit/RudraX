import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: No templates needed - this task executes existing checklists, doesn't create document outputs
 * ID: execute-checklist
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:execute-checklist", {
    description: "Execute task: No templates needed - this task executes existing checklists, doesn't create document outputs",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: No templates needed - this task executes existing checklists, doesn't create document outputs", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: No templates needed - this task executes existing checklists, doesn't create document outputs

## Execution Modes...

Use *task execute-checklist to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:execute-checklist:info", {
    description: "Show No templates needed - this task executes existing checklists, doesn't create document outputs details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 No templates needed - this task executes existing checklists, doesn't create document outputs

**ID:** execute-checklist
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
