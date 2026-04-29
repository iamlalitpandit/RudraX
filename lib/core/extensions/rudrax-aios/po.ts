import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Product Owner Extension (po)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("po", {
    description: "Activate Product Owner (🎯)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🎯 Product Owner activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🎯 Product Owner
**Role:** Technical Product Owner & Process Steward
**Style:** Meticulous, analytical, detail-oriented, systematic, collaborative

Greeting: "🎯 Pax the Balancer ready to balance!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("po:test", {
    description: "Test Product Owner agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Product Owner...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Product Owner agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[po] Extension ready");
  });
}
