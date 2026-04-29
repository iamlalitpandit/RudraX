import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: *design-squad
 * ID: squad-creator-design
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:squad-creator-design", {
    description: "Execute task: *design-squad",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: *design-squad", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: *design-squad

## Usage...

Use *task squad-creator-design to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:squad-creator-design:info", {
    description: "Show *design-squad details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 *design-squad

**ID:** squad-creator-design
**Source:** AIOX-Core

## Usage...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
