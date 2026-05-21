<p align="center">
  <strong><code>🔱 RUDRAX ARMY v4.5.0</code></strong><br>
</p>

<p align="center">
  <strong>Build · Break · Deploy · Orchestrate</strong><br>
  <em>A Hierarchical Multi-Agent Command System with 192 AI Specialists & 15 Advanced Capabilities</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.5.0-gold" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/agents-192-orange" alt="Agents">
  <img src="https://img.shields.io/badge/squads-9-purple" alt="Squads">
  <img src="https://img.shields.io/badge/capabilities-15-teal" alt="Capabilities">
  <img src="https://img.shields.io/badge/categories-45-red" alt="Categories">
</p>

---

## 🎯 What is RudraX Army?

**RudraX Army** is not just another AI coding agent — it's a **hierarchical command-and-control multi-agent system** with **15 state-of-the-art agentic capabilities**. Instead of a single AI trying to do everything, you get a **Chief of Staff** that strategically delegates tasks through a **Deputy Chief of Staff** to **192 specialized agents** across **45 operational divisions**, backed by a full suite of advanced autonomous AI features.

---

## ✨ State-of-the-Art Agentic Capabilities (v4.5.0)

### 🧠 1. Vector Knowledge Base & Semantic Search
- **Embedding-based RAG**: Every conversation, code change, and decision is embedded into a 256-dim vector space
- **Semantic retrieval**: Find relevant context by meaning, not just keywords
- **Auto-indexing**: All agent outputs are automatically stored and indexed
- **Persistent**: Survives restarts — stored in `~/.rudrax/agent/vectors/`
- **Commands**: `/vector search`, `/vector status`, `/vector stats`

### 📡 2. Agent Communication Bus
- **Pub/sub messaging**: Agents publish to topics, subscribe to relevant ones
- **Direct messaging**: Agents can send private DMs to each other
- **Priority system**: Messages have low/normal/high/critical priority
- **Auto-subscribe**: All agents auto-subscribe to general, alerts, and handoffs
- **Commands**: `/bus send`, `/bus publish`, `/bus subscribe`, `/bus read`

### 🛡️ 3. Human-in-the-Loop Approval Gates
- **3-tier system**: L1 (info), L2 (warning with timeout), L3 (blocking)
- **12 gate categories**: FILE_DELETE, BASH_DESTRUCTIVE, DEPLOY, API_KEY_ACCESS, etc.
- **Auto-approve timeout**: L2 warnings auto-approve after configurable delay
- **Whitelist support**: Always-allow patterns for trusted operations
- **Commands**: `/gate status`, `/gate approve`, `/gate deny`, `/gate list`

### 🔍 4. Self-Reflection Engine
- **Pre-plan reflection**: Analyze execution plans before running them
- **Post-output reflection**: Evaluate response quality before delivery
- **Error analysis**: Root cause detection with prevention strategies
- **4-dimension scoring**: Confidence, Completeness, Correctness, Clarity
- **Commands**: `/reflect plan`, `/reflect output`, `/reflect error`

### 📊 5. Observability & Distributed Tracing
- **Full telemetry**: Every tool call, LLM request, and agent action is traced
- **Span-based tracing**: Waterfall visualization of operations
- **Agent utilization**: Track which agents are called most
- **Tool metrics**: Per-tool call counts, errors, and durations
- **Commands**: `/observe dashboard`, `/observe traces`, `/observe agents`

### 🌐 6. Web Search & Browsing
- **DuckDuckGo search**: No API key required
- **Page fetching**: Extract text content from any URL
- **Link extraction**: Follow links for deeper research
- **Caching**: 5-minute cache with TTL
- **Commands**: `/web search <query>`, `/web fetch <url>`

### ⚙️ 7. DAG Workflow Engine
- **Directed Acyclic Graphs**: Multi-step workflows with dependency tracking
- **Parallel lanes**: Independent steps run concurrently
- **Built-in workflows**: code-review, security-audit, bug-fix, deploy-check
- **Error handling**: Per-step fail/skip/retry/fallback policies
- **Commands**: `/workflow list`, `/workflow run`, `/workflow status`

### 🕸️ 8. Knowledge Graph
- **Entity-relationship store**: Track concepts, files, agents, and their connections
- **Relationship types**: depends_on, implements, references, creates, modifies
- **Neighbor queries**: Find connected entities
- **Graph export**: Visualize the knowledge graph
- **Commands**: `/kg add-node`, `/kg add-rel`, `/kg query`, `/kg neighbors`

