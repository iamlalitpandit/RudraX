import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/**
 * Agency Manager Extension for RudraX — v4.6.0 (State-of-the-Art Upgrade)
 *
 * Provides:
 * - /agency list        — List all installed agency agents
 * - /agency activate    — Activate an agent (injects personality into system prompt)
 * - /agency deactivate  — Remove agent personality from current session
 * - /agency status      — Show currently active agent
 * - /agency categories  — List agent categories
 * - /agency search      — Search agents by keyword
 * - /agency activate-nexus — Activate NEXUS multi-agent orchestrator
 * - /agency squad       — Activate a team of agents
 *
 * Integrated Capabilities (v4.6.0+):
 *   🧠 vector-knowledge.ts   — Semantic search & RAG via vector KB
 *   📡 communication-bus.ts  — Pub/sub messaging between agents
 *   🛡️ approval-gates.ts     — Human-in-the-loop safety gates
 *   🔍 reflection-engine.ts  — Self-critique & quality analysis
 *   📊 observability.ts      — Full tracing & monitoring
 *   🌐 web-search.ts         — Live web search & browsing
 *   ⚙️ workflow-engine.ts    — DAG-based multi-step automation
 *   🕸️ knowledge-graph.ts    — Entity-relationship knowledge base
 *   🔧 tool-registry.ts      — Dynamic tool creation by agents
 *   💰 cost-tracker.ts       — LLM usage & spend analytics
 *   ⏰ task-scheduler.ts     — Cron-based recurring tasks
 *   🏆 agent-evaluator.ts    — Benchmarking & scoring
 *   🖼️ multi-modal.ts        — Image/audio/video processing
 *   🛡️ guardrails.ts         — Content filtering & validation
 *   📦 code-sandbox.ts       — Secure isolated code execution
 */

// Track active agent
let activeAgent: string | null = null;
let activeAgentContent: string | null = null;
let activeSquad: string[] = [];

// Agent categories for organization
const CATEGORIES: Record<string, string> = {
  academic: "🎓 Academic",
  design: "🎨 Design",
  engineering: "💻 Engineering",
  finance: "💰 Finance",
  "game-development": "🎮 Game Development",
  marketing: "📢 Marketing",
  "paid-media": "💳 Paid Media",
  product: "📦 Product",
  "project-management": "📋 Project Management",
  sales: "🤝 Sales",
  "spatial-computing": "🥽 Spatial Computing",
  specialized: "🔬 Specialized",
  strategy: "🌐 Strategy",
  support: "🛟 Support",
  testing: "🧪 Testing",
};

// Pre-defined squad compositions
const SQUADS: Record<string, { name: string; description: string; agents: string[] }> = {
  startup: {
    name: "Startup MVP Squad",
    description: "Full-stack team for building an MVP from scratch",
    agents: [
      "engineering-rapid-prototyper",
      "engineering-frontend-developer",
      "engineering-backend-architect",
      "design-ui-designer",
      "product-manager",
    ],
  },
  enterprise: {
    name: "Enterprise Feature Squad",
    description: "Structured team for enterprise feature development",
    agents: [
      "engineering-software-architect",
      "engineering-senior-developer",
      "engineering-security-engineer",
      "engineering-devops-automator",
      "engineering-code-reviewer",
      "project-management-project-shepherd",
    ],
  },
  fullproduct: {
    name: "Full Product Squad",
    description: "End-to-end product team from design to launch",
    agents: [
      "product-manager",
      "design-ux-architect",
      "design-ui-designer",
      "engineering-frontend-developer",
      "engineering-backend-architect",
      "engineering-devops-automator",
      "marketing-growth-hacker",
      "marketing-content-creator",
    ],
  },
  security: {
    name: "Security Hardening Squad",
    description: "Security-focused team for audits and hardening",
    agents: [
      "engineering-security-engineer",
      "engineering-threat-detection-engineer",
      "specialized-compliance-auditor",
      "engineering-code-reviewer",
      "engineering-devops-automator",
    ],
  },
  qalead: {
    name: "QA & Testing Squad",
    description: "Quality assurance and testing specialists",
    agents: [
      "engineering-code-reviewer",
      "testing-api-tester",
      "testing-performance-benchmarker",
      "testing-accessibility-auditor",
      "testing-reality-checker",
    ],
  },
  aiinfra: {
    name: "AI Infrastructure Squad",
    description: "AI/ML engineering and infrastructure team",
    agents: [
      "engineering-ai-engineer",
      "engineering-backend-architect",
      "engineering-devops-automator",
      "specialized-specialized-mcp-builder",
      "specialized-specialized-model-qa",
    ],
  },
  web3: {
    name: "Web3 & Blockchain Squad",
    description: "Blockchain and smart contract development team",
    agents: [
      "engineering-solidity-smart-contract-engineer",
      "specialized-blockchain-security-auditor",
      "specialized-identity-graph-operator",
      "specialized-zk-steward",
      "engineering-backend-architect",
    ],
  },
  growth: {
    name: "Growth Marketing Squad",
    description: "Marketing and growth specialists",
    agents: [
      "marketing-growth-hacker",
      "marketing-content-creator",
      "marketing-seo-specialist",
      "marketing-social-media-strategist",
      "paid-media-paid-social-strategist",
      "product-feedback-synthesizer",
    ],
  },
  incident: {
    name: "Incident Response Squad",
    description: "Production incident management team",
    agents: [
      "engineering-incident-response-commander",
      "engineering-sre",
      "engineering-devops-automator",
      "engineering-security-engineer",
      "support-support-responder",
      "support-executive-summary-generator",
    ],
  },
};

