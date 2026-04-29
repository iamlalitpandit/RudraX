import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Task: Add MCP Server Task
 * ID: add-mcp
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:add-mcp", {
    description: "Execute task: Add MCP Server Task",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Add MCP Server Task", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Add MCP Server Task

## Task Definition...

Use *task add-mcp to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:add-mcp:info", {
    description: "Show Add MCP Server Task details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Add MCP Server Task

**ID:** add-mcp
**Source:** AIOX-Core

## Task Definition...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
