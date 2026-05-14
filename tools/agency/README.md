# 🎭 The Agency — RudraX Integration

> **186+ AI specialist agents + Autonomous Multi-Agent Orchestrator** — RudraX is now a fully autonomous AI stack

This integration converts the [Agency Agents](https://github.com/msitarzewski/agency-agents) collection into RudraX Skills and adds **two powerful extensions**:

1. **Agency Manager** — `/agency` command for listing, activating, and managing agents
2. **Agency Orchestrator** — The brain that **analyzes prompts, plans execution, spawns specialized agents in parallel, and monitors completion**

## 🚀 Quick Start

```bash
# 1. Convert agents (if not already done)
./tools/agency/convert.sh

# 2. Install to RudraX
./tools/agency/install.sh

# 3. Start RudraX
rudrax

# 4. In RudraX, reload to pick up new skills and extensions
/reload

# 5. Start orchestrating!
/orchestrate Build me a full-stack e-commerce app with React frontend, Node.js backend, and PostgreSQL database
```

## 🧠 The Orchestrator — How It Works

The **Agency Orchestrator** is RudraX's autonomous multi-agent brain. When you give a complex prompt:

```
User: "Build me a landing page with a contact form, SEO optimization, and analytics"
  │
  ▼
┌──────────────────────────────────────────────┐
│  🧠 ORCHESTRATOR (Prompt Analysis)            │
│  • Detects categories: frontend, seo, content │
│  • Creates execution plan with 3 tasks         │
│  • Plans Lane 1: frontend + content (parallel) │
│  • Plans Lane 2: seo (after content ready)     │
└──────┬───────────┬───────────────────────────┘
       │           │
  ┌────▼────┐ ┌────▼────┐     ← Lane 1 (parallel)
  │Frontend  │ │Content  │
  │Developer │ │Creator  │
  │  Agent   │ │ Agent   │
  └────┬─────┘ └────┬────┘
       │            │
       ▼            ▼
  ┌────────────────────────┐   ← Lane 2 (after Lane 1)
  │  SEO Specialist        │
  │  (uses content output) │
  └────────┬───────────────┘
           ▼
  ┌────────────────────────┐   ← Integration
  │  Orchestrator reviews  │
  │  and merges results    │
  └────────────────────────┘
```

### Commands

```bash
# Orchestrate a complex task
/orchestrate Build me a SaaS platform with auth, billing, and landing page

# Check execution plan status
/orchestrate status

# Stop current orchestration
/orchestrate stop

# Switch between auto/manual mode
/orchestrate auto       # Orchestrator auto-plans and dispatches
/orchestrate manual    # You pick agents, orchestrator plans

# Quick dispatch to a specific agent
/dispatch engineering-frontend-developer Create a responsive navbar component
```

### LLM Tools (Autonomous)

The orchestrator registers 6 tools that the LLM can use autonomously:

| Tool | Purpose |
|------|---------|
| `agency_analyze` | Analyze prompt → decompose into categorized atomic tasks |
| `agency_dispatch` | Dispatch a task to a specialized agent |
| `agency_parallel_dispatch` | Dispatch multiple independent tasks simultaneously |
| `agency_task_complete` | Mark a task as done with results |
| `agency_task_status` | Check plan progress, current lane, remaining tasks |
| `agency_report` | Generate final execution report with all results |

### Execution Lanes

Tasks are organized into **parallel execution lanes**:
- **Lane 1**: Tasks with no dependencies (can run simultaneously)
- **Lane 2**: Tasks that depend on Lane 1 results
- **Lane N**: Tasks that depend on lanes 1..N-1

All tasks within the same lane are independent and dispatched in **parallel**.

### Agent Category Detection

The orchestrator auto-detects task categories from prompt keywords:

| Category | Keywords | Agent |
|----------|----------|-------|
| frontend | react, vue, css, html, component, page | engineering-frontend-developer |
| backend | api, server, endpoint, rest, graphql | engineering-backend-architect |
| database | sql, migration, schema, postgres, mongodb | engineering-database-optimizer |
| devops | deploy, docker, kubernetes, ci/cd, cloud | engineering-devops-automator |
| security | vulnerability, encryption, csrf, xss, audit | engineering-security-engineer |
| testing | test, qa, coverage, jest, cypress | testing-api-tester |
| design | ux, ui, wireframe, figma, accessibility | design-ux-architect |
| product | roadmap, feature, spec, mvp, sprint | product-manager |
| content | blog, article, docs, readme, guide | marketing-content-creator |
| marketing | seo, growth, campaign, analytics, funnel | marketing-growth-hacker |
| sales | deal, proposal, pitch, crm | sales-account-strategist |
| finance | budget, revenue, cost, roi | finance-financial-analyst |
| mobile | ios, android, app, react native | engineering-mobile-app-builder |
| ai-ml | ai, ml, model, training, llm, chatbot | engineering-ai-engineer |
| game-dev | unity, unreal, godot, game | game-designer |

## 🎭 Using Agents (Direct)

### Method 1: /agency Command

```bash
/agency list                           # List all agents
/agency categories                     # List categories
/agency search frontend                # Search for agents
/agency activate engineering-frontend-developer  # Activate agent
/agency status                         # Show active agent
/agency deactivate                     # Remove active personality
```

### Method 2: /skill Command (Direct)

```bash
/skill:engineering-frontend-developer   # Load agent skill directly
/skill:design-ux-architect              # UX architecture specialist
/skill:marketing-growth-hacker         # Growth specialist
/skill:nexus-orchestrator              # Multi-agent coordination
```

### Method 3: LLM Tool (Autonomous)

The LLM can autonomously activate agents using the registered tools:

- `agency_activate` — Activate an agent by name
- `agency_deactivate` — Deactivate current agent
- `agency_squad` — Activate a pre-defined squad

## 👥 Pre-Defined Squads

Squads activate multiple agents simultaneously for coordinated multi-agent workflows:

| Squad | Agents | Best For |
|-------|--------|----------|
| **startup** | 5 | Building MVP from scratch |
| **enterprise** | 6 | Enterprise feature development |
| **fullproduct** | 8 | End-to-end product (design to launch) |
| **security** | 5 | Security audits and hardening |
| **qalead** | 5 | Quality assurance and testing |
| **aiinfra** | 5 | AI/ML infrastructure |
| **web3** | 5 | Blockchain and smart contracts |
| **growth** | 6 | Marketing and growth |
| **incident** | 6 | Production incident response |

```bash
# Activate a squad
/agency squad startup
```

## 🎨 Available Agent Divisions

| Division | Emoji | Agents | Focus |
|----------|-------|--------|-------|
| **Engineering** | 💻 | 29 | Frontend, Backend, DevOps, Security, Mobile, AI, SRE |
| **Marketing** | 📢 | 30 | Growth, SEO, Content, Social Media, TikTok, LinkedIn |
| **Specialized** | 🔬 | 41 | MCP Builder, Compliance, Legal, Healthcare, Blockchain |
| **Design** | 🎨 | 8 | UX Architect, UI Designer, Brand Guardian, Whimsy Injector |
| **Game Development** | 🎮 | 20 | Unity, Unreal, Godot, Blender, Roblox, Audio |
| **Finance** | 💰 | 5 | Financial Analyst, Bookkeeper, Tax Strategist, Investment |
| **Academic** | 🎓 | 5 | Psychologist, Historian, Narratologist, Geographer |
| **Product** | 📦 | 5 | Product Manager, Sprint Prioritizer, Feedback Synthesizer |
| **Sales** | 🤝 | 8 | Account Strategist, Deal Strategist, Proposal Strategist |
| **Paid Media** | 💳 | 7 | PPC, Programmatic, Creative Strategy, Tracking |
| **Testing** | 🧪 | 8 | API Tester, Performance, Accessibility, Reality Checker |
| **Support** | 🛟 | 6 | Support Responder, Analytics, Finance Tracker |
| **Spatial Computing** | 🥽 | 6 | visionOS, XR, Metal, Terminal Integration |
| **Project Management** | 📋 | 6 | Project Shepherd, Jira Steward, Studio Producer |
| **Strategy** | 🌐 | 7 | NEXUS Orchestrator, Agency Runbooks, Workflows |

**Plus** 5 workflow examples and the NEXUS multi-agent orchestrator.

## 🌐 NEXUS Orchestrator

The NEXUS (Network of EXperts, Unified in Strategy) is The Agency's multi-agent coordination system:

```bash
/agency activate-nexus        # Activate NEXUS orchestrator
/skill:nexus-orchestrator      # Load full NEXUS playbook
/agency squad startup          # Run pre-defined squad
```

NEXUS includes:
- **6 Phase Playbooks**: Discovery → Strategy → Foundation → Build → Hardening → Launch → Operate
- **Agent Coordination Matrix**: Who activates when, what they produce
- **Handoff Protocols**: Standardized cross-agent transitions
- **Quality Gates**: Verification before phase advancement
- **4 Scenario Runbooks**: Startup MVP, Enterprise Feature, Marketing Campaign, Incident Response

## 🔧 Architecture

```
User: "Build me a landing page"
  │
  ├─► /orchestrate or /dispatch     ← Commands
  ├─► before_agent_start hook       ← System prompt injection
  │
  ├─► agency_analyze               ← LLM calls this to decompose
  ├─► agency_dispatch              ← LLM dispatches to agents
  ├─► agency_parallel_dispatch     ← LLM dispatches multiple at once
  ├─► agency_task_complete         ← Agent reports completion
  ├─► agency_task_status           ← Check progress
  ├─► agency_report                ← Final summary
  │
  └─► Orchestrator monitors lanes  ← turn_end auto-advances
```

### Extension Files

```
tools/agency/
├── README.md                ← This file
├── convert.sh               ← Convert Agency .md → RudraX SKILL.md
├── install.sh                ← Install skills + extensions to ~/.pi/agent/
├── agency-manager.ts         ← /agency command, activation, squads
├── agency-orchestrator.ts    ← /orchestrate, /dispatch, plan/monitor system
└── skills/                   ← 186 converted skills

~/.pi/agent/
├── skills/                   ← 191 installed skills
└── extensions/
    ├── agency-manager.ts      ← Agent management extension
    └── agency-orchestrator.ts ← Multi-agent orchestration extension
```

## 🔄 Re-converting After Updates

```bash
cd /tmp/agency-agents && git pull
cd /path/to/RudraX && ./tools/agency/convert.sh --source /tmp/agency-agents
./tools/agency/install.sh
# Then /reload in RudraX
```

## 🗂️ Shared Memory — Cross-Agent Communication

Every project context gets a **shared memory file** that ALL agents read from and write to:

```
~/.rudrax/agent/memory/{context-id}.md
```

### How It Works

```
┌────────────────────────────────────────────────────┐
│  Agent A ──writes──→ ┌──────────┐ ←──reads── Agent B │
│                     │  SHARED  │                      │
│  Agent C ──writes──→│  MEMORY  │←──reads── Agent D  │
│                     │  FILE    │                      │
│  Orchestrator ─────→│          │←──── Agent E        │
│                     └──────────┘                      │
└────────────────────────────────────────────────────┘
```

### Memory Sections

| Section | Purpose | Updated By |
|---------|---------|------------|
| **Project Overview** | High-level description | Any agent |
| **Project Structure** | File tree scan | `memory_write type=structure_update` |
| **Task Board** | Task ID / Agent / Status / Description | `memory_write with taskId` |
| **Activity Log** | Chronological feed of all agent actions | Auto (all writes) |
| **Decisions** | Architecture & design decisions | `memory_write type=decision` |
| **Files Changed** | Files created/modified | `memory_write type=file_changed` |
| **Blockers** | ⚠️ Problems blocking progress | `memory_write type=blocker` |
| **Handoffs** | 🤝 Context passed between agents | `memory_write type=handoff toAgent=...` |
| **Notes** | General notes | `memory_write type=note` |

### LLM Tools (3 new)

| Tool | Purpose |
|------|---------|
| `memory_read` | Read shared memory (overview, tasks, log, decisions, blockers, handoffs, structure, files, full) |
| `memory_write` | Write entries (task_result, decision, file_changed, structure_update, blocker, handoff, note) |
| `memory_query` | Search/filter memory by keyword, agent, or type |

### Usage Examples

```bash
# CLI
/memory status              # Show memory status
/memory log                 # Activity timeline
/memory tasks               # Current task board
/memory decisions           # Key decisions
/memory blockers            # Active blockers
/memory handoffs            # Agent handoffs
/memory list                # All project memories

# In agent prompts (LLM tools)
"Read the shared memory and implement the cart API"
"Memory shows frontend-dev completed the UI — write a handoff for backend-dev"
"Query memory for all decisions about the database"
```

### Auto-Injection

The `before_agent_start` hook automatically injects the relevant shared memory context into the system prompt. Every agent sees:
- Project overview and structure
- Active tasks and their status
- Recent activity from other agents
- Key decisions
- Active blockers
- Files changed

This means agents never work blind — they always know what others have done.

### WebUI Integration

The **Memory tab** in the sidebar shows:
- Project name and status
- Expandable sections for each memory section
- Real-time updates via WebSocket (`memory_update` events)
- Raw file viewer
- Quick action buttons

## 🗑️ Uninstall

```bash
./tools/agency/install.sh --uninstall
```

## 📊 Stats

- **191 Agent Skills** — Every agent from The Agency converted to RudraX format
- **3 Extensions** — Agency Manager + Agency Orchestrator + Shared Memory
- **6 Orchestrator Tools** — agency_analyze, agency_dispatch, agency_parallel_dispatch, agency_task_complete, agency_task_status, agency_report
- **3 Agency Manager Tools** — agency_activate, agency_deactivate, agency_squad
- **3 Memory Tools** — memory_read, memory_write, memory_query
- **9 Pre-defined Squads** — Coordinated multi-agent teams
- **4 Commands** — /orchestrate + /dispatch + /agency + /memory
- **NEXUS Orchestrator** — Full multi-agent coordination playbook with 6 phases
- **4 Scenario Runbooks** — Startup MVP, Enterprise Feature, Marketing Campaign, Incident Response
- **5 Workflow Examples** — Real-world multi-agent coordination demos
- **1 Shared Memory System** — Per-project cross-agent communication layer

## 🙏 Credits

- **The Agency** by [msitarzewski](https://github.com/msitarzewski/agency-agents) — The original agent personality collection
- **RudraX** by [lalitpandit](https://github.com/lalitpandit/rudrax) — AI coding agent framework

## 📄 License

- Agency Agents: MIT License
- RudraX: MIT License (based on pi-coding-agent, AGPL-3.0)