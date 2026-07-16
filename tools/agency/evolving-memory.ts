import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const root = path.join(os.homedir(), ".rudrax", "agent", "evolution");
const files = { learning: "learning.jsonl", user: "user-context.jsonl", journal: "journal.jsonl" };
function ensureRoot() { fs.mkdirSync(root, { recursive: true }); }
function append(store: keyof typeof files, value: object) { ensureRoot(); fs.appendFileSync(path.join(root, files[store]), JSON.stringify({ timestamp: new Date().toISOString(), ...value }) + "\n", { encoding: "utf8", mode: 0o600 }); }
function recent(store: keyof typeof files, limit = 20) { ensureRoot(); const target = path.join(root, files[store]); if (!fs.existsSync(target)) return []; return fs.readFileSync(target, "utf8").trim().split("\n").filter(Boolean).slice(-limit).map(line => JSON.parse(line)); }

export default function evolvingMemory(pi: ExtensionAPI) {
  pi.registerTool({ name: "learn_from_experience", label: "Learn from experience", description: "Persist a lesson, preference, pitfall, or repeated pattern for future RudraX sessions.", parameters: Type.Object({ type: Type.Union([Type.Literal("technique"), Type.Literal("convention"), Type.Literal("pitfall"), Type.Literal("user_preference"), Type.Literal("pattern")]), observation: Type.String(), lesson: Type.String(), tags: Type.Optional(Type.Array(Type.String())) }), async execute(_id, params) { append(params.type === "user_preference" ? "user" : "learning", params); return { content: [{ type: "text", text: "Lesson saved to RudraX evolving memory." }], details: { saved: true } }; } });
  pi.registerTool({ name: "reflect_on_work", label: "Reflect on work", description: "Record task outcome and improvements so RudraX can learn across sessions.", parameters: Type.Object({ task: Type.String(), result: Type.Union([Type.Literal("success"), Type.Literal("partial"), Type.Literal("failure")]), approach: Type.String(), what_worked: Type.Optional(Type.Array(Type.String())), mistakes: Type.Optional(Type.Array(Type.String())), would_do_differently: Type.Optional(Type.String()) }), async execute(_id, params) { append("journal", params); return { content: [{ type: "text", text: "Reflection recorded." }], details: { saved: true } }; } });
  pi.registerTool({ name: "read_accumulated_wisdom", label: "Read accumulated wisdom", description: "Read recent lessons, preferences, and reflections from RudraX memory.", parameters: Type.Object({ limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })) }), async execute(_id, params) { const limit = params.limit ?? 20; const data = { lessons: recent("learning", limit), user: recent("user", limit), journal: recent("journal", limit) }; return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], details: data }; } });
  pi.registerCommand("evolve", { description: "Show RudraX evolving-memory status", handler: async (_args, ctx) => ctx.ui.notify(`Evolving memory: ${recent("learning", 100).length} lessons, ${recent("journal", 100).length} reflections`, "info") });
}
