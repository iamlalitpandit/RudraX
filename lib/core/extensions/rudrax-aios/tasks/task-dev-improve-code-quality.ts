import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: # Execution Modes
 * ID: dev-improve-code-quality
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:dev-improve-code-quality", {
    description: "Execute task: # Execution Modes",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: # Execution Modes", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: # Execution Modes

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

Use *task dev-improve-code-quality to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:dev-improve-code-quality:info", {
    description: "Show # Execution Modes details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 # Execution Modes

**ID:** dev-improve-code-quality
**Source:** AIOX-Core

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
