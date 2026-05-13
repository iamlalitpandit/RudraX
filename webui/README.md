# RudraX Web UI — Rudraksh Edition 🔱

> **Build · Break · Deploy · Orchestrate**  
> By **Lalit Pandit**

The RudraX Web UI provides a browser-based interface for interacting with RudraX's autonomous agentic AI system, featuring 191+ agents, 9 squads, an orchestrator, shared memory, and real-time streaming.

## 🔱 Rudraksh Design System

Inspired by Lord Shiva's Rudraksha — sacred, powerful, grounding.

- **Deep browns** (`#1a0e07` → `#5c4233`) — earthy, grounding
- **Warm golds** (`#f0c850` → `#a67c00`) — divine, illuminating
- **Sacred reds** (`#c0392b` → `#8b1a1a`) — Trishul energy
- **Spiritual saffron** (`#ff8c00` → `#cc7000`) — creation, transformation
- **Void blacks** (`#070504` → `#292420`) — depth, mystery
- **Light mode** — Warm Sand (`#faf6f1`) palette

## Features

### 🖥️ 4-Panel Layout
- **Left Sidebar** — Chats, Agents, Squads, Memory tabs
- **Main Chat** — Real-time incremental streaming with smooth DOM updates
- **Orchestrator Panel** — Auto/Manual mode, task planning, live lane view
- **Agent Activity Panel** — Real-time stream of all agent/model actions

### 🤖 191+ Agents, 9 Squads
- Browse agents by category with emoji badges and color coding
- Activate agents to inject personality
- Deploy squads for coordinated multi-agent workflows

### 🧠 Orchestrator
- **Auto** — Orchestrator plans and dispatches agents automatically
- **Manual** — You pick which agents handle which tasks
- Live lane view showing task status per agent
- Task history log

### 🗂️ Shared Memory
- Per-project memory files with structured sections
- Activity Log, Task Board, Decisions, Blockers, Handoffs, Files Changed
- Real-time updates via Socket.IO
- Raw memory view

### ⌨️ Terminal
- xterm.js based terminal panel
- Socket.IO connection to server shell
- Rudraksh-themed color palette

### 📡 Agent Activity Panel
- Real-time stream of agent actions (tool calls, responses, system events)
- Color-coded by type (tool, response, error, system, user)
- Expandable, clearable

### 🔄 Smooth Streaming
- **Incremental DOM updates** — only changed messages are re-rendered
- Socket.IO primary, polling fallback
- Streaming cursor animation on in-progress messages
- No flickering or DOM thrashing

### ⚡ Compaction-Safe
- Compaction events display clearly as "📦 Compacting..." messages
- UI remains interactive during compaction
- Agent Activity panel continues streaming during compaction

## Quick Start

```bash
# Start the WebUI
npm run webui

# Or with a specific port
RUDRAX_WEBUI_PORT=8080 node webui/server.js

# Or run in background
npm run webui:bg
```

## API Endpoints (28)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/contexts` | GET/POST | List/create contexts |
| `/api/contexts/:id` | GET/DELETE | Get/delete context |
| `/message_async` | POST | Send message |
| `/message_stop` | POST | Stop generation |
| `/poll` | POST | Poll for state updates |
| `/api/skills` | GET | List all agent skills |
| `/api/agents/:name/activate` | POST | Activate agent personality |
| `/api/agents/deactivate` | POST | Deactivate agent |
| `/api/squads` | GET | List squads |
| `/api/squads/:name/activate` | POST | Activate squad |
| `/api/squads/deactivate` | POST | Deactivate squad |
| `/api/orchestrator` | GET | Get orchestrator state |
| `/api/orchestrator/plan` | POST | Create orchestration plan |
| `/api/orchestrator/stop` | POST | Stop orchestration |
| `/api/orchestrator/reset` | POST | Reset orchestrator |
| `/api/orchestrator/mode` | POST | Set mode (auto/manual) |
| `/api/memory` | POST | Create/initialize memory |
| `/api/memory/:id` | GET | Get memory |
| `/api/memory/:id` | PUT | Update memory |
| `/api/memory/:id/raw` | GET | Get raw memory file |
| `/api/memory/:id/overview` | GET | Get structured overview |
| `/api/memory/:id/blocker-resolve` | POST | Resolve a blocker |
| `/api/memory/:id/write` | POST | Write to memory section |
| `/api/models` | GET | List available models |
| `/api/settings` | GET/PUT | Get/set settings |
| `/favicon.svg` | GET | Rudraksh SVG favicon |

## Socket.IO Events

### Server → Client
| Event | Description |
|-------|-------------|
| `state_update` | Incremental state snapshot (logs, progress, contexts) |
| `orchestrator_update` | Orchestrator state change |
| `memory_update` | Shared memory changed |
| `agent_activity` | Agent action event (tool call, response, system) |
| `terminal_data` | Terminal output data |
| `terminal_ready` | Terminal session ready |
| `terminal_exit` | Terminal process exited |

### Client → Server
| Event | Description |
|-------|-------------|
| `state_request` | Request current state |
| `terminal_input` | Terminal keystroke |
| `terminal_resize` | Terminal dimensions changed |
| `terminal_create` | Create terminal session |
| `terminal_kill` | Kill terminal process |

## Configuration

```bash
# Port (default: 5555)
RUDRAX_WEBUI_PORT=8080 node webui/server.js

# Run as child process (for auto-start)
RUDRAX_WEBUI_CHILD=1 node webui/server.js
```

## Architecture

```
Browser
  ├── index.html — 4-panel layout
  ├── css/index.css — Rudraksh design system
  ├── js/app.js — State management, incremental rendering, Socket.IO
  ├── js/terminal.js — xterm.js terminal module
  └── favicon.svg — Rudraksh SVG logo

Server (server.js)
  ├── Express routes — REST API
  ├── Socket.IO — Real-time events
  ├── AgentSession bridge — RudraX core SDK
  ├── Memory API — Shared project memory
  ├── Agency API — Agents, squads, orchestrator
  └── Terminal — Shell process management

Services
  ├── webui-manager.js — Auto-start, PID management
  ├── systemd user service — Persistent background
  └── PM2 ecosystem — Production process manager
```

---

🔱 **ॐ नमः शिवाय** — RudraX by Lalit Pandit