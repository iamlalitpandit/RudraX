# 🔧 RudraX Tools — Systematic Organization

> **v2.0** — All tools, agents, tasks, workflows, and squads organized by category

---

## 📊 Architecture Overview

```
RudraX
├── lib/core/                          # Core Engine
│   ├── tools/                          # 🛠️ Built-in Agent Tools
│   │   ├── bash.js                     # Command execution
│   │   ├── read.js                     # File reading
│   │   ├── write.js                    # File writing
│   │   ├── edit.js                     # Precise file editing
│   │   ├── grep.js                     # Content search
│   │   ├── find.js                     # File finding
│   │   └── ls.js                       # Directory listing
│   ├── extensions/rudrax-aios/         # 🤖 AIOS Extension
│   │   ├── aios-master.ts             # 👑 Master Orchestrator
│   │   ├── dev.ts                      # 💻 Full Stack Developer
│   │   ├── architect.ts               # 🏗️ System Architect
│   │   ├── qa.ts                       # ✅ Quality Advisor
│   │   ├── pm.ts                       # 📋 Project Manager
│   │   ├── po.ts                       # 🎯 Product Owner
│   │   ├── sm.ts                       # 🔄 Scrum Master
│   │   ├── analyst.ts                  # 📊 Business Analyst
│   │   ├── devops.ts                   # 🚀 DevOps Specialist
│   │   ├── data-engineer.ts           # 🗄️ Database Engineer
│   │   ├── ux-design-expert.ts        # 🎨 UX/UI Designer
│   │   ├── squad-creator.ts           # 👥 Squad Creator
│   │   ├── tasks/                      # 📋 80+ Task Definitions
│   │   ├── workflows/                  # 🔄 14 Workflow Definitions
│   │   └── squads/                     # 👥 5 Squad Configurations
│   └── ... (cli, utils, sessions, etc.)
├── tools/                              # 🔌 Integrated Tools
│   ├── rudrax-tools.json              # Master Configuration (v2.0)
│   ├── bin/rudrax-tools               # CLI Entry Point
│   ├── lib/rudrax-tools.js            # JavaScript API
│   ├── launchers/                      # Shell Launchers
│   ├── integrated/                     # Tool Binaries
│   │   ├── codex/                      # OpenAI Codex
│   │   ├── claude-code/               # Claude Code
│   │   ├── code-server/               # VS Code Server
│   │   ├── ripgrep/                   # Search Utility
│   │   └── @orchids/                  # Integration Adapters
│   └── .code-server-config/           # Code-Server Config
├── docs/                               # 📄 Documentation
└── .rudrax/                            # Project Config
```

---

## 🛠️ 1. Built-in Agent Tools

These tools are always available inside RudraX sessions:

| Category | Tool | Description |
|----------|------|-------------|
| 📁 File Operations | `read` | Read file contents (text + images) |
| | `write` | Create or overwrite files |
| | `edit` | Precise text replacement in files |
| ⚡ System | `bash` | Execute shell commands with timeout |
| 🔍 Search & Explore | `grep` | Search file contents with regex |
| | `find` | Find files matching patterns |
| | `ls` | List directory contents |

---

## 🤖 2. AI Assistants

### OpenAI Codex CLI
```bash
rudrax tools codex [args...]
rudrax tools codex --help
```

### Claude Code CLI
```bash
rudrax tools claude [args...]
rudrax tools claude --help
```

### Ollama Bridge
```bash
# Direct prompt
rudrax tools ollama "Write a Python function to calculate factorial"

# List models
rudrax tools models
```

**Available Models:** `minimax-m2.7:cloud`, `kimi-k2.6:cloud` (default: kimi-k2.6:cloud)

---

## 💻 3. IDE & Server

### VS Code Server (Code-Server)
```bash
# Default port 8080
rudrax tools server

# Custom port
rudrax tools server 9090
```

Open browser: `http://127.0.0.1:8080` (auth: none)

---

## 🔍 4. Search & Utility

### Ripgrep
```bash
rudrax tools rg "function" ./src
rudrax tools rg "TODO" . --files-with-matches
```

---

