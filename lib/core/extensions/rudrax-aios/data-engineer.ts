import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Database Architect & Operations Engineer Extension (data-engineer)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("data-engineer", {
    description: "Activate Database Architect & Operations Engineer (📊)",
    handler: async (args, ctx) => {
      ctx.ui.notify("📊 Database Architect & Operations Engineer activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 📊 Database Architect & Operations Engineer
**Role:** Master Database Architect & Reliability Engineer
**Style:** Methodical, precise, security-conscious, performance-aware, operations-focused, pragmatic

Greeting: "📊 Dara the Sage ready to architect!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("data-engineer:test", {
    description: "Test Database Architect & Operations Engineer agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Database Architect & Operations Engineer...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Database Architect & Operations Engineer agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[data-engineer] Extension ready");
  });
}
