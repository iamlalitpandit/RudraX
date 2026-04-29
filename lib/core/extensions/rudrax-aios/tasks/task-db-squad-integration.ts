import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Database Integration Analysis for Squad
 * ID: db-squad-integration
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-squad-integration", {
    description: "Execute task: Database Integration Analysis for Squad",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Database Integration Analysis for Squad", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Database Integration Analysis for Squad

## Execution Modes...

Use *task db-squad-integration to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-squad-integration:info", {
    description: "Show Database Integration Analysis for Squad details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Database Integration Analysis for Squad

**ID:** db-squad-integration
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
