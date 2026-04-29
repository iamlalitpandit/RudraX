import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Development Cycle (Projeto Bob) Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:development-cycle", {
    description: "Execute Development Cycle (Projeto Bob) workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Development Cycle (Projeto Bob) workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Development Cycle (Projeto Bob)

**Orchestrator:** @po
**Version:** 1.0.0

Workflow orquestrado para ciclo de desenvolvimento por story. Implementa o fluxo PO → Executor → Quality Gate → DevOps → Push com suporte a executor dinâmico, self-healing e checkpoints humanos.

This workflow is now ready to execute. Use *workflow development-cycle to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:development-cycle:info", {
    description: "Show Development Cycle (Projeto Bob) workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Development Cycle (Projeto Bob)

**ID:** development-cycle
**Orchestrator:** @po
**Version:** 1.0.0

Workflow orquestrado para ciclo de desenvolvimento por story. Implementa o fluxo PO → Executor → Quality Gate → DevOps → Push com suporte a executor dinâmico, self-healing e checkpoints humanos.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