### 🔧 9. Dynamic Tool Registry
- **Agent-created tools**: Agents can create new tools at runtime
- **4 tool types**: bash, javascript, composite, API wrapper
- **Persistent**: Tools survive restarts
- **Usage tracking**: See which tools are used most
- **Commands**: `/tool-registry create`, `/tool-registry list`, `/tool-registry show`

### 💰 10. Cost Tracker
- **Per-model pricing**: Accurate cost estimates for all major LLM providers
- **Daily/monthly budgets**: Set limits and get alerts
- **Token tracking**: Input and output token counts
- **Agent-level breakdown**: See which agents spend the most
- **Commands**: `/cost dashboard`, `/cost budget`, `/cost history`

### ⏰ 11. Task Scheduler
- **Recurring tasks**: Schedule agents, workflows, or bash commands
- **Flexible intervals**: Run every N minutes/hours/days
- **Max runs**: Auto-disable after N executions
- **Enable/disable**: Toggle tasks on the fly
- **Commands**: `/schedule add`, `/schedule list`, `/schedule enable`

### 🏆 12. Agent Evaluator
- **Standard suites**: code-gen, reasoning benchmarks
- **4-dimension scoring**: Accuracy, completeness, speed, clarity
- **Category breakdown**: See performance by category
- **Historical tracking**: Track agent improvement over time
- **Commands**: `/evaluate run`, `/evaluate suites`, `/evaluate stats`

### 🖼️ 13. Multi-Modal Engine
- **Image analysis**: Detect format, dimensions, size
- **Base64 encoding**: Convert files for API transmission
- **Format detection**: PNG, JPEG, GIF, BMP, WebP, PDF
- **Commands**: `/multimodal analyze`, `/multimodal encode`

### 🛡️ 14. Safety Guardrails
- **PII detection**: Emails, API keys, SSN, credit cards, private keys
- **Code safety**: eval, exec, rm -rf, dangerous SQL patterns
- **Consistency check**: Self-contradiction detection
- **Hallucination check**: Flag unsupported claims
- **Auto-redaction**: Redact PII before output
- **Commands**: `/guardrails check`, `/guardrails redact`

### 📦 15. Code Sandbox
- **6 languages**: JavaScript, TypeScript, Python, Bash, Go, Rust
- **Timeout protection**: Kill runaway processes after 30s
- **Filesystem isolation**: Temp directories cleaned up
- **Output capture**: stdout, stderr, exit code
- **Commands**: `/sandbox run`, `/sandbox status`

---

## ⚡ Command Hierarchy

```
                        👤 USER
                          │
                          ▼
            ┌─────────────────────────────┐
            │  🔱 RudraX-Chief of Staff   │  ← Strategic Commander
            │  Monitor · Delegate · Validate │
            └─────────────┬───────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │  🎛️ Deputy Chief of Staff  │  ← Operational Commander
            │  Plan · Spawn · Coordinate   │
            └─────────────┬───────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Squad A │   │  Squad B │   │ Agent N  │
    │  (Agents)│   │  (Agents)│   │ (Special)│
    └──────────┘   └──────────┘   └──────────┘
```

**Key Roles:**

| Role | Display Name | Responsibility |
|------|-------------|----------------|
| 🔱 | **RudraX-Chief of Staff** | Strategic oversight, delegation, final response delivery |
| 🎛️ | **Deputy Chief of Staff** | Mission planning, agent spawning, execution coordination |
| 🤖 | **192 Specialist Agents** | Domain-specific task execution across 45 categories |

---

## 🚀 Key Features

### 🧠 Autonomous Multi-Agent Orchestration
- **Active Plan System** — Real-time mission dashboard with task IDs, status, dependencies, priority
- **Hierarchical Delegation** — Tasks flow: User → Chief of Staff → Deputy → Squads/Agents
- **Parallel Execution** — Independent tasks run simultaneously for maximum throughput
- **Failure Recovery** — Auto-detection of crashes, stalls, timeouts with 3-attempt retry logic
- **Squad-Based Execution** — 9 pre-configured multi-agent teams for complex missions

