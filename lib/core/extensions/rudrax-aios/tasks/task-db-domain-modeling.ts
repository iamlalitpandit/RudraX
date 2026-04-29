import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Task: Domain Modeling Session
 * ID: db-domain-modeling
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:db-domain-modeling", {
    description: "Execute task: Task: Domain Modeling Session",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Task: Domain Modeling Session", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Task: Domain Modeling Session

## Execution Modes...

Use *task db-domain-modeling to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:db-domain-modeling:info", {
    description: "Show Task: Domain Modeling Session details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Task: Domain Modeling Session

**ID:** db-domain-modeling
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
