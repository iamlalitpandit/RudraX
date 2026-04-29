import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: # Execution Modes
 * ID: qa-trace-requirements
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:qa-trace-requirements", {
    description: "Execute task: # Execution Modes",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: # Execution Modes", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: # Execution Modes

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

Use *task qa-trace-requirements to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:qa-trace-requirements:info", {
    description: "Show # Execution Modes details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 # Execution Modes

**ID:** qa-trace-requirements
**Source:** AIOX-Core

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