## 🔌 5. Adapters & Integration

```javascript
import { rudraxTools } from './tools/lib/rudrax-tools.js';

// Load adapters
const codexAdapter = await rudraxTools.loadCodexAdapter();
const claudeAdapter = await rudraxTools.loadClaudeAdapter();
```

---

## 👥 6. AIOS Agents

### 👑 Orchestration

| Agent | Icon | Description |
|-------|------|-------------|
| `aios-master` | 👑 | Master Orchestrator & Framework Developer — coordinates all agents and workflows |

### 🏗️ Architecture & Design

| Agent | Icon | Description |
|-------|------|-------------|
| `architect` | 🏗️ | System architecture analysis, impact assessment, and design decisions |
| `ux-design-expert` | 🎨 | Design system architect, wireframes, user research, and token extraction |

### 💻 Development

| Agent | Icon | Description |
|-------|------|-------------|
| `dev` | 💻 | Story development, code quality, refactoring, and performance optimization |
| `data-engineer` | 🗄️ | Database architecture, migrations, schema audits, and data operations |

### 📊 Analysis & Strategy

| Agent | Icon | Description |
|-------|------|-------------|
| `analyst` | 📊 | Brainstorming facilitation, cross-artifact analysis, and ROI calculation |

### ✅ Quality Assurance

| Agent | Icon | Description |
|-------|------|-------------|
| `qa` | ✅ | Test design, security scanning, migration validation, and evidence-based quality |

### 📋 Product & Project Management

| Agent | Icon | Description |
|-------|------|-------------|
| `pm` | 📋 | Project coordination, documentation, and delivery management |
| `po` | 🎯 | Backlog management, story creation, sprint planning, and acceptance criteria |
| `sm` | 🔄 | Sprint facilitation, story prioritization, and team coordination |

### 🚀 DevOps & Infrastructure

| Agent | Icon | Description |
|-------|------|-------------|
| `devops` | 🚀 | GitHub management, CI/CD configuration, and infrastructure automation |

### 👥 Squad Management

| Agent | Icon | Description |
|-------|------|-------------|
| `squad-creator` | 👥 | Agent team design, validation, and coordination for multi-agent workflows |

---

## 📋 7. AIOS Tasks (80+)

### 🏗️ Architecture & Analysis (7 tasks)
| Task | Description |
|------|-------------|
| `architect-analyze-impact` | System change impact assessment |
| `analyze-brownfield` | Analyze existing project structure |
| `analyze-cross-artifact` | Cross-artifact consistency analysis |
| `analyze-framework` | Framework compatibility analysis |
| `analyze-performance` | Performance analysis |
| `analyze-project-structure` | Project structure analysis |
| `advanced-elicitation` | Advanced requirement elicitation |

### 💻 Development (17 tasks)
| Task | Description |
|------|-------------|
| `build` | Standard build task |
| `build-autonomous` | Autonomous build execution |
| `build-component` | Component-level build |
| `build-resume` | Resume interrupted build |
| `build-status` | Build status check |
| `dev-apply-qa-fixes` | Apply QA-identified fixes |
| `dev-backlog-debt` | Manage technical debt backlog |
| `dev-develop-story` | Develop user story |
| `dev-improve-code-quality` | Code quality improvements |
| `dev-optimize-performance` | Performance optimization |
| `dev-suggest-refactoring` | Refactoring suggestions |
| `dev-validate-next-story` | Validate next story readiness |
| `compose-molecule` | Compose molecular units |
| `extend-pattern` | Extend existing patterns |
| `create-service` | Create new service |
| `collaborative-edit` | Collaborative editing |
| `correct-course` | Course correction |

