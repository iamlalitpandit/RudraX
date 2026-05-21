# 🔱 Hermes Agent — RudraX Integration Guide

> **170 skills** from [Nous Research's Hermes Agent](https://github.com/nousresearch/hermes-agent) have been converted and installed into RudraX's Agency system.

## 📊 What Was Imported

| Source | Skills |
|--------|--------|
| Original RudraX Agency | 179 |
| Hermes Main Skills | 89 |
| Hermes Optional Skills | 81 |
| **Total** | **349** |

## 🧠 Key Hermes Agent Patterns (Not Yet Ported)

These architectural patterns from Hermes Agent are **valuable additions** that RudraX doesn't currently have:

### 1. 📝 Two-Store Memory System (`tools/memory_tool.py`)
Hermes uses a sophisticated memory system:
- **MEMORY.md** — Agent's personal notes (environment facts, conventions, tool quirks)
- **USER.md** — What the agent knows about the user (preferences, communication style)
- **Frozen Snapshot Pattern** — Memory injected into system prompt at session start (never mutated mid-session), keeping prefix cache stable
- **Security Scanning** — Injection/exfiltration detection before memory is added to system prompt
- **File Locking** via `fcntl.flock` for concurrent write safety
- **Atomic Replace** via `os.replace()` for crash-safe persistence

### 2. 🔍 FTS5 Session Search (`tools/session_search_tool.py`)
Three-mode cross-session recall with zero LLM cost:
- **Discovery** — FTS5 full-text search across all sessions, returns snippets + context windows
- **Scroll** — Window around a specific message ID
- **Browse** — Recent session chronology with titles/previews
- All backed by SQLite FTS5 index in `hermes_state.py`

### 3. 👥 Delegate/Subagent System (`tools/delegate_tool.py`)
- Spawns isolated `AIAgent` instances with fresh context
- Restricted toolset (configurable blocked tools)
- Parallel batch mode via `ThreadPoolExecutor`
- Auto-deny dangerous commands in subagent threads (safe default)

### 4. ⏰ Cron Scheduling (`cron/jobs.py`, `cron/scheduler.py`)
- Jobs stored in `~/.hermes/cron/jobs.json`
- Output saved per run with timestamps
- Delivery to any platform (Telegram, Discord, Slack, etc.)
- Script injection: run Python before agent execution
- Multi-skill chaining per automation

### 5. 🎯 Skill Manager (`tools/skill_manager_tool.py`)
- Agent can **create/update/delete** skills autonomously
- Skills are procedural memory — narrow and actionable
- Directory layout: `SKILL.md`, `references/`, `templates/`, `scripts/`, `assets/`
- Security scanning on hub installs

### 6. 📊 Insights Engine (`agent/insights.py`)
- Token consumption, cost estimates, tool usage patterns
- Per-platform breakdowns
- Inspired by Claude Code's `/insights` command

### 7. 🎮 Kanban Board System (`plugins/kanban/`)
- Multi-agent board dispatcher + worker plugin
- Task queue with lane assignment

## 🔧 How Hermes Skills Differ From RudraX Skills

| Aspect | Hermes SKILL.md | RudraX SKILL.md |
|--------|----------------|-----------------|
| **Frontmatter** | name, description, version, platforms, metadata.hermes | name, description, metadata (category, emoji, color, vibe) |
| **Structure** | Workflow-focused (prerequisites, steps, commands) | Personality-focused (reporting protocol, domain knowledge) |
| **Philosophy** | "How to do X" (procedural memory) | "Who you are" (agent persona + expertise) |

## 📁 Installed Skills

Run in RudraX:
```bash
/agency list                    # List all 349 agents
/agency categories              # List all categories
/agency search github           # Search for GitHub-related skills
/agency activate github-code-review  # Activate a Hermes skill
```

Or dispatch directly:
```bash
/dispatch github-code-review "Review this PR"
/dispatch obsidian "Create a daily note"
/dispatch ascii-art "Make a cool dragon in ASCII"
```
