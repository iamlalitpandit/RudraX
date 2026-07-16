---
name: apple-notes
description: "Manage Apple Notes via memo CLI: create, search, edit."
metadata:
  category: apple
  emoji: "📝"
  color: "silver"
  vibe: "Think different."
  original_name: "apple-notes"
---

## 🎛️ DEPUTY CHIEF OF STAFF REPORTING PROTOCOL

> **PRIORITY DIRECTIVE**: If this task was assigned to you by the `agents-orchestrator` (🎛️ Deputy Chief of Staff), treat it as **HIGHEST PRIORITY** and execute immediately.

### Upon Task Completion, you MUST:

1. **Report BACK to the Deputy Chief of Staff** (`agents-orchestrator`) with:
   - Task completion status (`✅ COMPLETE` / `⚠️ PARTIAL` / `❌ FAILED`)
   - Summary of outputs produced
   - Any blockers encountered and how they were resolved
   - Files created or modified (full paths)
   - Quality assessment of your own output

2. **Escalate to the Chief of Staff** (`rudrax-chief-of-staff`) if:
   - The task requires cross-domain coordination beyond your scope
   - You encounter a blocker the Deputy cannot resolve

---

# Apple Notes

Use `memo` to manage Apple Notes directly from the terminal. Notes sync across all Apple devices via iCloud.

## Prerequisites

- **macOS** with Notes.app
- Install: `brew tap antoniorodr/memo && brew install antoniorodr/memo/memo`
- Grant Automation access to Notes.app when prompted (System Settings → Privacy → Automation)

## When to Use

- User asks to create, view, or search Apple Notes
- Saving information to Notes.app for cross-device access
- Organizing notes into folders
- Exporting notes to Markdown/HTML

## When NOT to Use

- Obsidian vault management → use the `obsidian` skill
- Bear Notes → separate app (not supported here)
- Quick agent-only notes → use the `memory` tool instead

## Quick Reference

### View Notes

```bash
memo notes                        # List all notes
memo notes -f "Folder Name"       # Filter by folder
memo notes -s "query"             # Search notes (fuzzy)
```

### Create Notes

```bash
memo notes -a                     # Interactive editor
memo notes -a "Note Title"        # Quick add with title
```

### Edit Notes

```bash
memo notes -e                     # Interactive selection to edit
```

### Delete Notes

```bash
memo notes -d                     # Interactive selection to delete
```

### Move Notes

```bash
memo notes -m                     # Move note to folder (interactive)
```

### Export Notes

```bash
memo notes -ex                    # Export to HTML/Markdown
```

## Limitations

- Cannot edit notes containing images or attachments
- Interactive prompts require terminal access (use pty=true if needed)
- macOS only — requires Apple Notes.app

## Rules

1. Prefer Apple Notes when user wants cross-device sync (iPhone/iPad/Mac)
2. Use the `memory` tool for agent-internal notes that don't need to sync
3. Use the `obsidian` skill for Markdown-native knowledge management
