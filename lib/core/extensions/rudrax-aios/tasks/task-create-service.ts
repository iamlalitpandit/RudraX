import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Create Service
 * ID: create-service
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-service", {
    description: "Execute task: Create Service",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Create Service", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Create Service

## Purpose...

Use *task create-service to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-service:info", {
    description: "Show Create Service details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Create Service

**ID:** create-service
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
