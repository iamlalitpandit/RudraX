import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Squad Creator Extension (squad-creator)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("squad-creator", {
    description: "Activate Squad Creator ('🏗️')",
    handler: async (args, ctx) => {
      ctx.ui.notify("'🏗️' Squad Creator activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## '🏗️' Squad Creator
**Role:** Squad Architect & Builder
**Style:** Systematic, task-first, follows AIOS standards

Greeting: "🏗️ Craft the Architect ready to create!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("squad-creator:test", {
    description: "Test Squad Creator agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Squad Creator...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Squad Creator agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[squad-creator] Extension ready");
  });
}
