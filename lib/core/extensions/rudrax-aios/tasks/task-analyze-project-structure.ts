import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Analyze Project Structure
 * ID: analyze-project-structure
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:analyze-project-structure", {
    description: "Execute task: Analyze Project Structure",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Analyze Project Structure", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Analyze Project Structure

## Execution Modes...

Use *task analyze-project-structure to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:analyze-project-structure:info", {
    description: "Show Analyze Project Structure details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Analyze Project Structure

**ID:** analyze-project-structure
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