export default function (pi: ExtensionAPI) {
  // ─── Load helper: scan installed agency skills ───
  function getAgencySkills(): Array<{
    name: string;
    description: string;
    category: string;
    emoji: string;
    color: string;
    vibe: string;
    originalName: string;
  }> {
    const allSkills = pi.getCommands
      ? []
      : [];
    // We parse from the skills loaded by pi's skill system
    // Access via pi's internal skill registry if available
    try {
      const tools = pi.getAllTools();
      // Skills register as /skill:name commands - we get them from pi.getCommands()
      return [];
    } catch {
      return [];
    }
  }

  // ─── /agency command ───
  pi.registerCommand("agency", {
    description:
      "Manage Agency AI agents: list, activate, deactivate, status, squad, categories, search",
    getArgumentCompletions(prefix: string) {
      const subcommands = [
        "list",
        "activate",
        "deactivate",
        "status",
        "categories",
        "search",
        "squad",
        "activate-nexus",
      ];
      if (!prefix || prefix === "") return subcommands.map((s) => ({ value: s, label: s }));

      const parts = prefix.split(/\s+/);
      const sub = parts[0];

      if (sub === "activate" || sub === "squad") {
        // Auto-complete agent/squad names
        if (sub === "activate") {
          const agents = listAgentNames();
          const filtered = agents.filter((a) =>
            a.startsWith(parts[1] || "")
          );
          return filtered.map((a) => ({ value: `${sub} ${a}`, label: a }));
        }
        if (sub === "squad") {
          const squadNames = Object.keys(SQUADS);
          const filtered = squadNames.filter((s) =>
            s.startsWith(parts[1] || "")
          );
          return filtered.map((s) => ({
            value: `${sub} ${s}`,
            label: `${SQUADS[s].name} - ${SQUADS[s].description}`,
          }));
        }
      }

      const filtered = subcommands.filter((s) => s.startsWith(sub));
      return filtered.map((s) => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "list";

      switch (sub) {
        case "list":
          return handleList(parts[1], ctx);
        case "activate":
          return handleActivate(parts[1], ctx);
        case "deactivate":
          return handleDeactivate(ctx);
        case "status":
          return handleStatus(ctx);
        case "categories":
          return handleCategories(ctx);
        case "search":
          return handleSearch(parts.slice(1).join(" "), ctx);
        case "squad":
          return handleSquad(parts[1], ctx);
        case "activate-nexus":
          return handleActivateNexus(ctx);
        default:
          ctx.ui.notify(
            `Unknown subcommand: ${sub}. Use: list, activate, deactivate, status, categories, search, squad, activate-nexus`,
            "error"
          );
      }
    },
  });

  // ─── /help-agency command — Comprehensive feature reference ─
  pi.registerCommand("help-agency", {
    description: "Show comprehensive command reference for all RudraX Army capabilities",
    handler: async (_args: string, ctx) => {
      const help = `🔱 **RudraX Army v4.6.0 — Complete Command Reference**

**🎯 AGENCY COMMANDS**
/agency list                       — List all specialization agents
/agency activate <name>            — Activate an agent personality
/agency deactivate                 — Deactivate current agent
/agency status                     — Show active agent/squad
/agency squad <name>               — Activate a pre-built squad
/agency search <query>             — Search agents by keyword
/agency categories                 — List agent categories
/agency activate-nexus             — Activate multi-agent orchestrator

**🧠 KNOWLEDGE & MEMORY**
/vector search <query>             — Semantic vector search across all memory
/vector status                     — Vector knowledge base status
/kg add-node <type> <name> [desc]  — Add entity to knowledge graph
/kg query <name>                   — Search knowledge graph
/memory <status|log|tasks>         — Shared project memory

**📡 COMMUNICATION**
/bus status                        — Communication bus status
/bus send <agent> <msg>            — Send direct message to agent
/bus publish <topic> <msg>         — Broadcast to topic
/bus subscribe <topic>             — Listen to a topic

**⚙️ WORKFLOW & AUTOMATION**
/workflow list                     — List available workflows
/workflow run <name>               — Execute a workflow
/workflow status                   — Check workflow progress
/schedule list                     — List scheduled tasks
/schedule add <type> <name> <min> <target> — Schedule recurring task

**🔍 OBSERVABILITY & QUALITY**
/observe dashboard                 — Live metrics dashboard
/observe traces                    — Recent trace waterfall
/observe agents                    — Agent telemetry
/reflect plan <content>            — Self-reflect on a plan
/reflect output <content>          — Reflect on output quality
/reflect error <error>             — Analyze error root cause
/evaluate run <suite>              — Run agent evaluation suite

**🛡️ SAFETY & CONTROL**
/gate status                       — Approval gates status
/gate approve <id>                 — Approve blocked operation
/gate deny <id>                    — Deny operation
/guardrails check <content>        — Validate output safety

**🌐 WEB & EXECUTION**
/web search <query>                — Search the web
/web fetch <url>                   — Fetch a web page
/sandbox run <lang> <code>         — Execute code in sandbox

**💰 ANALYTICS**
/cost dashboard                    — LLM spend dashboard
/cost budget <daily_limit>         — Set daily budget

**🛠️ EXTENSIBILITY**
/tool-registry list                — List custom tools
/tool-registry create <type> <name> <code> — Create custom tool
/multimodal analyze <file>         — Analyze image/file

📌 Type any command for detailed usage help.`;
      ctx.ui.notify(help, "info");
    },
  });

  // ─── Agency activate tool for LLM ───
  pi.registerTool({
    name: "agency_activate",

  // ─── Agency deactivate tool ───
  pi.registerTool({
    name: "agency_deactivate",
    label: "Deactivate Agency Agent",
    description: "Deactivate the currently active Agency agent personality, returning to default behavior.",
    promptSnippet: "Deactivate active Agency agent personality",
    parameters: Type.Object({}),
    async execute() {
      const was = activeAgent;
      activeAgent = null;
      activeAgentContent = null;
      activeSquad = [];
      return {
        content: [
          {
            type: "text",
            text: was
              ? `✅ Agency agent "${was}" deactivated.`
              : "No active agent to deactivate.",
          },
        ],
        details: { active: false },
      };
    },
  });

  // ─── Agency squad activate tool ───
  pi.registerTool({
    name: "agency_squad",
    label: "Activate Agency Squad",
    description:
      "Activate a pre-defined squad of Agency agents that work together. Available squads: startup, enterprise, fullproduct, security, qalead, aiinfra, web3, growth, incident.",
    promptSnippet: "Activate a multi-agent Agency squad",
    parameters: Type.Object({
      squad_name: Type.String({
        description: "Name of the squad to activate: startup, enterprise, fullproduct, security, qalead, aiinfra, web3, growth, incident",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const squad = SQUADS[params.squad_name];
      if (!squad) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown squad "${params.squad_name}". Available: ${Object.keys(SQUADS).join(", ")}`,
            },
          ],
          details: { error: true },
        };
      }

      activeSquad = squad.agents;
      activeAgent = null;
      activeAgentContent = null;

      return {
        content: [
          {
            type: "text",
            text: `🎭 Squad "${squad.name}" activated with ${squad.agents.length} agents:\n${squad.agents.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n${squad.description}`,
          },
        ],
        details: { squad: params.squad_name, agents: squad.agents },
      };
    },
  });

  // ─── Inject agent personality into system prompt ───
  pi.on("before_agent_start", async (event, _ctx) => {
    if (!activeAgent && activeSquad.length === 0) return;

    let personalityInjection = "";

    if (activeAgent) {
      personalityInjection = `\n\n<agency-personality>\nYou are currently operating as the "${activeAgent}" Agency specialist.\nLoad the full skill with /skill:${activeAgent} for complete workflows and deliverables.\nApply the expertise, communication style, and workflow patterns of this agent to all your responses.\n</agency-personality>`;
    }

    if (activeSquad.length > 0) {
      personalityInjection = `\n\n<agency-squad>\nYou are operating as a multi-agent squad with the following specialists:\n${activeSquad.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nApply the combined expertise of these agents. When a task falls within a specific agent's domain, apply that agent's specialized perspective.\nCoordinate between specialists for cross-domain tasks.\nLoad individual skills with /skill:<name> for detailed workflows.\n</agency-squad>`;
    }

    return {
      systemPrompt: event.systemPrompt + personalityInjection,
    };
  });

  // ─── Session start: show agency status ───
  pi.on("session_start", async (_event, ctx) => {
    const features = [
      "🧠 Vector Knowledge Base", "📡 Communication Bus", "🛡️ Approval Gates",
      "🔍 Self-Reflection", "📊 Observability", "🌐 Web Search",
      "⚙️ Workflow Engine", "🕸️ Knowledge Graph", "🔧 Tool Registry",
      "💰 Cost Tracker", "⏰ Task Scheduler", "🏆 Agent Evaluator",
      "📦 Code Sandbox", "🛡️ Guardrails"
    ];

    if (activeAgent) {
      ctx.ui.notify(`🎭 Agency active: ${activeAgent}`, "info");
    } else if (activeSquad.length > 0) {
      ctx.ui.notify(`🎭 Agency squad active (${activeSquad.length} agents)`, "info");
    }

    // Show integrated capabilities on first session
    ctx.ui.notify(
      `🔱 RudraX Army v4.6.0 — ${features.length} Advanced Capabilities\n` +
      `${features.join(" · ")}\n\n` +
      `📌 /help-agency — Full command reference`,
      "info"
    );
  });

  // ─── Helper functions ───

  function listAgentNames(): string[] {
    // This would normally dynamically enumerate from the skill system
    // For now, return known categories for autocomplete
    return [
      "engineering-frontend-developer",
      "engineering-backend-architect",
      "engineering-ai-engineer",
      "engineering-devops-automator",
      "engineering-rapid-prototyper",
      "engineering-senior-developer",
      "engineering-security-engineer",
      "engineering-software-architect",
      "engineering-code-reviewer",
      "engineering-sre",
      "engineering-technical-writer",
      "engineering-mobile-app-builder",
      "engineering-database-optimizer",
      "engineering-git-workflow-master",
      "engineering-minimal-change-engineer",
      "engineering-incident-response-commander",
      "engineering-solidity-smart-contract-engineer",
      "engineering-threat-detection-engineer",
      "design-ux-architect",
      "design-ui-designer",
      "design-brand-guardian",
      "design-ux-researcher",
      "design-visual-storyteller",
      "design-whimsy-injector",
      "marketing-growth-hacker",
      "marketing-content-creator",
      "marketing-seo-specialist",
      "marketing-social-media-strategist",
      "product-manager",
      "product-feedback-synthesizer",
      "product-sprint-prioritizer",
      "project-management-project-shepherd",
      "sales-account-strategist",
      "sales-deal-strategist",
      "finance-financial-analyst",
      "specialized-specialized-mcp-builder",
      "specialized-compliance-auditor",
      "specialized-customer-service",
      "specialized-language-translator",
      "testing-api-tester",
      "testing-performance-benchmarker",
      "testing-accessibility-auditor",
      "support-support-responder",
      "nexus-orchestrator",
    ];
  }

  async function handleList(filter: string | undefined, ctx: any) {
    const agents = listAgentNames();
    const filtered = filter
      ? agents.filter((a) => a.includes(filter))
      : agents;

    if (filtered.length === 0) {
      ctx.ui.notify("No agents found matching filter.", "info");
      return;
    }

    const msg = `🎭 **The Agency — ${filtered.length} Agents Available**\n\n${filtered.map((a, i) => `${String(i + 1).padStart(3)}. ${a}`).join("\n")}\n\nActivate with: /agency activate <name>`;
    ctx.ui.notify(msg, "info");
  }

  async function handleActivate(agentName: string | undefined, ctx: any) {
    if (!agentName) {
      ctx.ui.notify("Usage: /agency activate <agent-name>", "error");
      return;
    }

    activeAgent = agentName;
    activeAgentContent = null;
    activeSquad = [];
    ctx.ui.notify(`🎭 Activated agent: ${agentName}\nLoad full skill with: /skill:${agentName}`, "info");
    pi.sendUserMessage(`/skill:${agentName}`, { deliverAs: "steer" });
  }

  async function handleDeactivate(ctx: any) {
    const was = activeAgent || activeSquad.join(", ");
    activeAgent = null;
    activeAgentContent = null;
    activeSquad = [];
    ctx.ui.notify(`🎭 Deactivated: ${was || "nothing active"}`, "info");
  }

  async function handleStatus(ctx: any) {
    if (activeAgent) {
      ctx.ui.notify(`🎭 Active agent: ${activeAgent}`, "info");
    } else if (activeSquad.length > 0) {
      ctx.ui.notify(`🎭 Active squad (${activeSquad.length} agents): ${activeSquad.join(", ")}`, "info");
    } else {
      ctx.ui.notify("🎭 No agency agent active. Use /agency activate <name>", "info");
    }
  }

  async function handleCategories(ctx: any) {
    const cats = Object.entries(CATEGORIES)
      .map(([key, label]) => `  ${label} (${key})`)
      .join("\n");
    ctx.ui.notify(`🎭 Agent Categories:\n${cats}`, "info");
  }

  async function handleSearch(query: string | undefined, ctx: any) {
    if (!query) {
      ctx.ui.notify("Usage: /agency search <keyword>", "error");
      return;
    }

    const agents = listAgentNames();
    const results = agents.filter(
      (a) => a.includes(query.toLowerCase())
    );

    if (results.length === 0) {
      ctx.ui.notify(`No agents matching "${query}"`, "info");
    } else {
      ctx.ui.notify(
        `🔍 Found ${results.length} agents:\n${results.map((a) => `  • ${a}`).join("\n")}`,
        "info"
      );
    }
  }

  async function handleSquad(squadName: string | undefined, ctx: any) {
    if (!squadName) {
      const available = Object.entries(SQUADS)
        .map(([key, s]) => `  • ${key}: ${s.name} — ${s.description} (${s.agents.length} agents)`)
        .join("\n");
      ctx.ui.notify(`🎭 Available Squads:\n${available}\n\nUse: /agency squad <name>`, "info");
      return;
    }

    const squad = SQUADS[squadName];
    if (!squad) {
      ctx.ui.notify(
        `Unknown squad "${squadName}". Available: ${Object.keys(SQUADS).join(", ")}`,
        "error"
      );
      return;
    }

    activeSquad = squad.agents;
    activeAgent = null;
    activeAgentContent = null;
    ctx.ui.notify(
      `🎭 Squad "${squad.name}" activated (${squad.agents.length} agents)`,
      "info"
    );
  }

  async function handleActivateNexus(ctx: any) {
    activeAgent = "nexus-orchestrator";
    activeSquad = [];
    ctx.ui.notify("🌐 NEXUS Orchestrator activated — multi-agent coordination mode", "info");
    pi.sendUserMessage("/skill:nexus-orchestrator", { deliverAs: "steer" });
  }
}