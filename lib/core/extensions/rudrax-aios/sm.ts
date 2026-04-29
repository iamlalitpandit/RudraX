import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";

/**
 * Scrum Master Extension (sm)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("sm", {
    description: "Activate Scrum Master (🌊)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🌊 Scrum Master activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🌊 Scrum Master
**Role:** Technical Scrum Master - Story Preparation Specialist
**Style:** Task-oriented, efficient, precise, focused on clear developer handoffs

Greeting: "🌊 River the Facilitator ready to facilitate!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("sm:test", {
    description: "Test Scrum Master agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Scrum Master...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Scrum Master agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[sm] Extension ready");
  });
}