### 🧠 Vector Knowledge Base & RAG
- **Semantic Memory**: Every interaction is embedded into a 256-dim vector space for meaning-based retrieval
- **Auto-Indexing**: Knowledge is automatically stored and made searchable across sessions
- **Cross-Agent Context**: Any agent can find relevant context from any other agent's work

### 📡 Agent Communication Bus
- **Pub/Sub Messaging**: Agents communicate via topics — publish findings, subscribe to relevant updates
- **Direct Messaging**: One-to-one agent communication for handoffs and coordination
- **Priority-based Delivery**: Critical messages are delivered first

### 🛡️ Approval Gates (Human-in-the-Loop)
- **3-Tier Safety**: L1 info, L2 warning with auto-timeout, L3 blocking (requires human approval)
- **12 Gate Categories**: File deletion, deployments, credential access, network ops, and more
- **Audit Trail**: All approvals/denials logged for compliance

### 🔍 Self-Reflection Engine
- **Pre-Execution Planning Review**: Plans are analyzed for gaps and risks before execution
- **Post-Execution Quality Check**: Outputs are scored on confidence, completeness, correctness, clarity
- **Error Analysis**: Root cause identification with prevention strategies

### 📊 Full Observability
- **Distributed Tracing**: Every operation is traced from initiation to completion
- **Live Metrics Dashboard**: Active traces, span durations, error rates, agent utilization
- **Waterfall Visualization**: See the exact execution timeline of any operation

### 🌐 Web Search & Browsing
- **Live Web Search**: DuckDuckGo integration (no API key needed)
- **Page Fetching**: Extract and read web page content
- **Caching**: 5-minute TTL for repeated queries

### ⚙️ DAG Workflow Engine
- **Multi-Step Automation**: Define complex workflows with conditional branching and parallel steps
- **4 Built-in Workflows**: code-review, security-audit, bug-fix, deploy-check
- **Error Policies**: Per-step fail/skip/retry/fallback behavior

### 🕸️ Knowledge Graph
- **Entity-Relationship Store**: Track how concepts, files, agents, and decisions connect
- **Relationship Typing**: depends_on, implements, references, creates, modifies
- **Graph Traversal**: Find paths and neighbors between entities

### 🔧 Dynamic Tool Registry
- **Agent-Created Tools**: Agents can create new bash/JavaScript/composite tools at runtime
- **Persistent Registry**: Tools survive restarts and are available to all agents
- **Usage Analytics**: Track which tools are most valuable

### 💰 Cost Tracking & Budget Management
- **Per-Provider Pricing**: Accurate cost estimates for OpenAI, Anthropic, Google, Ollama
- **Budget Limits**: Set daily/monthly spending caps with alerts
- **Agent-Level Attribution**: See which agents drive the most cost

### ⏰ Task Scheduler
- **Recurring Automation**: Schedule agents, workflows, or commands to run on intervals
- **Flexible Timing**: Minutes to days between executions
- **Run Limits**: Auto-disable after N runs

### 🏆 Agent Evaluation Suite
- **Standard Benchmarks**: Code generation quality, reasoning accuracy
- **4-Dimension Scoring**: Accuracy, completeness, speed, clarity
- **Historical Trends**: Track agent improvement over time

### 🖼️ Multi-Modal Processing
- **Image Analysis**: Format detection, dimension extraction, size calculation
- **File Encoding**: Base64 conversion for API transmission

### 🛡️ Safety Guardrails
- **PII Detection & Redaction**: Emails, API keys, SSN, credit cards, private keys
- **Code Safety Scanning**: Dangerous patterns (eval, rm -rf, SQL injection)
- **Consistency Checking**: Self-contradiction detection
- **Hallucination Checking**: Unsupported claim flagging

### 📦 Code Sandbox (Secure Execution)
- **6 Languages**: JavaScript, TypeScript, Python, Bash, Go, Rust
- **Isolated Environment**: Temp directories cleaned up after execution
- **Timeout Protection**: Runaway processes are killed

### 💻 Dual Interfaces
- **TUI (Terminal UI)** — Lightning-fast terminal interface with syntax highlighting, diff previews, code editing
- **WebUI** — Browser-based command center at `http://localhost:5555` with real-time updates

