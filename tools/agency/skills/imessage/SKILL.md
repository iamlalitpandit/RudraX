---
name: imessage
description: "Send and receive iMessages/SMS via the imsg CLI on macOS."
metadata:
  category: apple
  emoji: "💬"
  color: "silver"
  vibe: "Think different."
  original_name: "imessage"
  source: "Hermes Agent by Nous Research"
  author: "Nous Research"
  url: "https://github.com/nousresearch/hermes-agent"
  hermes_skill: true
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

# iMessage

Use `imsg` to read and send iMessage/SMS via macOS Messages.app.

## Prerequisites

- **macOS** with Messages.app signed in
- Install: `brew install steipete/tap/imsg`
- Grant Full Disk Access for terminal (System Settings → Privacy → Full Disk Access)
- Grant Automation permission for Messages.app when prompted

## When to Use

- User asks to send an iMessage or text message
- Reading iMessage conversation history
- Checking recent Messages.app chats
- Sending to phone numbers or Apple IDs

## When NOT to Use

- Telegram/Discord/Slack/WhatsApp messages → use the appropriate gateway channel
- Group chat management (adding/removing members) → not supported
- Bulk/mass messaging → always confirm with user first

## Quick Reference

### List Chats

```bash
imsg chats --limit 10 --json
```

### View History

```bash
# By chat ID
imsg history --chat-id 1 --limit 20 --json

# With attachments info
imsg history --chat-id 1 --limit 20 --attachments --json
```

### Send Messages

```bash
# Text only
imsg send --to "+14155551212" --text "Hello!"

# With attachment
imsg send --to "+14155551212" --text "Check this out" --file /path/to/image.jpg

# Force iMessage or SMS
imsg send --to "+14155551212" --text "Hi" --service imessage
imsg send --to "+14155551212" --text "Hi" --service sms
```

### Watch for New Messages

```bash
imsg watch --chat-id 1 --attachments
```

## Service Options

- `--service imessage` — Force iMessage (requires recipient has iMessage)
- `--service sms` — Force SMS (green bubble)
- `--service auto` — Let Messages.app decide (default)

## Rules

1. **Always confirm recipient and message content** before sending
2. **Never send to unknown numbers** without explicit user approval
3. **Verify file paths** exist before attaching
4. **Don't spam** — rate-limit yourself

## Example Workflow

User: "Text mom that I'll be late"

```bash
# 1. Find mom's chat
imsg chats --limit 20 --json | jq '.[] | select(.displayName | contains("Mom"))'

# 2. Confirm with user: "Found Mom at +1555123456. Send 'I'll be late' via iMessage?"

# 3. Send after confirmation
imsg send --to "+1555123456" --text "I'll be late"
```
