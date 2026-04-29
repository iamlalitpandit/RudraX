import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Design System Build Quality Pipeline Workflow Extension
 */

export default function (pi: ExtensionAPI) {
  // Workflow activation command
  pi.registerCommand("workflow:design-system-build-quality", {
    description: "Execute Design System Build Quality Pipeline workflow",
    handler: async (args, ctx) => {
      ctx.ui.notify("▶️ Starting Design System Build Quality Pipeline workflow...", "info");
      
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ▶️ Design System Build Quality Pipeline

**Orchestrator:** TBD
**Version:** 1.0

Pipeline pós-migração para Design System. Encadeia sequencialmente as etapas de build, documentação, auditoria de acessibilidade e cálculo de ROI para garantir qualidade e mensurar valor entregue.

This workflow is now ready to execute. Use *workflow design-system-build-quality to start.
`
        }]
      });
    },
  });

  // Workflow info command
  pi.registerCommand("workflow:design-system-build-quality:info", {
    description: "Show Design System Build Quality Pipeline workflow details",
    handler: async (args, ctx) => {
      await ctx.sendMessage({
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `### Design System Build Quality Pipeline

**ID:** design-system-build-quality
**Orchestrator:** N/A
**Version:** 1.0

Pipeline pós-migração para Design System. Encadeia sequencialmente as etapas de build, documentação, auditoria de acessibilidade e cálculo de ROI para garantir qualidade e mensurar valor entregue.

*This is an AIOX-Core imported workflow*
`
        }]
      });
    },
  });
}
