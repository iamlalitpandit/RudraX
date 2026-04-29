import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Spec Pipeline - Requirements to Specification Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:spec-pipeline", {
    description: "Execute Spec Pipeline - Requirements to Specification workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Spec Pipeline - Requirements to Specification workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Spec Pipeline - Requirements to Specification

**Orchestrator:** TBD
**Version:** 1.0

Pipeline completo que transforma requisitos informais em especificações executáveis. Orquestra 5 fases: Gather → Assess → Research → Write → Critique. Adapta as fases baseado na complexidade do requisito.
Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.

This workflow is now ready to execute. Use *workflow spec-pipeline to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:spec-pipeline:info", {
    description: "Show Spec Pipeline - Requirements to Specification workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Spec Pipeline - Requirements to Specification

**ID:** spec-pipeline
**Orchestrator:** N/A
**Version:** 1.0

Pipeline completo que transforma requisitos informais em especificações executáveis. Orquestra 5 fases: Gather → Assess → Research → Write → Critique. Adapta as fases baseado na complexidade do requisito.
Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
