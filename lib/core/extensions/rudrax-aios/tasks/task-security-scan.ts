import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: security-scan
 * ID: security-scan
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:security-scan", {
    description: "Execute task: security-scan",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: security-scan", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: security-scan

## Purpose...

Use *task security-scan to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:security-scan:info", {
    description: "Show security-scan details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 security-scan

**ID:** security-scan
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
