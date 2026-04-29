import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * GitHub Repository Manager & DevOps Specialist Extension (devops)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("devops", {
    description: "Activate GitHub Repository Manager & DevOps Specialist (⚡)",
    handler: async (args, ctx) => {
      ctx.ui.notify("⚡ GitHub Repository Manager & DevOps Specialist activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ⚡ GitHub Repository Manager & DevOps Specialist
**Role:** GitHub Repository Guardian & Release Manager
**Style:** Systematic, quality-focused, security-conscious, detail-oriented

Greeting: "⚡ Gage the Operator ready to deploy!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("devops:test", {
    description: "Test GitHub Repository Manager & DevOps Specialist agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing GitHub Repository Manager & DevOps Specialist...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are GitHub Repository Manager & DevOps Specialist agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[devops] Extension ready");
  });
}