### 🌐 WebUI Command Center
- **Real-time Streaming** — Socket.IO primary channel with polling fallback
- **Agent Activity Terminal** — Live streaming of all agent operations
- **File Upload** — Drag-and-drop with 10MB per file support
- **Orchestrator Panel** — Permanent side panel for Active Plan management
- **Steering System** — Mid-execution task steering and follow-up
- **Session Persistence** — Auto-restore across page reloads
- **IST Timezone** — All timestamps in Asia/Kolkata (UTC+5:30)
- **JWT Authentication** — Secure login with PBKDF2-SHA512 password hashing
- **Responsive Design** — Works on desktop, tablet, and mobile

### 🔧 Development Tools
- **Precise Code Editing** — `edit` tool with exact text replacement
- **File Operations** — read, write, find, grep, ls
- **Bash Execution** — Sandboxed command execution
- **Markdown Rendering** — Rich output with syntax-highlighted code blocks
- **Diff Preview** — Before/after change visualization

### 🎨 Rudraksh Theme
- Dark sacred color palette (gold, deep purple, teal)
- Shimmer animations for active states
- Custom scrollbars and terminal styling
- Accessible color contrast ratios

---

## 📦 Installation

### Prerequisites
- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- Optional: **Ollama** for local models

### Quick Install

```bash
# Clone the repository
git clone https://github.com/iamlalitpandit/RudraX.git
cd RudraX

# Install dependencies
npm install

# Start the WebUI
npm run webui
```

### Global Install

```bash
npm install -g .
rudrax
```

---

## 🖥️ Usage

### WebUI Mode (Recommended)

```bash
# Start on default port 5555
npm run webui

# Custom port
RUDRAX_WEBUI_PORT=8080 npm run webui

# Development mode with auto-restart
npm run webui:dev
```

Open **http://localhost:5555** in your browser.

**Default Login:** `admin` / `password`

### TUI Mode

```bash
# Interactive terminal mode
rudrax

# Or
npm start
```

### Docker

```bash
docker-compose -f docker/docker-compose.yml up
```

---

## 👥 The Full Army — 192 Agents

### 📊 Agent Distribution

| # | Category | Count | Description |
|---|----------|-------|-------------|
| 1 | Marketing | 23 | Growth hackers, SEO, social media, content, China market specialists |
| 2 | Engineering | 29 | Frontend, backend, DevOps, security, mobile, AI, firmware, SRE |
| 3 | Specialized | 10 | MCP builder, civil engineer, document generator, Salesforce architect |
| 4 | Sales | 9 | Outreach, deal strategy, pipeline analysis, proposals, coaching |
| 5 | Testing | 8 | Evidence QA, API testing, performance, reality checker, workflow |
| 6 | Design | 8 | UX architect, UI designer, brand guardian, visual storyteller |
| 7 | Paid Media | 7 | PPC strategist, programmatic buyer, tracking specialist, auditor |
| 8 | Support | 4 | Customer service, analytics, infrastructure maintainer |
| 9 | Project Mgmt | 6 | Senior PM, Jira steward, studio producer, experiment tracker |
| 10 | Workflow | 5 | Pre-built workflows: startup MVP, landing page, book chapter |
| 11 | Product | 5 | Product manager, sprint prioritizer, feedback synthesizer |
| 12 | Finance | 5 | Bookkeeper, financial analyst, FP&A, investment, tax strategist |
| 13 | Academic | 5 | Anthropologist, historian, psychologist, geographer, narratologist |
| 14 | Unreal Engine | 4 | Systems engineer, multiplayer architect, technical artist, world builder |
| 15 | Unity | 4 | Architect, editor tools, multiplayer, shader graph artist |
| 16 | XR/Spatial | 3 | Immersive developer, interface architect, cockpit specialist |
| 17 | Roblox | 3 | Systems scripter, experience designer, avatar creator |
| 18 | Legal | 3 | Document review, client intake, billing & time tracking |
| 19 | Godot | 3 | Gameplay scripter, multiplayer engineer, shader developer |
| 20 | Healthcare | 2 | Customer service, marketing compliance |
| 21 | Game Dev | 2 | Audio engineer, game designer |
| — | +31 others | 31 | Command, government, education, language, data, knowledge, Blender, LSP, and more |
| | **TOTAL** | **179** | |

### 🎖️ Pre-Built Squads (Multi-Agent Teams)

