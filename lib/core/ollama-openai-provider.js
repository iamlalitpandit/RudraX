/**
 * Ollama OpenAI-Compatible Provider
 * Uses Ollama's /v1/chat/completions endpoint which is OpenAI-compatible
 * By Lalit Pandit
 */

import { spawn } from "child_process";

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable() {
    return new Promise((resolve) => {
        const check = spawn("which", ["ollama"], { stdio: "ignore" });
        check.on("close", (code) => resolve(code === 0));
        check.on("error", () => resolve(false));
    });
}

/**
 * Check if Ollama server is running
 */
export async function isOllamaServerRunning() {
    return new Promise((resolve) => {
        const check = spawn("curl", ["-s", "http://127.0.0.1:11434/api/tags"], { 
            stdio: "ignore",
            timeout: 3000
        });
        check.on("close", (code) => resolve(code === 0));
        check.on("error", () => resolve(false));
    });
}

/**
 * Start Ollama server if not running
 */
export async function ensureOllamaRunning() {
    const isRunning = await isOllamaServerRunning();
    if (isRunning) return true;
    
    // Try to start ollama serve
    return new Promise((resolve) => {
        const start = spawn("ollama", ["serve"], {
            detached: true,
            stdio: "ignore"
        });
        start.on("error", () => resolve(false));
        
        // Wait a bit and check again
        setTimeout(async () => {
            resolve(await isOllamaServerRunning());
        }, 2000);
    });
}

/**
 * Get Ollama models
 */
export async function getOllamaModels() {
    return new Promise((resolve, reject) => {
        const models = [];
        const ollamaList = spawn("ollama", ["list"], {
            stdio: ["ignore", "pipe", "pipe"]
        });
        
        let output = "";
        ollamaList.stdout.on("data", (data) => {
            output += data.toString();
        });
        
        ollamaList.on("close", (code) => {
            if (code !== 0) {
                reject(new Error("Failed to get Ollama models"));
                return;
            }
            
            const lines = output.split("\n").filter(line => line.trim());
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 1 && parts[0] && !parts[0].includes("NAME")) {
                    const modelName = parts[0];
                    const size = parts[2] || "unknown";
                    models.push({
                        id: modelName,
                        name: modelName,
                        size: size
                    });
                }
            }
            
            resolve(models);
        });
        
        ollamaList.on("error", (err) => reject(err));
    });
}

/**
 * Get model config for Ollama using OpenAI-compatible endpoint
 */
export function getOllamaModelConfig(modelId) {
    return {
        id: modelId,
        name: modelId,
        provider: "ollama", // Use Ollama provider for proper auth bypass
        api: "openai-completions", // The API provider type (OpenAI-compatible)
        baseUrl: "http://127.0.0.1:11434/v1", // The actual endpoint URL
        apiKey: "ollama", // Ollama doesn't need real API key but needs non-empty value
        noApiKeyRequired: true,
        description: `Ollama model: ${modelId}`,
        contextWindow: 32768,
        maxTokens: 16384,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        compat: { openai: true }
    };
}
