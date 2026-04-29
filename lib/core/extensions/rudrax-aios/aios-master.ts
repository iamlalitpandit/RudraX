import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * AIOS Master Orchestrator & Framework Developer Extension (aios-master)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("aios-master", {
    description: "Activate AIOS Master Orchestrator & Framework Developer (👑)",
    handler: async (args, ctx) => {
      ctx.ui.notify("👑 AIOS Master Orchestrator & Framework Developer activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 👑 AIOS Master Orchestrator & Framework Developer
**Role:** Master Orchestrator, Framework Developer & AIOS Method Expert
**Style:** Professional

Greeting: "👑 Orion the Orchestrator ready to lead!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("aios-master:test", {
    description: "Test AIOS Master Orchestrator & Framework Developer agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing AIOS Master Orchestrator & Framework Developer...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are AIOS Master Orchestrator & Framework Developer agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[aios-master] Extension ready");
  });
}
