import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: environment-bootstrap
 * ID: environment-bootstrap
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:environment-bootstrap", {
    description: "Execute task: environment-bootstrap",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: environment-bootstrap", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: environment-bootstrap

## Purpose...

Use *task environment-bootstrap to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:environment-bootstrap:info", {
    description: "Show environment-bootstrap details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 environment-bootstrap

**ID:** environment-bootstrap
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
