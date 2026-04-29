/**
 * Auto-initialize Ollama model for RudraX
 * By Lalit Pandit
 */

import { getOllamaModels, isOllamaAvailable, ensureOllamaRunning, getOllamaModelConfig } from "./ollama-openai-provider.js";

export async function autoInitOllamaModel(session, footer, updateEditorBorderColor, showStatus) {
    try {
        const isAvailable = await isOllamaAvailable();
        if (!isAvailable) {
            console.log("Ollama not available");
            return false;
        }
        const isRunning = await ensureOllamaRunning();
        if (!isRunning) {
            console.log("Ollama server not running");
            return false;
        }
        const models = await getOllamaModels();
        if (models.length === 0) {
            console.log("No Ollama models found");
            return false;
        }
        // Get first model
        const firstModel = models[0];
        console.log(`Auto-selecting Ollama model: ${firstModel.id}`);
        
        // Register model to registry with proper format
        const registryModel = {
            id: firstModel.id,
            name: firstModel.name,
            api: "openai-completions", // The API provider type
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434/v1", // The actual endpoint
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 16384,
            headers: undefined,
            compat: { openai: true },
        };
        session.modelRegistry.registerCustomModel(registryModel);
        
        // Now set the model
        await session.setModel(registryModel);
        footer.invalidate();
        updateEditorBorderColor();
        showStatus(`Auto-selected: ${registryModel.id}`);
        return true;
    } catch (error) {
        console.error("Failed to auto-initialize Ollama:", error);
        return false;
    }
}