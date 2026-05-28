/**
 * RudraX Gemini Integration
 * Provides Google Gemini model selection and management
 * By Lalit Pandit - Gemini Adapter
 */

import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { getEnvApiKey, getModels, getProviders } from "@imlalitpandit/pi-ai";

/**
 * Get Gemini API key from environment variable or auth.json
 * Checks multiple sources:
 * 1. GEMINI_API_KEY env var (standard pi-ai env)
 * 2. auth.json under "google" provider
 * 3. auth.json legacy "GOOGLE_API_KEY" flat key
 * 4. GOOGLE_API_KEY env var (legacy fallback)
 */
export function getGeminiApiKey() {
  // 1. Check pi-ai's standard env var
  const piEnvKey = getEnvApiKey("google");
  if (piEnvKey) return piEnvKey;

  // 2. Check process env directly
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  // 3. Check auth.json
  try {
    const authPath = join(homedir(), ".rudrax", "agent", "auth.json");
    if (existsSync(authPath)) {
      const authData = JSON.parse(readFileSync(authPath, "utf-8"));
      
      // Check "google" provider format: {"google": {"type": "api_key", "key": "..."}}
      if (authData.google?.key) return authData.google.key;
      
      // Check legacy flat format: {"GOOGLE_API_KEY": "..."}
      if (authData.GOOGLE_API_KEY && typeof authData.GOOGLE_API_KEY === "string") {
        return authData.GOOGLE_API_KEY;
      }
    }
  } catch (e) {
    // Silently ignore - auth.json may not exist yet
  }

  return undefined;
}

/**
 * Check if Gemini API key is available
 */
export function isGeminiAvailable() {
  const key = getGeminiApiKey();
  return !!key && key.length > 0;
}

/**
 * Get list of available Gemini models from pi-ai built-in provider
 */
export function getGeminiModels() {
  try {
    const googleModels = getModels("google");
    return googleModels.map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: "google",
      api: "google-generative-ai",
      baseUrl: m.baseUrl,
      reasoning: m.reasoning || false,
      input: m.input || ["text", "image"],
      cost: m.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: m.contextWindow || 1048576,
      maxTokens: m.maxTokens || 65536,
      description: `Gemini model: ${m.name || m.id}`,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Get Gemini model configuration
 */
export function getGeminiModelConfig(modelId, modelName) {
  const models = getGeminiModels();
  const found = models.find(m => m.id === modelId);
  if (found) return found;

  // Fallback: create default config
  return {
    id: modelId,
    name: modelName || modelId,
    provider: "google",
    api: "google-generative-ai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    reasoning: modelId.includes("2.5") || modelId.includes("3."),
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1048576,
    maxTokens: 65536,
    description: `Gemini model: ${modelName || modelId}`,
  };
}

/**
 * Select Gemini model interactively
 * Returns selected model
 */
export function selectGeminiModel(models) {
  if (models.length === 0) {
    throw new Error("No Gemini models available. Set your GEMINI_API_KEY environment variable or add it to auth.json.");
  }

  const modelList = models.map((m, i) => `${i + 1}. ${m.name} (${m.id})${m.reasoning ? " [thinking]" : ""}`).join("\n");

  return {
    models,
    formatted: modelList,
    select: (index) => {
      if (index >= 0 && index < models.length) {
        return models[index];
      }
      throw new Error("Invalid model selection");
    }
  };
}

/**
 * Register Gemini API key to auth.json in the proper format
 */
export async function setGeminiApiKey(apiKey) {
  try {
    const authDir = join(homedir(), ".rudrax", "agent");
    const authPath = join(authDir, "auth.json");
    
    let authData = {};
    if (existsSync(authPath)) {
      authData = JSON.parse(readFileSync(authPath, "utf-8"));
    }
    
    // Store in the proper "google" provider format
    authData.google = {
      type: "api_key",
      key: apiKey,
    };
    
    // Also clean up legacy flat key if present
    delete authData.GOOGLE_API_KEY;
    
    const { writeFileSync, mkdirSync } = await import("fs");
    if (!existsSync(authDir)) {
      mkdirSync(authDir, { recursive: true });
    }
    writeFileSync(authPath, JSON.stringify(authData, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to save Gemini API key:", e);
    return false;
  }
}

export const GEMINI_PROVIDER = {
  id: "google",
  name: "Google Gemini",
  description: "Google Gemini models via API key",
  isAvailable: isGeminiAvailable,
  getModels: getGeminiModels,
  getModelConfig: getGeminiModelConfig,
  getApiKey: getGeminiApiKey,
  setApiKey: setGeminiApiKey,
};
