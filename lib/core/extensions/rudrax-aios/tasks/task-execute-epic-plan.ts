import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: # Execution Modes
 * ID: execute-epic-plan
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:execute-epic-plan", {
    description: "Execute task: # Execution Modes",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: # Execution Modes", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: # Execution Modes

### 1. YOLO Mode - Autonomous (0-2 prompts)...

Use *task execute-epic-plan to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:execute-epic-plan:info", {
    description: "Show # Execution Modes details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 # Execution Modes

**ID:** execute-epic-plan
**Source:** AIOX-Core

### 1. YOLO Mode - Autonomous (0-2 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
