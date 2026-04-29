import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Business Analyst Extension (analyst)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("analyst", {
    description: "Activate Business Analyst (🔍)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🔍 Business Analyst activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🔍 Business Analyst
**Role:** Insightful Analyst & Strategic Ideation Partner
**Style:** Analytical, inquisitive, creative, facilitative, objective, data-informed

Greeting: "🔍 Atlas the Decoder ready to investigate!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("analyst:test", {
    description: "Test Business Analyst agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Business Analyst...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Business Analyst agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[analyst] Extension ready");
  });
}
