# RudraX Web UI — Agency Edition

Full-featured web interface for RudraX with autonomous multi-agent orchestration.

## Features

### 🧠 Chat Interface
- Real-time streaming via Socket.IO + HTTP polling fallback
- Markdown rendering (marked.js)
- Collapsible tool call display
- Multi-context chats (create, switch, delete, rename)
- Dark/Light themes
- Keyboard shortcuts (Ctrl+N, Ctrl+B, Ctrl+`, /)

### 🤖 Agent Picker (186+ Agents)
- Browse all agency agents by category
- Search agents by name, description, vibe
- Filter by category (engineering, marketing, design, specialized, etc.)
- One-click activation/deactivation
- Agent personality badge in sidebar

### 👥 Squad Selector (9 Squads)
- Pre-built squads: Startup, Enterprise, Full Product, Security, QA, AI Infra, Web3, Growth, Incident
- One-click squad activation
- Squad badge in top bar
- Agent chips showing squad composition

### 🧠 Orchestrator Panel
- Visual execution plan with lanes and task cards
- Task status indicators (pending/running/completed/failed/skipped)
- Auto/Manual mode toggle
- Active agent display
- Task history log
- Quick action buttons (Dispatch, Plan, Status, Squads)

### 📊 Live Task Monitor
- Real-time orchestrator state updates via WebSocket
- Active agent tracking with emoji badge
- Squad status with agent count
- Orchestrator mode badge (Auto/Manual)

### 💬 Command Bar
- `/orchestrate <auto|manual> <task>` — Plan and execute multi-agent tasks
- `/dispatch <agent-name> <task>` — Quick dispatch a specific agent
- `/agency <list|activate|deactivate|squad|status>` — Manage agency agents
- `/memory <status|log|tasks|decisions|blockers|handoffs|overview|files|structure|reset|list>` — Shared memory
- `/skill:<name>` — Load a specific skill/agent personality
- Tab autocomplete for commands
- Command suggestions dropdown

### 🗂️ Shared Memory Tab
- Project name and status badge
- Expandable sections: Overview, Structure, Tasks, Activity Log, Decisions, Blockers, Handoffs, Files
- Real-time updates via WebSocket (`memory_update`)
- Raw file viewer modal
- Quick action buttons (Status, Log, Tasks, Raw)
- Auto-loaded when selecting a chat context

### 🖥️ Integrated Terminal
- xterm.js terminal with full ANSI color support
- WebSocket-based shell connection
- Dark/Light theme aware
- Auto-fit to container
- Web links detection
- `Ctrl+`` to toggle terminal panel
- Resizable panel

## Architecture

```
Browser ←→ Socket.IO ←→ server.js ←→ AgentSession ←→ Agent ←→ LLM
Browser ←→ WebSocket  ←→ server.js ←→ child_process (Terminal)
```

### Server API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with feature list |
| `/api/contexts` | GET/POST/DELETE/PATCH | Chat context CRUD |
| `/api/skills` | GET | List all agency agents (with search/filter) |
| `/api/skills/categories` | GET | Agent categories with counts |
| `/api/squads` | GET | List all squads |
| `/api/squads/:name/activate` | POST | Activate a squad |
| `/api/squads/deactivate` | POST | Deactivate current squad |
| `/api/orchestrator` | GET | Get orchestrator state |
| `/api/orchestrator/mode` | POST | Set auto/manual mode |
| `/api/orchestrator/plan` | POST | Create execution plan |
| `/api/orchestrator/stop` | POST | Stop execution |
| `/api/orchestrator/reset` | POST | Reset orchestrator |
| `/api/dispatch` | POST | Dispatch specific agent |
| `/api/agents/:name/activate` | POST | Activate agent personality |
| `/api/agents/deactivate` | POST | Deactivate agent |
| `/api/memory` | GET/POST | List all memories / Initialize memory |
| `/api/memory/:contextId` | GET | Get memory for context |
| `/api/memory/:contextId/raw` | GET | Get raw markdown memory file |
| `/api/memory/:contextId/write` | POST | Write entry to memory |
| `/api/memory/:contextId/overview` | PATCH | Update project overview |
| `/api/memory/:contextId/blockers/:index` | DELETE | Resolve a blocker |
| `/message_async` | POST | Send message to agent |
| `/poll` | POST | HTTP polling fallback |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `state_update` | Server→Client | Chat state snapshot |
| `orchestrator_update` | Server→Client | Orchestrator state |
| `memory_update` | Server→Client | Shared memory updated |
| `terminal_create` | Client→Server | Create terminal session |
| `terminal_input` | Client→Server | Terminal keyboard input |
| `terminal_data` | Server→Client | Terminal output data |
| `terminal_resize` | Client→Server | Terminal resize |
| `terminal_ready` | Server→Client | Terminal initialized |
| `terminal_exit` | Server→Client | Terminal process exited |

## Quick Start

```bash
# Start the web UI
npm run webui

# Or with custom port
RUDRAX_WEBUI_PORT=8080 npm run webui

# Or directly
node webui/server.js 8080
```

## Dependencies

### Runtime
- Express 5.x
- Socket.IO 4.x
- RudraX SDK (AgentSession)

### CDN (frontend)
- marked.js 12.x (Markdown rendering)
- xterm.js 5.3.x (Terminal emulator)
- xterm-addon-fit 0.8.x (Terminal auto-fit)
- xterm-addon-web-links 0.9.x (Link detection)

### Optional
- **node-pty** — Full PTY terminal support (vim, htop, etc.)
  ```bash
  npm install node-pty
  ```
  When node-pty is installed, the terminal automatically uses it for proper PTY support.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New chat |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+`` ` | Toggle terminal |
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Tab` | Autocomplete commands |
| `/` | Show command suggestions |
| `Escape` | Close suggestions/modal |

## File Structure

```
webui/
├── index.html          Main SPA shell
├── server.js           Express + Socket.IO + Terminal backend
├── launch.js           Launcher script
├── css/
│   └── index.css       Full design system (dark/light)
├── js/
│   ├── app.js          Main application logic
│   └── terminal.js     xterm.js terminal module
├── public/
│   └── favicon.svg     Brand favicon
├── components/          (reserved for future)
└── vendor/              (reserved for future)
```