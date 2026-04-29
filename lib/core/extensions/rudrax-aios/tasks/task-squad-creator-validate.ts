import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: *validate-squad
 * ID: squad-creator-validate
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:squad-creator-validate", {
    description: "Execute task: *validate-squad",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: *validate-squad", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: *validate-squad

## Usage...

Use *task squad-creator-validate to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:squad-creator-validate:info", {
    description: "Show *validate-squad details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 *validate-squad

**ID:** squad-creator-validate
**Source:** AIOX-Core

## Usage...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