### 🗄️ Database Operations (20 tasks)
| Task | Description |
|------|-------------|
| `db-analyze-hotpaths` | Hot path analysis |
| `db-apply-migration` | Apply database migration |
| `db-bootstrap` | Bootstrap database setup |
| `db-domain-modeling` | Domain modeling |
| `db-dry-run` | Dry-run migration |
| `db-env-check` | Environment check |
| `db-explain` | Query explain analysis |
| `db-impersonate` | Role impersonation |
| `db-load-csv` | Load CSV data |
| `db-policy-apply` | Apply RLS policies |
| `db-rls-audit` | Row-level security audit |
| `db-rollback` | Rollback migration |
| `db-run-sql` | Execute SQL |
| `db-schema-audit` | Schema audit |
| `db-seed` | Seed test data |
| `db-smoke-test` | Smoke test database |
| `db-snapshot` | Database snapshot |
| `db-squad-integration` | Squad DB integration |
| `db-supabase-setup` | Supabase setup |
| `db-verify-order` | Verify migration order |

### ✅ Quality & Testing (7 tasks)
| Task | Description |
|------|-------------|
| `apply-qa-fixes` | Apply QA fixes |
| `qa-create-fix-request` | Create fix request |
| `qa-evidence-requirements` | Evidence-based requirements |
| `qa-migration-validation` | Migration validation |
| `qa-trace-requirements` | Requirements traceability |
| `security-scan` | Security vulnerability scan |
| `execute-checklist` | Execute quality checklist |

### 📋 Product & Project Management (9 tasks)
| Task | Description |
|------|-------------|
| `brownfield-create-epic` | Create epic for existing project |
| `brownfield-create-story` | Create story for existing project |
| `create-brownfield-story` | Create brownfield user story |
| `create-next-story` | Create next user story |
| `create-task` | Create new task |
| `sm-create-next-story` | Scrum Master: next story |
| `calculate-roi` | ROI calculation |
| `execute-epic-plan` | Execute epic-level plan |
| `story-checkpoint` | Story checkpoint save |

### 🚀 DevOps & Infrastructure (6 tasks)
| Task | Description |
|------|-------------|
| `ci-cd-configuration` | CI/CD pipeline setup |
| `cleanup-utilities` | Clean up utility files |
| `cleanup-worktrees` | Clean up git worktrees |
| `create-worktree` | Create new git worktree |
| `environment-bootstrap` | Bootstrap environment |
| `add-mcp` | Add MCP integration |

### 📄 Documentation (9 tasks)
| Task | Description |
|------|-------------|
| `create-doc` | Create new documentation |
| `document-gotchas` | Document gotchas & pitfalls |
| `document-project` | Full project documentation |
| `generate-documentation` | Auto-generate docs |
| `generate-ai-frontend-prompt` | Generate AI frontend prompt |
| `index-docs` | Index documentation |
| `check-docs-links` | Check documentation links |
| `sync-documentation` | Sync documentation |
| `create-deep-research-prompt` | Deep research prompt creation |

### 🎨 Design System (8 tasks)
| Task | Description |
|------|-------------|
| `bootstrap-shadcn-library` | Bootstrap shadcn/ui library |
| `audit-tailwind-config` | Audit Tailwind configuration |
| `extract-patterns` | Extract design patterns |
| `extract-tokens` | Extract design tokens |
| `learn-patterns` | Learn and catalog patterns |
| `consolidate-patterns` | Consolidate patterns |
| `export-design-tokens-dtcg` | Export DTCG design tokens |
| `deprecate-component` | Deprecate a component |

### 🤖 AIOS Agent & Squad (6 tasks)
| Task | Description |
|------|-------------|
| `create-agent` | Create new AIOS agent |
| `create-suite` | Create test suite |
| `create-workflow` | Create new workflow |
| `squad-creator-design` | Design a squad |
| `squad-creator-extend` | Extend squad configuration |
| `squad-creator-validate` | Validate squad setup |

### 💡 Brainstorming & Research (4 tasks)
| Task | Description |
|------|-------------|
| `analyst-facilitate-brainstorming` | Facilitate brainstorming session |
| `facilitate-brainstorming-session` | Run brainstorming workshop |
| `audit-codebase` | Comprehensive codebase audit |
| `audit-utilities` | Audit utility modules |

---

## 🔄 8. AIOS Workflows

### 🟢 Greenfield (New Projects)

| Workflow | ID | Description |
|----------|----|-------------|
| Greenfield Fullstack | `greenfield-fullstack` | New project with both frontend and backend |
| Greenfield Service | `greenfield-service` | New backend service/API project |
| Greenfield UI | `greenfield-ui` | New frontend/UI-only project |

