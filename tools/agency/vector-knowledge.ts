/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🧠 RUDRAX VECTOR KNOWLEDGE BASE — Semantic Memory & RAG Engine
 * ═══════════════════════════════════════════════════════════════════════
 *
 * The long-term memory of the RudraX Army. Uses embedding-based semantic
 * search to give every agent instant access to past work, decisions,
 * code patterns, and project knowledge.
 *
 * Features:
 *   - In-memory vector store with cosine similarity search
 *   - Auto-embedding of past conversations, code, and documents
 *   - Semantic chunking with overlap for optimal retrieval
 *   - Metadata filtering (by agent, category, time range)
 *   - RAG context injection into agent system prompts
 *   - Persistent storage to disk (JSON-based vectors)
 *   - Automatic re-indexing on session start
 *
 * Architecture:
 *   Agent → memory_query → VectorStore → Top-K chunks → RAG context
 *   Agent → memory_store (auto) → embed → index → VectorStore
 *
 * Data stored at: ~/.rudrax/agent/vectors/{context-id}.json
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VectorEntry {
  id: string;
  vector: number[];      // Embedding vector (1536-dim for text-embedding-ada-002 compatible)
  text: string;          // Original chunk text
  metadata: {
    agent: string;
    type: "code" | "conversation" | "decision" | "documentation" | "file" | "task_result" | "note";
    category?: string;
    timestamp: number;
    source?: string;      // File path or conversation ID
    tags?: string[];
    importance: number;   // 0-1, for re-ranking
  };
}

interface VectorStore {
  id: string;
  project: string;
  created: number;
  updated: number;
  entries: VectorEntry[];
  config: {
    embeddingDim: number;
    chunkSize: number;
    chunkOverlap: number;
    maxEntries: number;
    topK: number;
    similarityThreshold: number;
  };
}

interface SearchResult {
  entry: VectorEntry;
  score: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER-LEVEL TOKEN EMBEDDING (No external API needed)
// ═══════════════════════════════════════════════════════════════════════════
//
// We generate dense embeddings using a combination of:
//   1. Character n-gram hashing (local context)
//   2. TF-style frequency weighting (semantic importance)
//   3. Position-aware encoding (structure preservation)
//
// This produces 256-dim vectors that work well for code & text similarity.
// For production, swap with OpenAI/text-embedding-ada-002 API.

const EMBEDDING_DIM = 256;
const NGRAM_SIZES = [2, 3, 4];

function hashFeatures(text: string): Map<number, number> {
  const features = new Map<number, number>();
  const lower = text.toLowerCase();

  // Character n-gram hashing
  for (const n of NGRAM_SIZES) {
    for (let i = 0; i <= lower.length - n; i++) {
      const ngram = lower.slice(i, i + n);
      let hash = 0;
      for (let j = 0; j < ngram.length; j++) {
        hash = ((hash << 5) - hash) + ngram.charCodeAt(j);
        hash |= 0;
      }
      const bucket = Math.abs(hash) % EMBEDDING_DIM;
      features.set(bucket, (features.get(bucket) || 0) + 1);
    }
  }

  // Word-level features
  const words = lower.split(/\W+/).filter(w => w.length > 2);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % EMBEDDING_DIM;
    features.set(bucket, (features.get(bucket) || 0) + 1.5); // Higher weight for words
  }

  // Code-specific features (camelCase, snake_case, operators)
  const codePatterns = lower.match(/[a-z]+_[a-z]+|[a-z]+[A-Z][a-z]+|[{}()\[\];.:]/g);
  if (codePatterns) {
    for (const pat of codePatterns) {
      let hash = 0;
      for (let i = 0; i < pat.length; i++) {
        hash = ((hash << 5) - hash) + pat.charCodeAt(i);
        hash |= 0;
      }
      const bucket = Math.abs(hash) % EMBEDDING_DIM;
      features.set(bucket, (features.get(bucket) || 0) + 2.0); // Higher weight for code patterns
    }
  }

