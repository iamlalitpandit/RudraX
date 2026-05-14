# 🔱 RudraX Army v4.1.0

<p align="center">
  <strong>Build · Break · Deploy · Orchestrate</strong><br>
  <em>A Hierarchical Multi-Agent Command System with 179 AI Specialists</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.1.0-gold" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/agents-179-orange" alt="Agents">
  <img src="https://img.shields.io/badge/squads-9-purple" alt="Squads">
  <img src="https://img.shields.io/badge/categories-45-red" alt="Categories">
</p>

---

## 🎯 What is RudraX Army?

**RudraX Army** is not just another AI coding agent — it's a **hierarchical command-and-control multi-agent system**. Instead of a single AI trying to do everything, you get a **Chief of Staff** that strategically delegates tasks through a **Deputy Chief of Staff** to **192 specialized agents** across **45 operational divisions**.

Think of it as your personal AI army — you give the command, and the entire chain of command executes with precision.

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

## 👥 The Full Army — 179 Agents

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
│   ├── agency/            # 191 agent skill files
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

## 👤 Developer

<p align="center">
  <strong>Lalit Pandit</strong><br>
  <em>Creator & Lead Developer of RudraX Army</em>
</p>

<p align="center">
  <a href="https://t.me/imlalitpandit"><img src="https://img.shields.io/badge/Telegram-@imlalitpandit-26A5E4?logo=telegram" alt="Telegram"></a>
  <a href="https://instagram.com/imlalitpandit"><img src="https://img.shields.io/badge/Instagram-@imlalitpandit-E4405F?logo=instagram" alt="Instagram"></a>
  <a href="mailto:admin@rudrax.cloud"><img src="https://img.shields.io/badge/Email-admin@rudrax.cloud-D14836?logo=gmail" alt="Email"></a>
  <a href="https://www.lalitpandit.in"><img src="https://img.shields.io/badge/Web-www.lalitpandit.in-4285F4?logo=google-chrome" alt="Website"></a>
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
  <sub>v4.1.0 | 179 Agents | 45 Divisions | 9 Squads</sub>
</p>
