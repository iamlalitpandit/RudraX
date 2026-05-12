#!/usr/bin/env bash
#
# RudraX WebUI — Persistent Service Installer
#
# Usage:
#   ./deploy/install-webui-service.sh         — Install and start (auto-detects method)
#   ./deploy/install-webui-service.sh pm2      — Use PM2
#   ./deploy/install-webui-service.sh systemd  — Use systemd user service
#   ./deploy/install-webui-service.sh status   — Check service status
#   ./deploy/install-webui-service.sh uninstall — Remove service
#

set -euo pipefail

RUDRAX_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${RUDRAX_WEBUI_PORT:-5555}"
METHOD="${1:-auto}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "  ${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "  ${CYAN}║  🔥 RudraX WebUI — Service Installer 🔥         ║${RESET}"
echo -e "  ${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Helper Functions ──────────────────────────────────────────────────────────

check_pm2() {
  command -v pm2 &>/dev/null
}

check_systemd() {
  command -v systemctl &>/dev/null
}

check_node() {
  command -v node &>/dev/null
}

get_node_path() {
  which node
}

create_dirs() {
  mkdir -p ~/.rudrax/logs
  mkdir -p ~/.rudrax/agent/skills
  mkdir -p ~/.rudrax/agent/extensions
  mkdir -p ~/.rudrax/agent/memory
  mkdir -p ~/.rudrax/agent/sessions
}

# ── PM2 Install ──────────────────────────────────────────────────────────────

install_pm2() {
  echo -e "  ${BOLD}[1/4] Checking PM2...${RESET}"
  if ! check_pm2; then
    echo -e "  ${YELLOW}PM2 not found. Installing globally...${RESET}"
    npm install -g pm2
  fi
  echo -e "  ${GREEN}✓ PM2 available${RESET}"

  echo -e "  ${BOLD}[2/4] Creating log directories...${RESET}"
  create_dirs
  echo -e "  ${GREEN}✓ Directories created${RESET}"

  echo -e "  ${BOLD}[3/4] Starting WebUI with PM2...${RESET}"
  cd "$RUDRAX_DIR"

  # Delete existing if present
  pm2 delete rudrax-webui 2>/dev/null || true

  # Start with PM2 using ecosystem config
  pm2 start ecosystem.config.mjs

  echo -e "  ${GREEN}✓ WebUI started with PM2${RESET}"

  echo -e "  ${BOLD}[4/4] Saving PM2 process list...${RESET}"
  pm2 save

  echo ""
  echo -e "  ${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
  echo -e "  ${GREEN}║  ✅ WebUI running with PM2                       ║${RESET}"
  echo -e "  ${GREEN}╠══════════════════════════════════════════════════╣${RESET}"
  echo -e "  ${GREEN}║  🌐 http://localhost:${PORT}                         ║${RESET}"
  echo -e "  ${GREEN}║                                                  ║${RESET}"
  echo -e "  ${GREEN}║  Commands:                                       ║${RESET}"
  echo -e "  ${GREEN}║    pm2 status          — Check status            ║${RESET}"
  echo -e "  ${GREEN}║    pm2 logs rudrax-webui — View logs             ║${RESET}"
  echo -e "  ${GREEN}║    pm2 restart rudrax-webui — Restart             ║${RESET}"
  echo -e "  ${GREEN}║    pm2 stop rudrax-webui  — Stop                 ║${RESET}"
  echo -e "  ${GREEN}║                                                  ║${RESET}"
  echo -e "  ${GREEN}║  Auto-start on boot:                             ║${RESET}"
  echo -e "  ${GREEN}║    pm2 startup                                  ║${RESET}"
  echo -e "  ${GREEN}║    # Then run the command PM2 shows you          ║${RESET}"
  echo -e "  ${GREEN}║    pm2 save                                     ║${RESET}"
  echo -e "  ${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
  echo ""
}

# ── Systemd Install ──────────────────────────────────────────────────────────

install_systemd() {
  echo -e "  ${BOLD}[1/4] Detecting Node.js path...${RESET}"
  if ! check_node; then
    echo -e "  ${RED}✗ Node.js not found. Install it first.${RESET}"
    exit 1
  fi
  NODE_PATH="$(get_node_path)"
  echo -e "  ${GREEN}✓ Node: ${NODE_PATH}${RESET}"

  echo -e "  ${BOLD}[2/4] Creating log directories...${RESET}"
  create_dirs
  echo -e "  ${GREEN}✓ Directories created${RESET}"

  echo -e "  ${BOLD}[3/4] Installing systemd service...${RESET}"

  # Generate service file with actual paths
  SERVICE_FILE=~/.config/systemd/user/rudrax-webui.service
  mkdir -p ~/.config/systemd/user

  cat > "$SERVICE_FILE" << EOF
[Unit]
Description=RudraX WebUI - AI Autonomous Stack Interface
After=network.target

[Service]
Type=simple
WorkingDirectory=${RUDRAX_DIR}
ExecStart=${NODE_PATH} ${RUDRAX_DIR}/webui/server.js ${PORT}
Restart=on-failure
RestartSec=5
StartLimitBurst=5
StartLimitIntervalSec=60
Environment=NODE_ENV=production
Environment=RUDRAX_WEBUI_PORT=${PORT}
Environment=RUDRAX_WEBUI_CHILD=1
StandardOutput=append:${HOME}/.rudrax/logs/webui-out.log
StandardError=append:${HOME}/.rudrax/logs/webui-error.log

[Install]
WantedBy=default.target
EOF

  echo -e "  ${GREEN}✓ Service file: ${SERVICE_FILE}${RESET}"

  echo -e "  ${BOLD}[4/4] Enabling and starting service...${RESET}"
  systemctl --user daemon-reload
  systemctl --user enable rudrax-webui
  systemctl --user start rudrax-webui

  sleep 1
  if systemctl --user is-active rudrax-webui &>/dev/null; then
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
    echo -e "  ${GREEN}║  ✅ WebUI running with systemd                  ║${RESET}"
    echo -e "  ${GREEN}╠══════════════════════════════════════════════════╣${RESET}"
    echo -e "  ${GREEN}║  🌐 http://localhost:${PORT}                         ║${RESET}"
    echo -e "  ${GREEN}║                                                  ║${RESET}"
    echo -e "  ${GREEN}║  Commands:                                       ║${RESET}"
    echo -e "  ${GREEN}║    systemctl --user status rudrax-webui           ║${RESET}"
    echo -e "  ${GREEN}║    systemctl --user restart rudrax-webui         ║${RESET}"
    echo -e "  ${GREEN}║    systemctl --user stop rudrax-webui            ║${RESET}"
    echo -e "  ${GREEN}║    journalctl --user -u rudrax-webui -f           ║${RESET}"
    echo -e "  ${GREEN}║                                                  ║${RESET}"
    echo -e "  ${GREEN}║  Auto-start on boot:                             ║${RESET}"
    echo -e "  ${GREEN}║    loginctl enable-linger                       ║${RESET}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
    echo ""
  else
    echo -e "  ${YELLOW}⚠ Service may need a moment. Check status:${RESET}"
    echo -e "  ${YELLOW}  systemctl --user status rudrax-webui${RESET}"
  fi
}

# ── Status ───────────────────────────────────────────────────────────────────

show_status() {
  echo -e "  ${BOLD}Checking WebUI status...${RESET}"
  echo ""

  # Check PM2
  if check_pm2; then
    if pm2 describe rudrax-webui &>/dev/null; then
      local pm2_status=$(pm2 describe rudrax-webui 2>/dev/null | grep 'status' | head -1 | awk '{print $4}')
      local pm2_port=$(pm2 describe rudrax-webui 2>/dev/null | grep 'RUDRAX_WEBUI_PORT' | head -1 | awk -F= '{print $2}')
      echo -e "  ${GREEN}PM2: rudrax-webui is ${pm2_status}${RESET} (port: ${pm2_port:-5555})"
    else
      echo -e "  ${YELLOW}PM2: rudrax-webui not running${RESET}"
    fi
  else
    echo -e "  ${YELLOW}PM2: not installed${RESET}"
  fi

  # Check systemd
  if check_systemd && [[ -f ~/.config/systemd/user/rudrax-webui.service ]]; then
    local sd_status=$(systemctl --user is-active rudrax-webui 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}systemd: rudrax-webui is ${sd_status}${RESET}"
  else
    echo -e "  ${YELLOW}systemd: service not configured${RESET}"
  fi

  # Check port directly
  if curl -s http://localhost:${PORT}/api/health &>/dev/null; then
    echo -e "  ${GREEN}Port ${PORT}: WebUI is responding ✓${RESET}"
  else
    echo -e "  ${RED}Port ${PORT}: Not responding ✗${RESET}"
  fi

  # Check PID file
  if [[ -f ~/.rudrax/webui.pid ]]; then
    local pid=$(cat ~/.rudrax/webui.pid)
    echo -e "  ${CYAN}PID file: ${pid}${RESET}"
  fi

  echo ""
}

# ── Uninstall ────────────────────────────────────────────────────────────────

uninstall() {
  echo -e "  ${BOLD}Uninstalling WebUI service...${RESET}"

  # Stop PM2
  if check_pm2; then
    pm2 delete rudrax-webui 2>/dev/null || true
    pm2 save 2>/dev/null || true
    echo -e "  ${GREEN}✓ PM2 process removed${RESET}"
  fi

  # Stop systemd
  if check_systemd && [[ -f ~/.config/systemd/user/rudrax-webui.service ]]; then
    systemctl --user stop rudrax-webui 2>/dev/null || true
    systemctl --user disable rudrax-webui 2>/dev/null || true
    rm -f ~/.config/systemd/user/rudrax-webui.service
    systemctl --user daemon-reload 2>/dev/null || true
    echo -e "  ${GREEN}✓ systemd service removed${RESET}"
  fi

  # Kill any running process
  if [[ -f ~/.rudrax/webui.pid ]]; then
    local pid=$(cat ~/.rudrax/webui.pid)
    kill "$pid" 2>/dev/null || true
    rm -f ~/.rudrax/webui.pid ~/.rudrax/webui.port
    echo -e "  ${GREEN}✓ Background process stopped${RESET}"
  fi

  echo ""
  echo -e "  ${GREEN}✅ WebUI service uninstalled${RESET}"
}

# ── Main ─────────────────────────────────────────────────────────────────────

case "$METHOD" in
  auto)
    # Auto-detect: prefer pm2, fall back to systemd, then background process
    if check_pm2; then
      echo -e "  ${CYAN}Using PM2 (recommended)${RESET}"
      echo ""
      install_pm2
    elif check_systemd; then
      echo -e "  ${CYAN}PM2 not found. Using systemd user service.${RESET}"
      echo -e "  ${YELLOW}Install PM2 for better process management: npm i -g pm2${RESET}"
      echo ""
      install_systemd
    else
      echo -e "  ${CYAN}Neither PM2 nor systemd available. Running as background process.${RESET}"
      echo ""
      create_dirs
      cd "$RUDRAX_DIR"
      RUDRAX_WEBUI_PORT=$PORT RUDRAX_WEBUI_CHILD=1 nohup node webui/server.js >> ~/.rudrax/logs/webui-out.log 2>> ~/.rudrax/logs/webui-error.log &
      echo $! > ~/.rudrax/webui.pid
      echo $PORT > ~/.rudrax/webui.port
      echo ""
      echo -e "  ${GREEN}✅ WebUI started (PID: $(cat ~/.rudrax/webui.pid))${RESET}"
      echo -e "  ${GREEN}🌐 http://localhost:${PORT}${RESET}"
      echo ""
    fi
    ;;
  pm2)
    install_pm2
    ;;
  systemd)
    install_systemd
    ;;
  status)
    show_status
    ;;
  uninstall|remove|stop)
    uninstall
    ;;
  *)
    echo "Usage: $0 [auto|pm2|systemd|status|uninstall]"
    echo ""
    echo "  auto       — Auto-detect best method (default)"
    echo "  pm2        — Install with PM2 process manager"
    echo "  systemd    — Install as systemd user service"
    echo "  status     — Check WebUI service status"
    echo "  uninstall  — Remove WebUI service"
    exit 1
    ;;
esac