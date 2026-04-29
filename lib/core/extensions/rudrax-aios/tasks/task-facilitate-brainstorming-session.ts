import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Facilitate Brainstorming Session
 * ID: facilitate-brainstorming-session
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:facilitate-brainstorming-session", {
    description: "Execute task: Facilitate Brainstorming Session",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Facilitate Brainstorming Session", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Facilitate Brainstorming Session

## Purpose...

Use *task facilitate-brainstorming-session to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:facilitate-brainstorming-session:info", {
    description: "Show Facilitate Brainstorming Session details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Facilitate Brainstorming Session

**ID:** facilitate-brainstorming-session
**Source:** AIOX-Core

## Purpose...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
