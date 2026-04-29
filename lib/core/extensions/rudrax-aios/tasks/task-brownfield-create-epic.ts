import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Create Brownfield Epic Task
 * ID: brownfield-create-epic
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:brownfield-create-epic", {
    description: "Execute task: Create Brownfield Epic Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Create Brownfield Epic Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Create Brownfield Epic Task

## Purpose...

Use *task brownfield-create-epic to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:brownfield-create-epic:info", {
    description: "Show Create Brownfield Epic Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Create Brownfield Epic Task

**ID:** brownfield-create-epic
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
