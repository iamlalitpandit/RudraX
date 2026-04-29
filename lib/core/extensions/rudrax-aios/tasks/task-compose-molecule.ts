import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Task: Compose Molecule from Atoms
 * ID: compose-molecule
 */

export default function (pi: ExtensionAPI) {
  // Task command
  pi.registerCommand("task:compose-molecule", {
    description: "Execute task: Compose Molecule from Atoms",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Executing task: Compose Molecule from Atoms", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Task: Compose Molecule from Atoms

## Execution Modes...

Use *task compose-molecule to execute this task workflow.
`
        }]
      });
    },
  });

  // Task info command
  pi.registerCommand("task:compose-molecule:info", {
    description: "Show Compose Molecule from Atoms details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### 📋 Compose Molecule from Atoms

**ID:** compose-molecule
**Source:** AIOX-Core

## Execution Modes...

*This is an AIOX-Core imported task*
`
        }]
      });
    },
  });
}
