# RudraX - Build Break Deploy 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/AI-Agent-RudraX-orange" alt="AI Agent">
</p>

**RudraX** is an interactive terminal-based AI coding agent that helps developers build, break, and deploy applications through natural language commands. Built on top of Mario Zechner's `pi-coding-agent` framework.

## ✨ Features

- 🤖 **AI-Powered Coding** - Natural language to code generation
- 🎨 **Interactive TUI** - Beautiful terminal interface
- 🔧 **Multi-Provider Support** - OpenAI, Anthropic, Google Gemini, AWS Bedrock, Ollama
- 📦 **Extension System** - Extensible agents, squads, and workflows
- 💻 **Cross-Platform** - Works on Linux, macOS, Windows (WSL/Termux)

## 📦 Installation

```bash
# Install globally
npm install -g rudrax

# Or from source
git clone https://github.com/lalitpandit/rudrax.git
cd rudrax
npm install
npm run install-global
```

## 🚀 Quick Start

```bash
# Start RudraX
rudrax

# Or with npx
npx rudrax
```

## 🛠️ Configuration

Create a `.env` file or set environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GOOGLE_API_KEY=AIza...
```

Or use built-in OAuth login:
```bash
rudrax login openai
rudrax login anthropic
```

## 📚 Documentation

- [Getting Started](docs/development.md)
- [Keybindings](docs/keybindings.md)
- [TUI Components](docs/tui.md)
- [Extensions](docs/extensions.md)
- [Custom Providers](docs/custom-provider.md)
- [Settings](docs/settings.md)

## 🏗️ Architecture

```
rudrax/
├── lib/           # Core application
│   ├── main.js    # Entry point
│   ├── cli.js     # CLI commands
│   ├── config.js  # Configuration
│   └── core/      # Core modules
│       ├── extensions/   # Extension system
│       ├── modes/        # TUI modes
│       └── utils/        # Utilities
├── bin/           # Executables
├── docs/          # Documentation
└── .rudrax/       # Runtime config
```

## 🔌 Available Extensions

### AI Operating Systems
- **RudraX AIOS** - AI Operating System for autonomous task execution

### Agency Agents (186+ AI Specialists) + Autonomous Orchestrator
- **🧠 Orchestrator** — Analyzes prompts, plans execution lanes, dispatches to specialized agents, monitors completion
- **🚀 Parallel Dispatch** — Multiple agents run simultaneously for maximum speed
- **📋 Execution Plans** — Dependency-aware lane system (Lane 1 parallel → Lane 2 → ...)
- **Engineering** — Frontend, Backend, DevOps, Security, Mobile, AI, SRE (29 agents)
- **Marketing** — Growth, SEO, Content, Social Media, TikTok, LinkedIn (30 agents)
- **Design** — UX Architect, UI Designer, Brand Guardian (8 agents)
- **Specialized** — MCP Builder, Legal, Healthcare, Blockchain (41 agents)
- **Game Dev** — Unity, Unreal, Godot, Blender (20 agents)
- **Finance** — Analysts, Bookkeeper, Tax Strategist (5 agents)
- **+9 more divisions** — Academic, Product, Sales, Testing, Support, etc.
- **NEXUS Orchestrator** — Multi-agent coordination with playbooks & runbooks
- **9 Pre-defined Squads** — Startup, Enterprise, Security, QA, AI, Web3, Growth, Incident
- See [tools/agency/README.md](tools/agency/README.md) for full list and setup

### Squads (Multi-Agent Teams)
- `team-all` - Full development squad
- `team-fullstack` - Web fullstack team
- `team-ide-minimal` - Minimal IDE squad
- `team-no-ui` - Backend only squad
- `team-qa-focused` - QA focused team

### Workflows
- `greenfield-service` - New service development
- `brownfield-service` - Existing service enhancement
- `brownfield-ui` - UI development workflow
- `qa-loop` - Quality assurance cycle
- `spec-pipeline` - Specification-driven development

## ⌨️ Keybindings

| Key | Action |
|-----|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+G` | Toggle grid mode |
| `Ctrl+L` | Toggle list mode |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save/Search |
| `Tab` | Auto-complete |
| `Esc` | Close popup/Cancel |

## 📄 License

MIT License - Based on Mario Zechner's `@mariozechner/pi-coding-agent` (AGPL-3.0)

## 🙏 Acknowledgments

- **Mario Zechner** - Original `pi-coding-agent` framework
- **Contributors** - Who make RudraX better

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/lalitpandit">Lalit Pandit</a>
</p>