| Squad | Purpose | Agent Count |
|-------|---------|-------------|
| 🚀 `startup` | Startup MVP development | 8 agents |
| 🏢 `enterprise` | Enterprise feature delivery | 10 agents |
| 📦 `fullproduct` | Full product lifecycle | 12 agents |
| 🔒 `security` | Security audit & hardening | 6 agents |
| ✅ `qalead` | QA-led quality assurance | 7 agents |
| 🤖 `aiinfra` | AI infrastructure & MLOps | 5 agents |
| ⛓️ `web3` | Web3 & blockchain development | 7 agents |
| 📈 `growth` | Growth & marketing operations | 8 agents |
| 🚨 `incident` | Incident response & recovery | 6 agents |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **AI Backend** | pi-agent-session SDK |
| **TUI Framework** | pi-tui (custom terminal UI) |
| **Web Server** | Express 5 + Socket.IO 4 |
| **Auth** | JWT (HS256) + PBKDF2-SHA512 (native crypto) |
| **Markdown** | marked.js |
| **Terminal** | xterm.js (WebUI) |
| **Providers** | OpenAI, Anthropic, Google Gemini, AWS Bedrock, Ollama |
| **Vector Engine** | Custom 256-dim embedding (in-process, no external deps) |
| **Knowledge Graph** | Custom JSON graph store with traversal |
| **Workflow Engine** | Custom DAG scheduler with parallel lanes |
| **Messaging** | Custom pub/sub bus with priority queuing |
| **Web Search** | DuckDuckGo HTML scrape (no API key) |
| **Sandbox** | Child process with timeout, isolation, cleanup |
| **Deployment** | Docker, PM2, systemd |

---

## 📁 Project Structure

