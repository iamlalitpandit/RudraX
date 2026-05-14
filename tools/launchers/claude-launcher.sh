#!/bin/bash
# RudraX Claude Code Launcher

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUDRAX_TOOLS="$(dirname "$SCRIPT_DIR")"
CLAUDE_BIN="$RUDRAX_TOOLS/integrated/claude-code/linux-x64/bin/claude"

if [ ! -f "$CLAUDE_BIN" ]; then
  echo "❌ Claude binary not found at $CLAUDE_BIN"
  exit 1
fi

OLLAMA_ENDPOINT="${OLLAMA_HOST:-http://172.31.32.172:11434}"

echo "🧠 Launching Claude Code via RudraX..."
echo "   Ollama Endpoint: $OLLAMA_ENDPOINT"
echo ""

# Run Claude
exec "$CLAUDE_BIN" "$@"