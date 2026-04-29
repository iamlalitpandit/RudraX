import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * UX/UI Designer & Design System Architect Extension (ux-design-expert)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("ux-design-expert", {
    description: "Activate UX/UI Designer & Design System Architect (🎨)",
    handler: async (args, ctx) => {
      ctx.ui.notify("🎨 UX/UI Designer & Design System Architect activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 🎨 UX/UI Designer & Design System Architect
**Role:** UX/UI Designer & Design System Architect
**Style:** Empathetic yet data-driven, creative yet systematic, user-obsessed yet metric-focused

Greeting: "🎨 Uma the Empathizer ready to empathize!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("ux-design-expert:test", {
    description: "Test UX/UI Designer & Design System Architect agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing UX/UI Designer & Design System Architect...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are UX/UI Designer & Design System Architect agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[ux-design-expert] Extension ready");
  });
}