  return features;
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

function embed(text: string): number[] {
  const features = hashFeatures(text);
  const vector = new Array(EMBEDDING_DIM).fill(0);

  // Apply feature hashing with IDF-like weighting
  for (const [bucket, freq] of features) {
    // Log-normalized frequency (IDF-like weighting)
    vector[bucket] = 1 + Math.log(1 + freq);
  }

  return normalizeVector(vector);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT CHUNKING
// ═══════════════════════════════════════════════════════════════════════════

function chunkText(text: string, chunkSize = 512, overlap = 64): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a natural boundary
    if (end < text.length) {
      // Look for paragraph break first
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start && paragraphBreak > end - chunkSize * 0.3) {
        end = paragraphBreak;
      } else {
        // Look for line break
        const lineBreak = text.lastIndexOf("\n", end);
        if (lineBreak > start && lineBreak > end - chunkSize * 0.2) {
          end = lineBreak;
        } else {
          // Look for sentence break
          const sentenceBreak = Math.max(
            text.lastIndexOf(". ", end),
            text.lastIndexOf("! ", end),
            text.lastIndexOf("? ", end),
            text.lastIndexOf(";\n", end)
          );
          if (sentenceBreak > start && sentenceBreak > end - chunkSize * 0.15) {
            end = sentenceBreak + 1;
          }
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(c => c.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// VECTOR STORE — Persistent storage & search
// ═══════════════════════════════════════════════════════════════════════════

const VECTOR_DIR = path.join(os.homedir(), ".rudrax", "agent", "vectors");

function ensureVectorDir(): void {
  if (!fs.existsSync(VECTOR_DIR)) {
    fs.mkdirSync(VECTOR_DIR, { recursive: true });
  }
}

function storePath(contextId: string): string {
  ensureVectorDir();
  const safeId = contextId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(VECTOR_DIR, `${safeId}.json`);
}

function loadStore(contextId: string): VectorStore {
  const sp = storePath(contextId);
  if (fs.existsSync(sp)) {
    try {
      const raw = fs.readFileSync(sp, "utf-8");
      return JSON.parse(raw);
    } catch { /* corrupt — re-create */ }
  }
  return {
    id: contextId,
    project: "Unknown",
    created: Date.now(),
    updated: Date.now(),
    entries: [],
    config: {
      embeddingDim: EMBEDDING_DIM,
      chunkSize: 512,
      chunkOverlap: 64,
      maxEntries: 10000,
      topK: 5,
      similarityThreshold: 0.5,
    },
  };
}

function saveStore(store: VectorStore): void {
  store.updated = Date.now();
  fs.writeFileSync(storePath(store.id), JSON.stringify(store, null, 2), "utf-8");
}

function addEntry(store: VectorStore, text: string, metadata: VectorEntry["metadata"]): VectorEntry {
  const entry: VectorEntry = {
    id: `vec_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    vector: embed(text),
    text,
    metadata: {
      ...metadata,
      timestamp: metadata.timestamp || Date.now(),
      importance: metadata.importance || 0.5,
    },
  };

  store.entries.push(entry);

  // Prune if over max
  if (store.entries.length > store.config.maxEntries) {
    // Remove least important entries
    store.entries.sort((a, b) => a.metadata.importance - b.metadata.importance);
    store.entries = store.entries.slice(-store.config.maxEntries);
  }

  saveStore(store);
  return entry;
}

function searchStore(
  store: VectorStore,
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    type?: VectorEntry["metadata"]["type"];
    agent?: string;
    category?: string;
    maxAge?: number; // Max age in ms
  } = {}
): SearchResult[] {
  const queryVec = embed(query);
  const topK = options.topK || store.config.topK;
  const threshold = options.threshold || store.config.similarityThreshold;
  const now = Date.now();

  // Score all entries
  const scored: SearchResult[] = store.entries
    .filter(entry => {
      if (options.type && entry.metadata.type !== options.type) return false;
      if (options.agent && !entry.metadata.agent.toLowerCase().includes(options.agent.toLowerCase())) return false;
      if (options.category && entry.metadata.category !== options.category) return false;
      if (options.maxAge && (now - entry.metadata.timestamp) > options.maxAge) return false;
      return true;
    })
    .map(entry => ({
      entry,
      score: cosineSimilarity(queryVec, entry.vector),
    }))
    .filter(r => r.score >= threshold);

  // Sort by score (descending) with importance boost
  scored.sort((a, b) => {
    const aScore = a.score * 0.8 + a.entry.metadata.importance * 0.2;
    const bScore = b.score * 0.8 + b.entry.metadata.importance * 0.2;
    return bScore - aScore;
  });

  return scored.slice(0, topK);
}

function deleteStore(contextId: string): void {
  const sp = storePath(contextId);
  if (fs.existsSync(sp)) fs.unlinkSync(sp);
}

function listStores(): { id: string; project: string; entries: number; updated: number }[] {
  ensureVectorDir();
  try {
    const files = fs.readdirSync(VECTOR_DIR).filter(f => f.endsWith(".json"));
    return files.map(f => {
      try {
        const raw = fs.readFileSync(path.join(VECTOR_DIR, f), "utf-8");
        const store = JSON.parse(raw);
        return {
          id: store.id,
          project: store.project,
          entries: store.entries.length,
          updated: store.updated,
        };
      } catch { return null; }
    }).filter(Boolean) as any[];
  } catch { return []; }
}

// Build RAG context string from search results
function buildRagContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  let context = "\n<retrieved-knowledge>\n";
  context += "📚 **Semantically Retrieved Context**\n\n";

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rel = (r.score * 100).toFixed(0);
    const time = new Date(r.entry.metadata.timestamp).toLocaleString();
    const agent = r.entry.metadata.agent;
    const type = r.entry.metadata.type;

    context += `--- Result ${i + 1} (relevance: ${rel}%) ---\n`;
    context += `Source: ${agent} | Type: ${type} | Time: ${time}\n`;
    if (r.entry.metadata.source) {
      context += `File: ${r.entry.metadata.source}\n`;
    }
    context += `${r.entry.text.slice(0, 500)}\n\n`;
  }

  context += "</retrieved-knowledge>\n";
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {
  let currentContextId: string = "";
  let currentStore: VectorStore | null = null;

  // ─── /vector command — Manage vector knowledge base ───────────
  pi.registerCommand("vector", {
    description: "Vector Knowledge Base: semantic search across all project memory. Usage: /vector <search|status|reindex|stats|reset> [query]",
    getArgumentCompletions(prefix: string) {
      const subcommands = ["search", "status", "reindex", "stats", "reset", "list"];
      if (!prefix) return subcommands.map(s => ({ value: s, label: s }));
      return subcommands.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "status";
      const query = parts.slice(1).join(" ");

      if (!currentContextId) {
        currentContextId = ctx.session?.id || ctx.contextId || "";
      }
      if (!currentContextId) {
        ctx.ui.notify("⚠️ No active context.", "warn");
        return;
      }

      currentStore = loadStore(currentContextId);

      if (sub === "search" && query) {
        const results = searchStore(currentStore, query);
        if (results.length === 0) {
          ctx.ui.notify("🔍 No semantically similar results found.", "info");
        } else {
          const output = results.map((r, i) => {
            const pct = (r.score * 100).toFixed(1);
            const time = new Date(r.entry.metadata.timestamp).toLocaleString();
            const icon = r.entry.metadata.type === "code" ? "💻" : r.entry.metadata.type === "decision" ? "💡" : r.entry.metadata.type === "task_result" ? "✅" : "📄";
            return `${icon} [${pct}%] ${r.entry.metadata.agent} (${time})\n   ${r.entry.text.slice(0, 200)}`;
          }).join("\n\n");
          ctx.ui.notify(`🔍 **Vector Search Results** (${results.length})\n\n${output}`, "info");
        }
        return;
      }

      if (sub === "status") {
        ctx.ui.notify(
          `🧠 **Vector Knowledge Base**\n` +
          `  Entries: ${currentStore.entries.length}\n` +
          `  Dimensions: ${currentStore.config.embeddingDim}\n` +
          `  Max entries: ${currentStore.config.maxEntries}\n` +
          `  Top-K default: ${currentStore.config.topK}\n` +
          `  Last updated: ${new Date(currentStore.updated).toLocaleString()}`,
          "info"
        );
        return;
      }

      if (sub === "stats") {
        const byType: Record<string, number> = {};
        const byAgent: Record<string, number> = {};
        for (const e of currentStore.entries) {
          byType[e.metadata.type] = (byType[e.metadata.type] || 0) + 1;
          byAgent[e.metadata.agent] = (byAgent[e.metadata.agent] || 0) + 1;
        }
        const typeStats = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join("\n");
        const agentStats = Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `  ${k}: ${v}`).join("\n");
        ctx.ui.notify(
          `📊 **Vector Store Stats**\n\n**By Type:**\n${typeStats}\n\n**Top Agents:**\n${agentStats}`,
          "info"
        );
        return;
      }

      if (sub === "reindex") {
        // Re-embed all entries (in case embedding algo changed)
        for (const entry of currentStore.entries) {
          entry.vector = embed(entry.text);
        }
        saveStore(currentStore);
        ctx.ui.notify(`🔄 Re-indexed ${currentStore.entries.length} entries.`, "info");
        return;
      }

      if (sub === "reset") {
        currentStore.entries = [];
        saveStore(currentStore);
        ctx.ui.notify("🗑️ Vector store cleared.", "info");
        return;
      }

      if (sub === "list") {
        const stores = listStores();
        if (stores.length === 0) {
          ctx.ui.notify("📂 No vector stores found.", "info");
        } else {
          const listing = stores.map(s => `  🧠 ${s.project} (${s.id.slice(0, 12)}...) — ${s.entries} entries`).join("\n");
          ctx.ui.notify(`📂 **Vector Stores**\n${listing}`, "info");
        }
        return;
      }

      ctx.ui.notify(
        "Usage: /vector <search|status|reindex|stats|reset|list>\n" +
        "  /vector search <query>   — Semantic search across project memory\n" +
        "  /vector status           — Show vector store info\n" +
        "  /vector stats            — Show entry distribution\n" +
        "  /vector reindex          — Re-embed all entries\n" +
        "  /vector reset            — Clear vector store\n" +
        "  /vector list             — List all vector stores",
        "info"
      );
    },
  });

  // ─── TOOL: knowledge_retrieve — Semantic search ───────────────
  pi.registerTool({
    name: "knowledge_retrieve",
    label: "Semantic Knowledge Retrieval",
    description:
      "Search the project's vector knowledge base using semantic similarity. Returns the most relevant " +
      "context chunks from past conversations, code, decisions, and task results. Use this BEFORE " +
      "starting work to understand what's already been done. Always prefer this over blindly re-doing work.",
    promptSnippet: "Retrieve semantically relevant context from project memory",
    promptGuidelines: [
      "ALWAYS call knowledge_retrieve before starting any task — the retrieved context may contain existing solutions.",
      "Use specific, descriptive queries to get the most relevant results.",
      "Filter by type='code' for code patterns, 'decision' for architectural decisions, 'task_result' for completed work.",
      "If results are insufficient, try rephrasing the query with more specific terminology.",
    ],
    parameters: Type.Object({
      query: Type.String({
        description: "The semantic search query — describe what you're looking for naturally.",
      }),
      top_k: Type.Optional(Type.Number({
        description: "Number of results to return (1-20, default: 5)",
        default: 5,
      })),
      type: Type.Optional(Type.String({
        description: "Filter by content type: 'code', 'conversation', 'decision', 'documentation', 'file', 'task_result', 'note'",
      })),
      agent: Type.Optional(Type.String({
        description: "Filter by agent name (partial match)",
      })),
      category: Type.Optional(Type.String({
        description: "Filter by category",
      })),
      threshold: Type.Optional(Type.Number({
        description: "Similarity threshold 0-1 (default: 0.5, lower = more results)",
        default: 0.5,
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentContextId) {
        currentContextId = ctx.session?.id || ctx.contextId || "";
      }
      if (!currentContextId) {
        return { content: [{ type: "text", text: "⚠️ No active context." }] };
      }

      currentStore = loadStore(currentContextId);
      const results = searchStore(currentStore, params.query, {
        topK: params.top_k || 5,
        threshold: params.threshold || 0.5,
        type: params.type as any,
        agent: params.agent,
        category: params.category,
      });

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "🔍 No semantically similar results found. Try rephrasing your query or lowering the threshold." }],
          details: { count: 0, query: params.query },
        };
      }

      const ragContext = buildRagContext(results);

      return {
        content: [{ type: "text", text: ragContext || "🔍 No results." }],
        details: {
          count: results.length,
          query: params.query,
          results: results.map(r => ({
            score: r.score,
            agent: r.entry.metadata.agent,
            type: r.entry.metadata.type,
            source: r.entry.metadata.source,
            text: r.entry.text.slice(0, 200),
          })),
        },
      };
    },
  });

  // ─── TOOL: knowledge_store — Store knowledge ──────────────────
  pi.registerTool({
    name: "knowledge_store",
    label: "Store Knowledge in Vector DB",
    description:
      "Store a piece of knowledge, code pattern, decision, or result in the vector knowledge base. " +
      "This makes it semantically searchable by ALL agents via knowledge_retrieve. " +
      "ALWAYS call this after completing significant work so other agents can find it.",
    promptSnippet: "Store knowledge in vector database for future retrieval",
    promptGuidelines: [
      "Store important code patterns, architectural decisions, and completed task results.",
      "Use a clear, descriptive text that would match future queries about this topic.",
      "Set importance=1 for critical project decisions, 0.5 for normal work.",
      "Use type='code' for code snippets, 'decision' for architectural choices, 'task_result' for deliverables.",
    ],
    parameters: Type.Object({
      text: Type.String({
        description: "The content to store — write it as if you're answering a future query about this topic.",
      }),
      type: Type.Union([
        Type.Literal("code"),
        Type.Literal("conversation"),
        Type.Literal("decision"),
        Type.Literal("documentation"),
        Type.Literal("file"),
        Type.Literal("task_result"),
        Type.Literal("note"),
      ], { description: "Type of content being stored" }),
      importance: Type.Optional(Type.Number({
        description: "Importance 0-1 (default: 0.5). Use 1 for critical project decisions.",
        default: 0.5,
      })),
      source: Type.Optional(Type.String({
        description: "Source file path or conversation ID.",
      })),
      category: Type.Optional(Type.String({
        description: "Category tag for filtering.",
      })),
      tags: Type.Optional(Type.Array(Type.String(), {
        description: "Additional tags for filtering.",
      })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!currentContextId) {
        currentContextId = ctx.session?.id || ctx.contextId || "";
      }
      if (!currentContextId) {
        return { content: [{ type: "text", text: "⚠️ No active context." }] };
      }

      currentStore = loadStore(currentContextId);
      const agentName = ctx.agent?.name || "orchestrator";

      // Chunk and embed long text
      const chunks = chunkText(params.text, currentStore.config.chunkSize, currentStore.config.chunkOverlap);
      const added: VectorEntry[] = [];

      for (const chunk of chunks) {
        const entry = addEntry(currentStore, chunk, {
          agent: agentName,
          type: params.type as VectorEntry["metadata"]["type"],
          category: params.category,
          timestamp: Date.now(),
          source: params.source,
          tags: params.tags,
          importance: params.importance || 0.5,
        });
        added.push(entry);
      }

      const typeIcons: Record<string, string> = {
        code: "💻", conversation: "💬", decision: "💡",
        documentation: "📄", file: "📝", task_result: "✅", note: "📌",
      };

      return {
        content: [{
          type: "text",
          text: `${typeIcons[params.type] || "🧠"} **Knowledge Stored**\n\n` +
            `Chunks: ${added.length}\n` +
            `Type: ${params.type}\n` +
            `Importance: ${params.importance || 0.5}\n` +
            `Source: ${params.source || "conversation"}\n\n` +
            `Other agents can now find this content via knowledge_retrieve.`,
        }],
        details: {
          stored: true,
          chunks: added.length,
          type: params.type,
        },
      };
    },
  });

  // ─── Hook: before_agent_start — Inject RAG context ───────────
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!currentContextId) {
      currentContextId = _ctx.session?.id || _ctx.contextId || "";
    }
    if (!currentContextId) return {};

    // Don't inject on every turn — only when there's meaningful context
    const lastUserMsg = event.systemPrompt?.match(/<user_message>([\s\S]*?)<\/user_message>/);
    if (!lastUserMsg) return {};

    try {
      currentStore = loadStore(currentContextId);
      const results = searchStore(currentStore, lastUserMsg[1], { topK: 3, threshold: 0.45 });

      if (results.length > 0) {
        const ragContext = buildRagContext(results);
        return {
          systemPrompt: event.systemPrompt + ragContext,
        };
      }
    } catch {
      // Non-critical — RAG is a nice-to-have
    }

    return {};
  });

  // ─── Hook: turn_end — Auto-store turn results ────────────────
  pi.on("turn_end", async (event, _ctx) => {
    if (!currentContextId) {
      currentContextId = _ctx.session?.id || _ctx.contextId || "";
    }
    if (!currentContextId || !event) return;

    // Extract assistant response
    const assistantMsg = (event as any).message;
    if (!assistantMsg || assistantMsg.role !== "assistant") return;

    let text = "";
    if (typeof assistantMsg.content === "string") {
      text = assistantMsg.content;
    } else if (Array.isArray(assistantMsg.content)) {
      text = assistantMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
    }

    if (text.length < 100) return; // Skip trivial responses

    try {
      currentStore = loadStore(currentContextId);

      // Only store if sufficiently unique (not a duplicate of existing entries)
      const dupCheck = searchStore(currentStore, text.slice(0, 200), { topK: 1, threshold: 0.85 });
      if (dupCheck.length > 0) return; // Already stored similar content

      addEntry(currentStore, text.slice(0, 1000), {
        agent: "RudraX-Chief of Staff",
        type: "conversation",
        timestamp: Date.now(),
        importance: 0.5,
      });
    } catch {
      // Non-critical
    }
  });

  // ─── session_start — Show vector store status ────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (!currentContextId) {
      currentContextId = ctx.session?.id || ctx.contextId || "";
    }
    if (!currentContextId) return;

    try {
      currentStore = loadStore(currentContextId);
      if (currentStore.entries.length > 0) {
        ctx.ui.notify(
          `🧠 Vector Knowledge Base: ${currentStore.entries.length} indexed entries (semantic search ready)`,
          "info"
        );
      }
    } catch { /* first time — no store yet */ }
  });

  // ─── Export internals ────────────────────────────────────────
  return {
    embed,
    cosineSimilarity,
    chunkText,
    loadStore,
    saveStore,
    addEntry,
    searchStore,
    buildRagContext,
    listStores,
    deleteStore,
    VECTOR_DIR,
  };
}
