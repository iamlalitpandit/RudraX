import { PROVIDER_CATALOG } from "../core/provider-catalog.js";

export const providerChoices = PROVIDER_CATALOG.map((provider) => ({
  id: provider.id,
  label: provider.label,
  apiKeyEnv: provider.env.apiKey?.[0],
  baseUrlEnv: provider.env.baseUrl?.[0],
  modelEnv: provider.env.model?.[0],
  defaultBaseUrl: provider.baseUrl,
  defaultModel: provider.models?.[0],
  noAuth: provider.noAuth,
}));

export const featureChoices = [
  { id: "skills", label: "RudraX skill library (349 skills)", default: true },
  { id: "browser", label: "Browser automation (Camofox, CDP, dialogs, supervisor)", default: true },
  { id: "web", label: "Web search and fetch tools", default: true },
  { id: "media", label: "Image, video, vision and TTS tools", default: true },
  { id: "memory", label: "Persistent and evolving memory", default: true },
  { id: "debug", label: "Debug and daemon tools", default: true },
  { id: "telegram", label: "Telegram gateway", default: false },
  { id: "whatsapp", label: "WhatsApp Baileys gateway", default: false },
];

export const featureEnvironment = {
  browser: ["RUDRAX_BROWSER_HEADLESS", "RUDRAX_CDP_URL", "RUDRAX_CAMOFOX_URL"],
  web: ["TAVILY_API_KEY", "FIRECRAWL_API_KEY", "EXA_API_KEY"],
  media: ["OPENAI_API_KEY", "FAL_KEY", "XAI_API_KEY", "RUDRAX_TTS_VOICE"],
  memory: ["RUDRAX_MEMORY_BACKEND", "RUDRAX_MEMORY_PATH"],
  debug: ["RUDRAX_DEBUG", "RUDRAX_DAEMON_WORKERS"],
  telegram: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ALLOWED_CHAT_IDS"],
  whatsapp: ["WHATSAPP_AUTH_DIR", "WHATSAPP_ALLOWED_NUMBERS"],
};
