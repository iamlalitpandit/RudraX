import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Build Resume
 * ID: build-resume
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:build-resume", {
    description: "Execute task: Task: Build Resume",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Build Resume", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Build Resume

## Purpose...

Use *task build-resume to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:build-resume:info", {
    description: "Show Task: Build Resume details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Build Resume

**ID:** build-resume
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
