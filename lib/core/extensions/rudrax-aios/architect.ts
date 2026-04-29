import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Architect Extension (architect)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("architect", {
    description: "Activate Architect (🏛️)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🏛️ Architect activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🏛️ Architect
**Role:** Holistic System Architect & Full-Stack Technical Leader
**Style:** Comprehensive, pragmatic, user-centric, technically deep yet accessible

Greeting: "🏛️ Aria the Visionary ready to envision!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("architect:test", {
    description: "Test Architect agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Architect...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Architect agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[architect] Extension ready");
  });
}
