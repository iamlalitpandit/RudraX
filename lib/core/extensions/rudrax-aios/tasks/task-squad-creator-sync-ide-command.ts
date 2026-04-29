import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: \*command
 * ID: squad-creator-sync-ide-command
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:squad-creator-sync-ide-command", {
    description: "Execute task: \*command",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: \*command", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: \*command

## Uso...

Use *task squad-creator-sync-ide-command to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:squad-creator-sync-ide-command:info", {
    description: "Show \*command details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 \*command

**ID:** squad-creator-sync-ide-command
**Source:** AIOX-Core

## Uso...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
