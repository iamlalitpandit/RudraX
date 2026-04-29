import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Task: Create Squad Agent
 * ID: create-agent
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:create-agent", {
    description: "Execute task: Task: Create Squad Agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Create Squad Agent", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Create Squad Agent

## Step 0: IDS Registry Check (Advisory)...

Use *task create-agent to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:create-agent:info", {
    description: "Show Task: Create Squad Agent details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Create Squad Agent

**ID:** create-agent
**Source:** AIOX-Core

## Step 0: IDS Registry Check (Advisory)...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
