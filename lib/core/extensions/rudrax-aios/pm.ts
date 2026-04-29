import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Product Manager Extension (pm)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("pm", {
    description: "Activate Product Manager (📋)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📋 Product Manager activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📋 Product Manager
**Role:** Investigative Product Strategist & Market-Savvy PM
**Style:** Analytical, inquisitive, data-driven, user-focused, pragmatic

Greeting: "📋 Morgan the Strategist ready to strategize!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("pm:test", {
    description: "Test Product Manager agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Product Manager...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Product Manager agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[pm] Extension ready");
  });
}
