import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Configure CI/CD Pipeline
 * ID: ci-cd-configuration
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:ci-cd-configuration", {
    description: "Execute task: Configure CI/CD Pipeline",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Configure CI/CD Pipeline", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Configure CI/CD Pipeline

## Purpose...

Use *task ci-cd-configuration to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:ci-cd-configuration:info", {
    description: "Show Configure CI/CD Pipeline details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Configure CI/CD Pipeline

**ID:** ci-cd-configuration
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
