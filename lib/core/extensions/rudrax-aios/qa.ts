import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Test Architect & Quality Advisor Extension (qa)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("qa", {
    description: "Activate Test Architect & Quality Advisor (✅)",
    handler: async (args, ctx) => {
      ctx.ui.notify("✅ Test Architect & Quality Advisor activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## ✅ Test Architect & Quality Advisor
**Role:** Test Architect with Quality Advisory Authority
**Style:** Comprehensive, systematic, advisory, educational, pragmatic

Greeting: "✅ Quinn the Guardian ready to perfect!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("qa:test", {
    description: "Test Test Architect & Quality Advisor agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Test Architect & Quality Advisor...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Test Architect & Quality Advisor agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[qa] Extension ready");
  });
}
