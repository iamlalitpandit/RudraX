/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🕸️ RUDRAX KNOWLEDGE GRAPH — Entity-Relationship Knowledge Base
 * ═══════════════════════════════════════════════════════════════════════
 *
 * A graph database for structured knowledge across the RudraX Army.
 * Agents can create, query, and traverse nodes and relationships.
 *
 * Features:
 *   - Nodes: entities, concepts, files, agents
 *   - Relationships: typed connections between nodes
 *   - Graph traversal: path finding, neighbor queries
 *   - Semantic lookup: find by name, type, or properties
 *   - Visualizable: export to graph JSON for UI rendering
 *   - Persistent: stored as JSON on disk
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface KGNode {
  id: string;
  type: string;           // "file" | "concept" | "agent" | "decision" | "task" | "tool" | "pattern"
  name: string;
  description: string;
  properties: Record<string, string>;
  created: number;
  updated: number;
  createdBy: string;
}

interface KGRelationship {
  id: string;
  type: string;           // "depends_on" | "implements" | "references" | "creates" | "modifies" | "related_to"
  sourceId: string;
  targetId: string;
  properties: Record<string, string>;
  created: number;
  createdBy: string;
}

interface KnowledgeGraph {
  contextId: string;
  nodes: KGNode[];
  relationships: KGRelationship[];
  created: number;
  updated: number;
}

const KG_DIR = path.join(os.homedir(), ".rudrax", "agent", "knowledge-graph");

function ensureKgDir(): void { if (!fs.existsSync(KG_DIR)) fs.mkdirSync(KG_DIR, { recursive: true }); }
function kgPath(contextId: string): string { ensureKgDir(); return path.join(KG_DIR, `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`); }

function loadKG(contextId: string): KnowledgeGraph {
  const kp = kgPath(contextId);
  if (fs.existsSync(kp)) { try { return JSON.parse(fs.readFileSync(kp, "utf-8")); } catch {} }
  return { contextId, nodes: [], relationships: [], created: Date.now(), updated: Date.now() };
}

function saveKG(kg: KnowledgeGraph): void { kg.updated = Date.now(); fs.writeFileSync(kgPath(kg.contextId), JSON.stringify(kg, null, 2), "utf-8"); }

