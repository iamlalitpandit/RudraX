#!/usr/bin/env bash
#
# install.sh — Install Agency agents as RudraX skills.
#
# Copies converted skill directories to ~/.pi/agent/skills/ and
# installs the agency-manager extension to ~/.pi/agent/extensions/.
#
# Usage:
#   ./tools/agency/install.sh [--uninstall] [--help]
#

set -euo pipefail

# --- Colours ---
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; BOLD=$'\033[1m'; CYAN=$'\033[0;36m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BOLD=''; CYAN=''; DIM=''; RESET=''
fi

ok()   { printf "${GREEN}[OK]${RESET}  %s\n" "$*"; }
warn() { printf "${YELLOW}[!!]${RESET}  %s\n" "$*"; }
err()  { printf "${RED}[ERR]${RESET} %s\n" "$*" >&2; }
header() { printf "\n${BOLD}%s${RESET}\n" "$*"; }

# --- Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUDRAX_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# RudraX uses ~/.rudrax/agent by default, but also support ~/.pi/agent
RUDRAX_AGENT_DIR="${HOME}/.rudrax/agent"
PI_AGENT_DIR="${HOME}/.pi/agent"

# Install to both locations if they exist, or create the primary one
if [[ -d "$RUDRAX_AGENT_DIR" ]]; then
  PRIMARY_AGENT_DIR="$RUDRAX_AGENT_DIR"
else
  PRIMARY_AGENT_DIR="$PI_AGENT_DIR"
fi
SKILLS_DIR="$PRIMARY_AGENT_DIR/skills"
EXTENSIONS_DIR="$PRIMARY_AGENT_DIR/extensions"
SRC_SKILLS="$RUDRAX_ROOT/tools/agency/skills"
SRC_EXTENSION="$RUDRAX_ROOT/tools/agency/agency-manager.ts"
SRC_ORCHESTRATOR="$RUDRAX_ROOT/tools/agency/agency-orchestrator.ts"
SRC_MEMORY="$RUDRAX_ROOT/tools/agency/shared-memory.ts"

# --- Uninstall ---
uninstall() {
  header "Uninstalling Agency Skills from RudraX"

  local count=0
  if [[ -d "$SKILLS_DIR" ]]; then
    for d in "$SKILLS_DIR"/*/; do
      [[ -f "$d/SKILL.md" ]] || continue
      # Check if it's an agency skill
      if grep -q 'source: agency-agents' "$d/SKILL.md" 2>/dev/null; then
        rm -rf "$d"
        (( count++ )) || true
      fi
    done
  fi

  # Remove extensions
  for ext in agency-manager.ts agency-orchestrator.ts shared-memory.ts; do
    if [[ -f "$EXTENSIONS_DIR/$ext" ]]; then
      rm -f "$EXTENSIONS_DIR/$ext"
      ok "Removed $ext extension"
    fi
  done

  ok "Uninstalled $count agency skills"
  echo ""
  warn "Run /reload in RudraX to refresh"
  exit 0
}

# --- Usage ---
usage() {
  cat <<EOF
Install Agency agents as RudraX skills.

Usage:
  $(basename "$0") [--uninstall] [--help]

Options:
  --uninstall   Remove all agency skills and extension
  --help        Show this help

EOF
  exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --uninstall|-u) uninstall ;;
    --help|-h) usage ;;
    *) err "Unknown option: $1"; usage ;;
  esac
done

# --- Main ---
main() {
  header "🎭 The Agency → RudraX Installer"

  # Check if skills have been converted
  if [[ ! -d "$SRC_SKILLS" ]] || [[ -z "$(ls -A "$SRC_SKILLS" 2>/dev/null)" ]]; then
    err "No converted skills found. Run convert.sh first:"
    err "  ./tools/agency/convert.sh --source /path/to/agency-agents"
    exit 1
  fi

  # Create directories
  mkdir -p "$SKILLS_DIR"
  mkdir -p "$EXTENSIONS_DIR"

  # Count source skills
  local src_count=0
  for d in "$SRC_SKILLS"/*/; do
    [[ -f "$d/SKILL.md" ]] && (( src_count++ )) || true
  done

  printf "  ${CYAN}Source:${RESET}     $SRC_SKILLS ($src_count skills)\n"
  printf "  ${CYAN}Skills:${RESET}     $SKILLS_DIR\n"
  printf "  ${CYAN}Extension:${RESET}  $EXTENSIONS_DIR\n"
  echo ""

  # Install skills
  local installed=0 skipped=0
  for d in "$SRC_SKILLS"/*/; do
    [[ -f "$d/SKILL.md" ]] || continue
    local name
    name="$(basename "$d")"
    local dest="$SKILLS_DIR/$name"

    if [[ -d "$dest" ]]; then
      # Update existing
      cp -r "$d/." "$dest/"
      (( installed++ )) || true
    else
      cp -r "$d" "$dest/"
      (( installed++ )) || true
    fi
  done

  ok "Installed $installed agency skills"

  # Install extensions
  if [[ -f "$SRC_EXTENSION" ]]; then
    cp "$SRC_EXTENSION" "$EXTENSIONS_DIR/agency-manager.ts"
    ok "Installed agency-manager.ts extension"
  else
    warn "agency-manager.ts extension not found at $SRC_EXTENSION"
  fi

  if [[ -f "$SRC_ORCHESTRATOR" ]]; then
    cp "$SRC_ORCHESTRATOR" "$EXTENSIONS_DIR/agency-orchestrator.ts"
    ok "Installed agency-orchestrator.ts extension"
  else
    warn "agency-orchestrator.ts extension not found at $SRC_ORCHESTRATOR"
  fi

  if [[ -f "$SRC_MEMORY" ]]; then
    cp "$SRC_MEMORY" "$EXTENSIONS_DIR/shared-memory.ts"
    ok "Installed shared-memory.ts extension"
  else
    warn "shared-memory.ts extension not found at $SRC_MEMORY"
  fi

  echo ""
  header "✅ Installation Complete"
  echo ""
  printf "  ${DIM}Skills installed:${RESET}    $installed\n"
  printf "  ${DIM}Extensions:${RESET}       $EXTENSIONS_DIR/agency-manager.ts, agency-orchestrator.ts, shared-memory.ts\n"
  echo ""
  printf "  ${CYAN}Quick Start:${RESET}\n"
  printf "  ${DIM}───${RESET}\n"
  printf "  1. Start RudraX:    ${GREEN}rudrax${RESET}\n"
  printf "  2. List agents:    ${GREEN}/agency list${RESET}\n"
  printf "  3. Activate agent:  ${GREEN}/agency activate frontend-developer${RESET}\n"
  printf "  4. Orchestrate:    ${GREEN}/orchestrate <your complex task>${RESET}\n"
  printf "  5. Dispatch task:  ${GREEN}/dispatch frontend-developer <task>${RESET}\n"
  printf "  6. Plan status:    ${GREEN}/orchestrate status${RESET}\n"
  printf "  7. Deactivate:     ${GREEN}/agency deactivate${RESET}\n"
  printf "  8. Shared Memory:  ${GREEN}/memory status${RESET}\n"
  printf "  9. Memory write:   ${GREEN}Use memory_write tool in prompts${RESET}\n"
  echo ""
  printf "  ${DIM}Run /reload in RudraX to pick up new skills and extension${RESET}\n"
  echo ""
}

main