#!/bin/bash
# RudraX Codex CLI Launcher

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUDRAX_TOOLS="$(dirname "$SCRIPT_DIR")"
CODEX_BIN="$RUDRAX_TOOLS/integrated/codex/linux-x64/bin/codex"

if [ ! -f "$CODEX_BIN" ]; then
  echo "❌ Codex binary not found at $CODEX_BIN"
  exit 1
fi

# Check for Ollama configuration
OLLAMA_ENDPOINT="${OLLAMA_HOST:-http://172.31.32.172:11434}"

echo "🤖 Launching Codex CLI via RudraX..."
echo "   Ollama Endpoint: $OLLAMA_ENDPOINT"
echo ""

export PATH="$(dirname "$CODEX_BIN"):$PATH"

# Run Codex with all arguments passed through
exec "$CODEX_BIN" "$@"