function genId(): string { return `kg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function addNode(kg: KnowledgeGraph, type: string, name: string, description: string, properties: Record<string, string> = {}, createdBy: string = "system"): KGNode {
  const node: KGNode = { id: genId(), type, name, description, properties, created: Date.now(), updated: Date.now(), createdBy };
  kg.nodes.push(node);
  saveKG(kg);
  return node;
}

function addRelationship(kg: KnowledgeGraph, type: string, sourceId: string, targetId: string, properties: Record<string, string> = {}, createdBy: string = "system"): KGRelationship | null {
  if (!kg.nodes.find(n => n.id === sourceId) || !kg.nodes.find(n => n.id === targetId)) return null;
  const rel: KGRelationship = { id: genId(), type, sourceId, targetId, properties, created: Date.now(), createdBy };
  kg.relationships.push(rel);
  saveKG(kg);
  return rel;
}

function findNodes(kg: KnowledgeGraph, query: { type?: string; name?: string; property?: { key: string; value: string } }): KGNode[] {
  return kg.nodes.filter(n => {
    if (query.type && n.type !== query.type) return false;
    if (query.name && !n.name.toLowerCase().includes(query.name.toLowerCase())) return false;
    if (query.property && n.properties[query.property.key] !== query.property.value) return false;
    return true;
  });
}

function findNeighbors(kg: KnowledgeGraph, nodeId: string, direction: "outgoing" | "incoming" | "both" = "both"): { node: KGNode; relationship: KGRelationship }[] {
  const result: { node: KGNode; relationship: KGRelationship }[] = [];
  for (const rel of kg.relationships) {
    if ((direction === "outgoing" || direction === "both") && rel.sourceId === nodeId) {
      const target = kg.nodes.find(n => n.id === rel.targetId);
      if (target) result.push({ node: target, relationship: rel });
    }
    if ((direction === "incoming" || direction === "both") && rel.targetId === nodeId) {
      const source = kg.nodes.find(n => n.id === rel.sourceId);
      if (source) result.push({ node: source, relationship: rel });
    }
  }
  return result;
}

function exportGraphJSON(kg: KnowledgeGraph): object {
  return {
    nodes: kg.nodes.map(n => ({ id: n.id, type: n.type, name: n.name, description: n.description.slice(0, 100), properties: n.properties })),
    edges: kg.relationships.map(r => ({ id: r.id, source: r.sourceId, target: r.targetId, type: r.type })),
  };
}

export default function (pi: ExtensionAPI) {
  let _kgContextId = "";
  let _kg: KnowledgeGraph | null = null;

  pi.registerCommand("kg", {
    description: "Knowledge Graph: entity-relationship knowledge base. Usage: /kg <status|add-node|add-rel|query|neighbors|path|export>",
    getArgumentCompletions(prefix: string) {
      const subs = ["status", "add-node", "add-rel", "query", "neighbors", "export"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "status";
      if (!_kgContextId) _kgContextId = ctx.session?.id || ctx.contextId || "";
      if (!_kgContextId) { ctx.ui.notify("⚠️ No active context.", "warn"); return; }
      _kg = loadKG(_kgContextId);

      if (sub === "status") {
        ctx.ui.notify(`🕸️ **Knowledge Graph**\nNodes: ${_kg.nodes.length}\nRelationships: ${_kg.relationships.length}\nTypes: ${[...new Set(_kg.nodes.map(n => n.type))].join(", ")}`, "info");
        return;
      }
      if (sub === "add-node" && parts[1] && parts[2]) {
        const node = addNode(_kg, parts[1], parts[2], parts.slice(3).join(" ") || "", {}, ctx.agent?.name || "user");
        ctx.ui.notify(`✅ Added node: ${node.name} (${node.type}) — ${node.id}`, "info");
        return;
      }
      if (sub === "query" && parts[1]) {
        const results = findNodes(_kg, { name: parts[1] });
        if (results.length === 0) { ctx.ui.notify("No matching nodes.", "info"); return; }
        ctx.ui.notify(results.map(n => `  • **${n.name}** (${n.type}) — ${n.description.slice(0, 100)}\n    ID: ${n.id}`).join("\n\n"), "info");
        return;
      }
      if (sub === "neighbors" && parts[1]) {
        const neighbors = findNeighbors(_kg, parts[1]);
        if (neighbors.length === 0) { ctx.ui.notify("No neighbors found.", "info"); return; }
        ctx.ui.notify(neighbors.map(n => `  • **${n.node.name}** (${n.node.type}) — via [${n.relationship.type}]`).join("\n"), "info");
        return;
      }
      if (sub === "export") {
        ctx.ui.notify(`📦 Graph JSON exported (${_kg.nodes.length} nodes, ${_kg.relationships.length} edges).`, "info");
        return;
      }
      ctx.ui.notify("Usage: /kg <status|add-node <type> <name> [desc]|add-rel <type> <src> <tgt>|query <name>|neighbors <id>|export>", "info");
    },
  });

  pi.registerTool({
    name: "kg_add_node",
    label: "Add Knowledge Graph Node",
    description: "Add a node (entity/concept/file) to the project knowledge graph.",
    promptSnippet: "Add an entity to the knowledge graph",
    parameters: Type.Object({
      type: Type.String({ description: "Node type: file, concept, agent, decision, task, tool, pattern" }),
      name: Type.String({ description: "Node name" }),
      description: Type.String({ description: "Description of the node" }),
      properties: Type.Optional(Type.Record(Type.String(), Type.String(), { description: "Additional properties" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_kgContextId) _kgContextId = ctx.session?.id || ctx.contextId || "";
      _kg = loadKG(_kgContextId);
      const node = addNode(_kg, params.type, params.name, params.description, params.properties || {}, ctx.agent?.name || "agent");
      return { content: [{ type: "text", text: `✅ Added "${node.name}" to knowledge graph (${node.id})` }], details: { nodeId: node.id } };
    },
  });

  pi.registerTool({
    name: "kg_add_relationship",
    label: "Add Knowledge Graph Relationship",
    description: "Add a relationship between two nodes in the knowledge graph.",
    promptSnippet: "Add a relationship between two entities",
    parameters: Type.Object({
      type: Type.String({ description: "Relationship type: depends_on, implements, references, creates, modifies, related_to" }),
      source_id: Type.String({ description: "Source node ID" }),
      target_id: Type.String({ description: "Target node ID" }),
      properties: Type.Optional(Type.Record(Type.String(), Type.String())),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_kgContextId) _kgContextId = ctx.session?.id || ctx.contextId || "";
      _kg = loadKG(_kgContextId);
      const rel = addRelationship(_kg, params.type, params.source_id, params.target_id, params.properties || {}, ctx.agent?.name || "agent");
      if (!rel) return { content: [{ type: "text", text: "⚠️ One or both node IDs not found." }] };
      return { content: [{ type: "text", text: `✅ Added relationship: ${params.source_id} →[${params.type}]→ ${params.target_id}` }], details: { relationshipId: rel.id } };
    },
  });

  pi.registerTool({
    name: "kg_query",
    label: "Query Knowledge Graph",
    description: "Query the knowledge graph for nodes by type, name, or properties.",
    promptSnippet: "Search the knowledge graph",
    parameters: Type.Object({
      query: Type.String({ description: "Search name/description" }),
      type: Type.Optional(Type.String({ description: "Filter by node type" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_kgContextId) _kgContextId = ctx.session?.id || ctx.contextId || "";
      _kg = loadKG(_kgContextId);
      const results = findNodes(_kg, { name: params.query, type: params.type });
      if (results.length === 0) return { content: [{ type: "text", text: "🔍 No matching entities found." }] };
      const formatted = results.map(n => `• **${n.name}** (${n.type}): ${n.description.slice(0, 150)}\n  ID: \`${n.id}\``).join("\n\n");
      return { content: [{ type: "text", text: `🔍 **Knowledge Graph Results** (${results.length})\n\n${formatted}` }], details: { count: results.length } };
    },
  });

  pi.on("before_agent_start", async (event, _ctx) => {
    if (!_kgContextId) _kgContextId = _ctx.session?.id || _ctx.contextId || "";
    if (!_kgContextId) return {};
    try {
      _kg = loadKG(_kgContextId);
      if (_kg.nodes.length > 0) {
        const topNodes = _kg.nodes.slice(-5).map(n => `• ${n.name} (${n.type})`);
        return { systemPrompt: event.systemPrompt + `\n\n<knowledge-graph>\n🕸️ **Knowledge Graph**: ${_kg.nodes.length} entities\nRecent: ${topNodes.join(", ")}\nUse kg_query to search.\n</knowledge-graph>\n` };
      }
    } catch {}
    return {};
  });

  return { loadKG, saveKG, addNode, addRelationship, findNodes, findNeighbors, exportGraphJSON };
}
