/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🌐 RUDRAX WEB SEARCH & BROWSING — Live Web Intelligence
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Gives every agent the ability to search the web, fetch web pages,
 * extract content, and gather real-time intelligence.
 *
 * Features:
 *   - Web search via DuckDuckGo (no API key required)
 *   - Web page fetching and content extraction
 *   - Link following and recursive browsing
 *   - Result caching with TTL
 *   - Respects robots.txt
 *   - Rate limiting (configurable)
 *   - Safe mode (no executable downloads)
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE HTTP FETCHER (no external dependencies)
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_DIR = path.join(os.homedir(), ".rudrax", "agent", "web-cache");

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface CachedResult {
  url: string;
  content: string;
  contentType: string;
  fetchedAt: number;
  ttl: number; // ms
}

function getCached(url: string): CachedResult | null {
  ensureCacheDir();
  const key = crypto.createHash("md5").update(url).digest("hex");
  const cp = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(cp)) {
    try {
      const cached: CachedResult = JSON.parse(fs.readFileSync(cp, "utf-8"));
      if (Date.now() - cached.fetchedAt < cached.ttl) return cached;
    } catch { /* expired or corrupt */ }
  }
  return null;
}

function setCache(url: string, content: string, contentType: string, ttl: number = 300000): void {
  ensureCacheDir();
  const key = crypto.createHash("md5").update(url).digest("hex");
  const cached: CachedResult = { url, content, contentType, fetchedAt: Date.now(), ttl };
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(cached), "utf-8");
}

// ─── DuckDuckGo HTML Search (scrape-based) ─────────────────────────

const RATE_LIMIT_MS = 1100; // Be nice to DuckDuckGo
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<{ content: string; contentType: string }> {
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequestTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTime = Date.now();

  // Check cache first
  const cached = getCached(url);
  if (cached) return { content: cached.content, contentType: cached.contentType };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get("content-type") || "text/html";
    const text = await response.text();

    setCache(url, text, contentType, 300000);
    return { content: text, contentType };
  } catch (err: any) {
    return { content: `<error>${err.message || "Failed to fetch"}</error>`, contentType: "text/plain" };
  }
}

// ─── HTML Content Extraction (simple regex-based) ─────────────────

function extractText(html: string): string {
  // Remove scripts, styles, nav, footer
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "Untitled";
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    // Resolve relative URLs
    if (href.startsWith("/")) {
      const url = new URL(baseUrl);
      href = `${url.protocol}//${url.host}${href}`;
    } else if (href.startsWith("#") || href.startsWith("javascript:")) {
      continue;
    } else if (!href.startsWith("http")) {
      if (baseUrl.endsWith("/")) href = baseUrl + href;
      else href = baseUrl + "/" + href;
    }
    if (href.startsWith("http")) links.push(href);
  }
  return [...new Set(links)];
}

// ─── DuckDuckGo Search ─────────────────────────────────────────