```
RudraX/
├── bin/                    # CLI executables
│   └── rudrax             # Main entry point
├── deploy/                 # Deployment configs
│   └── rudrax-webui.service  # systemd service
├── docker/                 # Docker configs
│   ├── docker-compose.yml
│   └── Dockerfile
├── docs/                   # Complete documentation
│   ├── extensions.md      # Extension development
│   ├── custom-provider.md # Custom AI providers
│   ├── models.md          # Model configuration
│   ├── themes.md          # Theme system
│   ├── skills.md          # Agent skills system
│   ├── tui.md             # TUI components
│   ├── sdk.md             # SDK integrations
│   └── ...                # 16 more docs
├── lib/                    # Core engine
│   ├── core/              # Agent session, tools, compaction
│   ├── cli/               # CLI argument parsing
│   └── modes/             # TUI interaction modes
├── tools/                  # Agent tools & extensions
│   ├── agency/            # 191 agent skill files + advanced capabilities
│   │   ├── agency-manager.ts        # Agent activation & management
│   │   ├── agency-orchestrator.ts   # Multi-agent orchestration
│   │   ├── shared-memory.ts         # Cross-agent memory
│   │   ├── vector-knowledge.ts      # 🧠 Semantic search & RAG
│   │   ├── communication-bus.ts     # 📡 Pub/sub agent messaging
│   │   ├── approval-gates.ts        # 🛡️ Human-in-the-loop safety
│   │   ├── reflection-engine.ts     # 🔍 Self-critique & quality
│   │   ├── observability.ts         # 📊 Tracing & monitoring
│   │   ├── web-search.ts            # 🌐 Live web intelligence
│   │   ├── workflow-engine.ts       # ⚙️ DAG workflows
│   │   ├── knowledge-graph.ts       # 🕸️ Entity relationships
│   │   ├── tool-registry.ts         # 🔧 Dynamic tool creation
│   │   ├── cost-tracker.ts          # 💰 LLM spend analytics
│   │   ├── task-scheduler.ts        # ⏰ Recurring tasks
│   │   ├── agent-evaluator.ts       # 🏆 Benchmarking
│   │   ├── multi-modal.ts           # 🖼️ Image processing
│   │   ├── guardrails.ts            # 🛡️ Content filtering
│   │   └── code-sandbox.ts          # 📦 Secure execution
│   └── integrated/        # Integrated tool suite
├── webui/                  # Web Interface
│   ├── server.js          # Express + Socket.IO server
│   ├── index.html         # Main web app
│   ├── css/index.css      # Rudraksh theme styles
│   ├── js/app.js          # Client-side logic
│   └── js/terminal.js     # xterm.js integration
├── package.json
└── README.md
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Keybindings](docs/keybindings.md) | Keyboard shortcuts |
| [TUI Components](docs/tui.md) | Terminal UI API |
| [Extensions](docs/extensions.md) | Building custom extensions |
| [Custom Providers](docs/custom-provider.md) | Adding AI providers |
| [Models](docs/models.md) | Model configuration |
| [Themes](docs/themes.md) | Theme system & colors |
| [Skills](docs/skills.md) | Agent skill development |
| [SDK](docs/sdk.md) | SDK integrations |
| [Settings](docs/settings.md) | Configuration options |
| [Terminal Setup](docs/terminal-setup.md) | Terminal compatibility |
| [Development](docs/development.md) | Dev environment setup |
| [WebUI README](webui/README.md) | WebUI-specific docs |

---

## 📦 Releases & Changelog

### v4.5.0 (Latest) — 🧠 Memory System + Hermes Integration

> **Release Date:** May 2026  
> **Commit:** [`0c81d0d`](https://github.com/iamlalitpandit/RudraX/commit/0c81d0d)

**✨ Major Upgrades:**

| Category | What's New |
|----------|-----------|
| 🧠 **Evolving Memory** | Self-learning system with pattern detection, auto-skill creation, frozen snapshots |
| 🔎 **Vector Knowledge Base** | 256-dim semantic search & RAG engine with persistent storage |
| 🤖 **Hermes Integration** | 170 Hermes agent skills ported (total 349 agency agents) |
| 🛡️ **Cybersecurity Dashboard** | Live threat simulation, real-time monitoring, attack analytics |
| 🎨 **WebUI Overhaul** | 20+ new features, Rudraksh theme, socket streaming |
| 🔧 **15 SOTA Capabilities** | Full suite: Approval Gates, Reflection, Observability, Web Search, etc. |

**📦 Full Changelog:**

```
Added:
  - tools/agency/evolving-memory.ts        — Self-learning AI memory
  - tools/agency/vector-knowledge.ts       — Semantic search & RAG
  - tools/agency/shared-memory.ts          — Cross-agent comms
  - tools/agency/communication-bus.ts      — Pub/sub messaging
  - tools/agency/approval-gates.ts         — HITL safety gates
  - tools/agency/reflection-engine.ts      — Self-critique engine
  - tools/agency/observability.ts          — Distributed tracing
  - tools/agency/web-search.ts             — Live web intelligence
  - tools/agency/workflow-engine.ts        — DAG workflow scheduler
  - tools/agency/knowledge-graph.ts        — Entity relationship store
  - tools/agency/tool-registry.ts          — Dynamic tool creation
  - tools/agency/cost-tracker.ts           — LLM spend analytics
  - tools/agency/task-scheduler.ts         — Recurring automation
  - tools/agency/agent-evaluator.ts        — Benchmarking suite
  - tools/agency/multi-modal.ts            — Image/file processing
  - tools/agency/guardrails.ts             — PII/Safety filtering
  - tools/agency/code-sandbox.ts           — Secure code execution
  - tools/agency/skills/                   — 170 Hermes skills
  - cybersecurity-dashboard/               — Live threat monitor
  - HERMES_INTEGRATION.md                  — Integration guide
  - EVOLVING_MEMORY_README.md              — Memory documentation

