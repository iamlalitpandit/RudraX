import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: # Execution Modes
 * ID: create-task
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-task", {
    description: "Execute task: # Execution Modes",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: # Execution Modes", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: # Execution Modes

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

Use *task create-task to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-task:info", {
    description: "Show # Execution Modes details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 # Execution Modes

**ID:** create-task
**Source:** AIOX-Core

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