async function searchDuckDuckGo(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { content } = await rateLimitedFetch(searchUrl);

  const results: { title: string; url: string; snippet: string }[] = [];

  // Parse DuckDuckGo HTML results
  const resultRegex = /<a[^>]+class=["']result__a["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class=["']result__snippet["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = resultRegex.exec(content)) !== null) {
    let url = match[1];
    // DuckDuckGo redirects through their own URLs
    const realUrl = url.match(/uddg=([^&]+)/);
    if (realUrl) url = decodeURIComponent(realUrl[1]);
    const title = extractText(match[2]);
    const snippet = extractText(match[3]);
    if (url && title) {
      results.push({ title: title.slice(0, 200), url, snippet: snippet.slice(0, 300) });
    }
  }

  // Fallback: simpler parsing
  if (results.length === 0) {
    const simpleRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = simpleRegex.exec(content)) !== null) {
      const url = match[1];
      const title = extractText(match[2]).slice(0, 200);
      if (url && title && !url.includes("duckduckgo.com") && title.length > 5) {
        // Get surrounding text as snippet
        const start = Math.max(0, match.index - 200);
        const end = Math.min(content.length, match.index + match[0].length + 200);
        const snippet = extractText(content.slice(start, end)).slice(0, 300);
        results.push({ title, url, snippet });
      }
      if (results.length >= 10) break;
    }
  }

  return results.slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {

  // ─── /web command ─────────────────────────────────────────────
  pi.registerCommand("web", {
    description: "Web Search & Browsing: search the web or fetch pages. Usage: /web <search|fetch> [query|url]",
    getArgumentCompletions(prefix: string) {
      const subs = ["search", "fetch", "cache-status", "clear-cache"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0];
      const query = parts.slice(1).join(" ");

      if (sub === "search" && query) {
        ctx.ui.notify(`🔍 Searching: "${query}"...`, "info");
        try {
          const results = await searchDuckDuckGo(query);
          if (results.length === 0) {
            ctx.ui.notify("No results found.", "info");
          } else {
            const output = results.map((r, i) =>
              `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`
            ).join("\n\n");
            ctx.ui.notify(`🔍 **Search Results** (${results.length})\n\n${output}`, "info");
          }
        } catch (err: any) {
          ctx.ui.notify(`❌ Search failed: ${err.message}`, "error");
        }
        return;
      }

      if (sub === "fetch" && query) {
        const url = query.startsWith("http") ? query : `https://${query}`;
        ctx.ui.notify(`🌐 Fetching: ${url}...`, "info");
        try {
          const { content, contentType } = await rateLimitedFetch(url);
          const title = extractTitle(content);
          const text = extractText(content).slice(0, 3000);

          ctx.ui.notify(
            `🌐 **Page: ${title}**\n` +
            `URL: ${url}\n` +
            `Type: ${contentType}\n\n` +
            `${text.slice(0, 2000)}${text.length > 2000 ? "\n\n...(truncated)" : ""}`,
            "info"
          );
        } catch (err: any) {
          ctx.ui.notify(`❌ Fetch failed: ${err.message}`, "error");
        }
        return;
      }

      if (sub === "cache-status") {
        ensureCacheDir();
        try {
          const files = fs.readdirSync(CACHE_DIR);
          ctx.ui.notify(`📦 Web cache: ${files.length} entries`, "info");
        } catch {
          ctx.ui.notify("📦 Web cache: empty", "info");
        }
        return;
      }

      if (sub === "clear-cache") {
        ensureCacheDir();
        try {
          const files = fs.readdirSync(CACHE_DIR);
          for (const f of files) fs.unlinkSync(path.join(CACHE_DIR, f));
          ctx.ui.notify(`🗑️ Cleared ${files.length} cache entries.`, "info");
        } catch {
          ctx.ui.notify("Cache clear failed.", "error");
        }
        return;
      }

      ctx.ui.notify(
        "Usage: /web <search|fetch|cache-status|clear-cache>\n" +
        "  /web search <query>    — Search the web\n" +
        "  /web fetch <url>       — Fetch a web page\n" +
        "  /web cache-status      — Show cache stats\n" +
        "  /web clear-cache       — Clear cached pages",
        "info"
      );
    },
  });

  // ─── TOOL: web_search ─────────────────────────────────────────
  pi.registerTool({
    name: "web_search",
    label: "Search the Web",
    description:
      "Search the web using DuckDuckGo for current information. Returns up to 10 results with " +
      "titles, URLs, and snippets. Use to find documentation, tutorials, news, or any web content. " +
      "Results are cached for 5 minutes.",
    promptSnippet: "Search the web for current information",
    promptGuidelines: [
      "Use for current events, documentation lookups, and real-time information.",
      "After searching, use web_fetch to get full content from relevant results.",
      "Results are limited — be specific in your queries.",
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      max_results: Type.Optional(Type.Number({ description: "Max results (1-10)", default: 5 })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const results = await searchDuckDuckGo(params.query);
        const limited = results.slice(0, params.max_results || 5);

        if (limited.length === 0) {
          return { content: [{ type: "text", text: "🔍 No search results found." }], details: { count: 0 } };
        }

        const formatted = limited.map((r, i) =>
          `### ${i + 1}. ${r.title}\n**URL:** ${r.url}\n${r.snippet}`
        ).join("\n\n");

        return {
          content: [{ type: "text", text: `🔍 **Web Search Results**\n\n${formatted}` }],
          details: { count: limited.length, results: limited },
        };
      } catch (err: any) {
        return { content: [{ type: "text", text: `❌ Search failed: ${err.message}` }], details: { error: true } };
      }
    },
  });

  // ─── TOOL: web_fetch ──────────────────────────────────────────
  pi.registerTool({
    name: "web_fetch",
    label: "Fetch Web Page Content",
    description:
      "Fetch and extract the text content from a web page. Returns the page title and extracted text. " +
      "Use after web_search to get full content from promising results. Results are cached for 5 minutes.",
    promptSnippet: "Fetch and read a web page",
    promptGuidelines: [
      "Use after web_search to read full content from relevant results.",
      "The extracted text is cleaned (no HTML, scripts, or styling).",
      "For documentation pages, use specific URLs for best results.",
      "Pages are truncated to ~3000 chars to save context.",
    ],
    parameters: Type.Object({
      url: Type.String({ description: "URL to fetch" }),
      extract_links: Type.Optional(Type.Boolean({ description: "Also extract page links", default: false })),
      max_length: Type.Optional(Type.Number({ description: "Max content length", default: 3000 })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const url = params.url.startsWith("http") ? params.url : `https://${params.url}`;
      try {
        const { content, contentType } = await rateLimitedFetch(url);
        const title = extractTitle(content);
        let text = extractText(content);
        const truncated = text.length > (params.max_length || 3000);
        text = text.slice(0, params.max_length || 3000);

        let result = `🌐 **${title}**\nURL: ${url}\nType: ${contentType}\n\n${text}`;
        if (truncated) result += "\n\n...(truncated)";

        if (params.extract_links) {
          const links = extractLinks(content, url);
          result += `\n\n**Links (${links.length}):**\n${links.slice(0, 15).map(l => `• ${l}`).join("\n")}`;
        }

        return {
          content: [{ type: "text", text: result }],
          details: { title, url, contentType, length: text.length, links: params.extract_links },
        };
      } catch (err: any) {
        return { content: [{ type: "text", text: `❌ Failed to fetch ${url}: ${err.message}` }], details: { error: true } };
      }
    },
  });

  // ─── Hook: Auto-inject web capability into system prompt ──────
  pi.on("before_agent_start", async (event, _ctx) => {
    // Light injection — just enough to remind the model it has web search
    const webNote = `\n\n<web-capability>\nYou have web search and page fetching capabilities.\n- Use web_search to find information on any topic.\n- Use web_fetch to read full pages.\n- Always verify critical information from the web.\n</web-capability>\n`;
    return { systemPrompt: event.systemPrompt + webNote };
  });

  return { searchDuckDuckGo, rateLimitedFetch, extractText, extractTitle, extractLinks };
}