Updated:
  - README.md → v4.5.0 with full docs
  - package.json → v4.5.0 | @imlalitpandit/* packages
  - webui/server.js → 20 new API features
  - webui/index.html → Security dashboard, new panels
  - webui/js/app.js → Real-time threat feed, agent activity
  - webui/css/index.css → Rudraksh theme enhancements
```

### v4.0.0 — Multi-Agent System Launch

> Initial release of the RudraX Army hierarchical command system with 179 agents, 9 squads, and basic orchestration.

### v3.0.0 — pi-agent-sdk Migration

> Migrated to @imlalitpandit/pi-* packages with WebUI, TUI, and core agent framework.

### v2.0.0 — Agent Framework

> First public release with basic agent system and terminal interface.

### v1.0.0 — Initial Prototype

> Foundation release with core chat and tool execution.

> 🔮 **Next Up: v5.0** — Self-evolving agents with autonomous skill generation

---

## 🔐 Security

- **Authentication**: JWT-based with HS256 (Node.js native `crypto`)
- **Password Hashing**: PBKDF2-SHA512 with 100,000 iterations + unique salt
- **Auth Store**: `~/.rudrax/webui-auth.json`
- **Session Persistence**: Token stored in localStorage as `rudrax_token`
- **All API routes protected** except `/api/health`
- **Socket.IO auth middleware** on every connection
- **401 auto-logout** on expired/invalid tokens

---

## 🌍 Multi-Provider AI Support

RudraX Army supports multiple AI providers out of the box:

| Provider | Setup |
|----------|-------|
| **OpenAI** | `OPENAI_API_KEY=sk-...` |
| **Anthropic** | `ANTHROPIC_API_KEY=sk-ant-...` |
| **Google Gemini** | `GOOGLE_API_KEY=...` |
| **AWS Bedrock** | AWS credentials + region |
| **Ollama** (local) | `ollama pull <model>` |

Configure via environment variables or the built-in settings system.


---

## 📋 Quick Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/agency list` | List all specialization agents | `/agency list` |
| `/agency activate <name>` | Activate an agent personality | `/agency activate eng-frontend` |
| `/agency squad <name>` | Activate multi-agent squad | `/agency squad startup` |
| `/vector search <query>` | Semantic search across memory | `/vector search auth impl` |
| `/bus send <agent> <msg>` | Direct message another agent | `/bus send backend review API` |
| `/bus publish <topic> <msg>` | Broadcast to a topic | `/bus publish status done` |
| `/gate status` | Check approval gates | `/gate status` |
| `/gate approve <id>` | Approve a blocked operation | `/gate approve gate_abc` |
| `/reflect plan <content>` | Self-reflect on a plan | `/reflect plan my plan` |
| `/observe dashboard` | Show observability dashboard | `/observe dashboard` |
| `/web search <query>` | Search the web | `/web search React docs` |
| `/workflow run <name>` | Execute a workflow | `/workflow run code-review` |
| `/kg add-node <type> <name>` | Add knowledge graph entity | `/kg add-node concept Auth` |
| `/schedule add <type> <name> <min>` | Schedule recurring task | `/schedule add agent review 60` |
| `/evaluate run <suite>` | Run evaluation suite | `/evaluate run code-gen` |
| `/cost dashboard` | Show LLM cost analytics | `/cost dashboard` |
| `/sandbox run <lang> <code>` | Execute code in sandbox | `/sandbox run js log` |
| `/guardrails check <content>` | Validate output safety | `/guardrails check my api key` |
| `/tool-registry create <type> <name> <code>` | Create a custom tool | `/tool-registry create bash deploy` |
| `/multimodal analyze <file>` | Analyze an image/file | `/multimodal analyze screenshot.png` |
| `/help-agency` | Show full command reference | `/help-agency` |

---

## 👤 Developer

<p align="center">
  <strong>Lalit Pandit</strong><br>
  <em>Creator & Lead Developer of RudraX Army</em>
</p>

<p align="center">
  <a href="https://github.com/iamlalitpandit"><img src="https://img.shields.io/badge/GitHub-iamlalitpandit-181717?logo=github" alt="GitHub"></a>
  <a href="https://t.me/imlalitpandit"><img src="https://img.shields.io/badge/Telegram-@imlalitpandit-26A5E4?logo=telegram" alt="Telegram"></a>
  <a href="https://instagram.com/imlalitpandit"><img src="https://img.shields.io/badge/Instagram-@imlalitpandit-E4405F?logo=instagram" alt="Instagram"></a>
  <a href="mailto:lalittheonly@gmail.com"><img src="https://img.shields.io/badge/Email-lalittheonly@gmail.com-D14836?logo=gmail" alt="Email"></a>
  <a href="https://rudrax.cloud"><img src="https://img.shields.io/badge/Web-rudrax.cloud-4285F4?logo=google-chrome" alt="Website"></a>
</p>

---

## 📄 License

MIT License

Built on **Mario Zechner's** `pi-coding-agent` framework (AGPL-3.0)

---

## 🙏 Acknowledgments

- **Mario Zechner** — Original `pi-coding-agent` framework and pi-* ecosystem
- **The Agency** — Agent personality framework ([agency-agents](https://github.com/msitarzewski/agency-agents))
- **All Contributors** — Who make RudraX Army stronger every day

---

<p align="center">
  🔱 <strong>RudraX Army — Build · Break · Deploy · Conquer</strong> 🔱<br>
  <sub>v4.5.0 | 192 Agents | 45 Divisions | 9 Squads</sub>
</p>
