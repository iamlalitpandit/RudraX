#!/bin/bash
# RudraX Code-Server Launcher

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUDRAX_TOOLS="$(dirname "$SCRIPT_DIR")"
SERVER_BIN="$RUDRAX_TOOLS/integrated/code-server/linux-x64/bin/code-server"

if [ ! -f "$SERVER_BIN" ]; then
  echo "❌ Code-server binary not found at $SERVER_BIN"
  exit 1
fi

# Configuration
PORT="${CODE_SERVER_PORT:-8080}"
BIND_ADDR="${CODE_SERVER_BIND:-127.0.0.1}"

echo "💻 Launching Code-Server via RudraX..."
echo "   URL: http://$BIND_ADDR:$PORT"
echo ""

# Run code-server with config directory in RudraX
CONFIG_DIR="$RUDRAX_TOOLS/.code-server-config"
mkdir -p "$CONFIG_DIR"

export CODE_SERVER_CONFIG="$CONFIG_DIR/config.yaml"

exec "$SERVER_BIN" --bind-addr "$BIND_ADDR:$PORT" --config "$CONFIG_DIR/config.yaml" "$@"