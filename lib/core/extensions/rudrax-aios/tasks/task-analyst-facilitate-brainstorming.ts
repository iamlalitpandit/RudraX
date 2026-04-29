import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction
 * ID: analyst-facilitate-brainstorming
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:analyst-facilitate-brainstorming", {
    description: "Execute task: No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction

# Facilitate Brainstorming Session Task...

Use *task analyst-facilitate-brainstorming to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:analyst-facilitate-brainstorming:info", {
    description: "Show No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction

**ID:** analyst-facilitate-brainstorming
**Source:** AIOX-Core

# Facilitate Brainstorming Session Task...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
