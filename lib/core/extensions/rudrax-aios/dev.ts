import type { ExtensionAPI } from "@rudrax/pi-coding-agent";

/**
 * Full Stack Developer Extension (dev)
 * Converted from AIOX-Core
 */

export default function (pi: ExtensionAPI) {
  // Agent activation command
  pi.registerCommand("dev", {
    description: "Activate Full Stack Developer (💻)",
    handler: async (args, ctx) => {
      ctx.ui.notify("💻 Full Stack Developer activated!", "info");
      
      // Send activation message to session
      await ctx.sendMessage({
        role: "system",
        content: [{ 
          type: "text", 
          text: `## 💻 Full Stack Developer
**Role:** Expert Senior Software Engineer & Implementation Specialist
**Style:** Extremely concise, pragmatic, detail-oriented, solution-focused

Greeting: "💻 Dex the Builder ready to innovate!"

Agent is now active and ready to assist.
` 
        }]
      });
    },
  });

  // Test command
  pi.registerCommand("dev:test", {
    description: "Test Full Stack Developer agent",
    handler: async (args, ctx) => {
      ctx.ui.notify("🧪 Testing Full Stack Developer...", "info");
      
      await ctx.sendMessage({
        role: "user",
        content: [{ 
          type: "text", 
          text: "Say hello and confirm you are Full Stack Developer agent ready to work." 
        }]
      });
    },
  });

  // Session start - log readiness
  pi.on("session_start", async (event, ctx) => {
    console.log("[dev] Extension ready");
  });
}