### 🟤 Brownfield (Existing Projects)

| Workflow | ID | Description |
|----------|----|-------------|
| Brownfield Discovery | `brownfield-discovery` | Analyze and understand existing codebase |
| Brownfield Fullstack | `brownfield-fullstack` | Work on existing fullstack project |
| Brownfield Service | `brownfield-service` | Work on existing backend service |
| Brownfield UI | `brownfield-ui` | Work on existing frontend project |

### 🔄 Development Cycles

| Workflow | ID | Description |
|----------|----|-------------|
| Development Cycle | `development-cycle` | Standard dev-build-test loop |
| Story Dev Cycle | `story-development-cycle` | User story driven development |
| Spec Pipeline | `spec-pipeline` | Specification to implementation pipeline |

### ✅ Quality Assurance

| Workflow | ID | Description |
|----------|----|-------------|
| QA Loop | `qa-loop` | Iterative quality assurance cycle |
| DS Build Quality | `design-system-build-quality` | Quality gate for design system builds |

### 🏗️ Orchestration

| Workflow | ID | Description |
|----------|----|-------------|
| Epic Orchestration | `epic-orchestration` | Multi-story epic management |
| Auto Worktree | `auto-worktree` | Automatic git worktree management |

---

## 👥 9. AIOS Squad Configurations

| Squad | Icon | Description | Best For |
|-------|------|-------------|----------|
| `team-all` | 👥 | All available agents | Maximum coverage, complex projects |
| `team-fullstack` | 💻 | Dev + Architect + QA | Full-stack development |
| `team-qa-focused` | ✅ | QA + Dev + Analyst | Quality-centric workflows |
| `team-no-ui` | 🖥️ | Dev + Data Engineer + DevOps | Backend/API projects |
| `team-ide-minimal` | ⚡ | Minimal team | Quick IDE-based development |

---

## 🚀 Quick Start

### Check Everything
```bash
cd ~/RudraX
rudrax tools status        # Tool availability
rudrax tools categories    # Category overview
rudrax tools agents        # AIOS agent registry
rudrax tools tasks         # Task categories
rudrax tools workflows     # Workflow catalog
rudrax tools squads        # Squad configurations
```

### JavaScript API
```javascript
import { rudraxTools } from './tools/lib/rudrax-tools.js';

// Get full status
const status = rudraxTools.getStatus();

// Get categorized view
const categorized = rudraxTools.getAllCategorized();

// Get agents, tasks, workflows, squads
const agents = rudraxTools.getAgentCategories();
const tasks = rudraxTools.getTaskCategories();
const workflows = rudraxTools.getWorkflows();
const squads = rudraxTools.getSquads();
const coreTools = rudraxTools.getCoreTools();

// Use tools
await rudraxTools.launchCodeServer(8080);
const response = await rudraxTools.ollamaGenerate('Explain recursion', 'kimi-k2.6:cloud');
const searchResults = rudraxTools.rg('function', './src');
```

---

## ⚙️ Configuration

Edit `tools/rudrax-tools.json`:

```json
{
  "config": {
    "ollama": {
      "endpoint": "http://172.31.32.172:11434",
      "defaultModel": "kimi-k2.6:cloud"
    },
    "code-server": {
      "auth": "none",
      "defaultPort": 8080,
      "bindAddress": "127.0.0.1"
    }
  }
}
```

---

## 📊 Summary

| Category | Count | Type |
|----------|-------|------|
| Built-in Tools | 7 | File, System, Search |
| AI Assistants | 3 | Codex, Claude, Ollama |
| IDE & Server | 1 | Code-Server |
| Search & Utility | 1 | Ripgrep |
| Adapters | 2 | Codex, Claude |
| AIOS Agents | 11 | Specialized roles |
| AIOS Tasks | 80+ | Granular actions |
| AIOS Workflows | 14 | Multi-step processes |
| AIOS Squads | 5 | Pre-configured teams |

**Total Capabilities: 120+ organized and documented** 🚀