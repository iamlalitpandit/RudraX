/**
 * RudraX Ollama Integration
 * Provides local Ollama model selection and management
 * By Lalit Pandit
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Check if Ollama is installed and running
 */
export async function isOllamaAvailable() {
    return new Promise((resolve) => {
        const check = spawn("which", ["ollama"], { stdio: "ignore" });
        check.on("close", (code) => resolve(code === 0));
        check.on("error", () => resolve(false));
    });
}

/**
 * Get list of installed Ollama models
 * Runs: ollama list
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
            
            // Parse ollama list output
            // Format: NAME                ID          SIZE    MODIFIED
            const lines = output.split("\n").filter(line => line.trim());
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 1 && parts[0] && !parts[0].includes("NAME")) {
                    const modelName = parts[0];
                    const size = parts[2] || "unknown";
                    models.push({
                        id: modelName,
                        name: modelName,
                        provider: "ollama",
                        size: size
                    });
                }
            }
            
            resolve(models);
        });
        
        ollamaList.on("error", (err) => {
            reject(err);
        });
    });
}

/**
 * Get Ollama model configuration
 * Ollama models don't require API keys since they run locally
 */
export function getOllamaModelConfig(modelId) {
    return {
        id: modelId,
        name: modelId,
        provider: "ollama",
        api: "http://127.0.0.1:11434", // Ollama default endpoint
        apiKey: null, // No API key needed for local Ollama
        noApiKeyRequired: true, // Flag to skip API key validation
        description: `Local Ollama model: ${modelId}`,
        contextWindow: 32768,
        pricing: {
            input: 0,
            output: 0
        }
    };
}

/**
 * Select Ollama model interactively
 * Returns selected model ID
 */
export async function selectOllamaModel(models) {
    if (models.length === 0) {
        throw new Error("No Ollama models found. Run 'ollama pull <model>' to download models.");
    }
    
    // Format models for display
    const modelList = models.map((m, i) => `${i + 1}. ${m.name} (${m.size})`).join("\n");
    
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

export const OLLAMA_PROVIDER = {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run AI models locally with Ollama",
    isAvailable: isOllamaAvailable,
    getModels: getOllamaModels,
    getModelConfig: getOllamaModelConfig,
    isServerRunning: isOllamaServerRunning,
    ensureRunning: ensureOllamaRunning
};
