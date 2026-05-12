#!/usr/bin/env bash
#
# convert.sh — Convert Agency agent .md files into RudraX SKILL.md format.
#
# Usage:
#   ./tools/agency/convert.sh [--source <dir>] [--out <dir>] [--help]
#

set -euo pipefail

# --- Colours ---
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BOLD=''; RESET=''
fi

info()  { printf "${GREEN}[OK]${RESET}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[!!]${RESET}  %s\n" "$*"; }
error() { printf "${RED}[ERR]${RESET} %s\n" "$*" >&2; }
header() { echo -e "\n${BOLD}$*${RESET}"; }

# --- Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUDRAX_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SOURCE_DIR="${AGENCY_REPO:-/tmp/agency-agents}"
OUT_DIR="$RUDRAX_ROOT/tools/agency/skills"

AGENT_DIRS=(
  academic design engineering finance game-development marketing paid-media product project-management
  sales spatial-computing specialized strategy support testing
)

usage() { sed -n '3,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE_DIR="${2:?--source requires a value}"; shift 2 ;;
    --out)    OUT_DIR="${2:?--out requires a value}"; shift 2 ;;
    --help|-h) usage ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Frontmatter helpers ---
get_field() {
  local field="$1" file="$2"
  awk -v f="$field" '
    /^---$/ { fm++; next }
    fm == 1 && $0 ~ "^" f ": " { sub("^" f ": ", ""); print; exit }
  ' "$file"
}

get_body() {
  awk 'BEGIN{fm=0} /^---$/{fm++; next} fm>=2{print}' "$1"
}

to_skill_name() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

# --- Conversion ---
convert_one() {
  local file="$1" category="$2"
  local basename
  basename="$(basename "$file" .md)"

  # Validate frontmatter
  [[ "$(head -1 "$file")" == "---" ]] || return 1

  local agent_name agent_desc agent_emoji agent_vibe agent_color
  agent_name="$(get_field name "$file")"
  agent_desc="$(get_field description "$file")"
  agent_emoji="$(get_field emoji "$file")"
  agent_vibe="$(get_field vibe "$file")"
  agent_color="$(get_field color "$file")"

  # Skip if no description
  [[ -n "$agent_desc" ]] || { warn "Skipping $basename: no description"; return 1; }

  local skill_name
  skill_name="$(to_skill_name "$basename")"

  local skill_dir="$OUT_DIR/$skill_name"
  mkdir -p "$skill_dir"

  local skill_file="$skill_dir/SKILL.md"
  local body
  body="$(get_body "$file")"

  # Truncate description to 1024 chars if needed
  local desc_out="$agent_desc"
  if [[ ${#desc_out} -gt 1020 ]]; then
    desc_out="${desc_out:0:1017}..."
  fi

  # Escape quotes in fields for YAML
  agent_name="${agent_name//\"/\\\"}"
  agent_vibe="${agent_vibe//\"/\\\"}"
  desc_out="${desc_out//\"/\\\"}"

  {
    echo "---"
    echo "name: $skill_name"
    echo "description: $desc_out"
    echo "metadata:"
    echo "  category: $category"
    echo "  emoji: \"$agent_emoji\""
    echo "  color: \"$agent_color\""
    echo "  vibe: \"$agent_vibe\""
    echo "  original_name: \"$agent_name\""
    echo "  source: agency-agents"
    echo "---"
    echo ""
    echo "$agent_emoji **$agent_name** — $agent_vibe"
    echo ""
    echo "$category Division Agent | [The Agency](https://github.com/msitarzewski/agency-agents)"
    echo ""
    echo "---"
    echo ""
    echo "$body"
  } > "$skill_file"

  return 0
}

# --- Main ---
main() {
  header "Agency → RudraX Skill Converter"

  if [[ ! -d "$SOURCE_DIR" ]]; then
    error "Source directory not found: $SOURCE_DIR"
    error "Clone the repo first: git clone https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents"
    exit 1
  fi

  info "Source:  $SOURCE_DIR"
  info "Output: $OUT_DIR"

  rm -rf "$OUT_DIR"
  mkdir -p "$OUT_DIR"

  local total=0 converted=0

  for category in "${AGENT_DIRS[@]}"; do
    local cat_dir="$SOURCE_DIR/$category"
    [[ -d "$cat_dir" ]] || continue

    while IFS= read -r -d '' f; do
      (( total++ )) || true
      if convert_one "$f" "$category"; then
        (( converted++ )) || true
      fi
    done < <(find "$cat_dir" -name "*.md" -type f -print0)
  done

  # --- NEXUS orchestrator with strategy + playbooks ---
  if [[ -f "$SOURCE_DIR/strategy/nexus-strategy.md" ]]; then
    mkdir -p "$OUT_DIR/nexus-orchestrator"
    {
      echo "---"
      echo "name: nexus-orchestrator"
      echo "description: Multi-agent orchestration system for coordinating Agency specialists across project phases. Activates when you need coordinated workflows across multiple agent domains."
      echo "metadata:"
      echo "  category: strategy"
      echo '  emoji: "🌐"'
      echo '  color: "blue"'
      echo '  vibe: "Coordinates agency specialists into a synchronized intelligence network"'
      echo '  original_name: "NEXUS Orchestrator"'
      echo '  source: agency-agents'
      echo "---"
      echo ""
      echo "🌐 **NEXUS — Network of EXperts, Unified in Strategy**"
      echo ""
      echo "The Agency's complete operational playbook for multi-agent orchestration."
      echo ""
      echo "---"
      echo ""
      cat "$SOURCE_DIR/strategy/nexus-strategy.md"
    } > "$OUT_DIR/nexus-orchestrator/SKILL.md"

    # Append playbooks
    if [[ -d "$SOURCE_DIR/strategy/playbooks" ]]; then
      {
        echo ""
        echo "## 📋 Phase Playbooks"
        echo ""
        for pb in "$SOURCE_DIR"/strategy/playbooks/*.md; do
          [[ -f "$pb" ]] || continue
          local pb_name
          pb_name="$(basename "$pb" .md)"
          echo "### $pb_name"
          echo ""
          cat "$pb"
          echo ""
        done
      } >> "$OUT_DIR/nexus-orchestrator/SKILL.md"
    fi

    # Append coordination templates
    if [[ -d "$SOURCE_DIR/strategy/coordination" ]]; then
      {
        echo ""
        echo "## 🤝 Coordination Templates"
        echo ""
        for coord in "$SOURCE_DIR"/strategy/coordination/*.md; do
          [[ -f "$coord" ]] || continue
          local coord_name
          coord_name="$(basename "$coord" .md)"
          echo "### $coord_name"
          echo ""
          cat "$coord"
          echo ""
        done
      } >> "$OUT_DIR/nexus-orchestrator/SKILL.md"
    fi

    (( converted++ )) || true
    (( total++ )) || true
  fi

  echo ""
  header "Conversion Complete"
  info "Total: $total | Converted: $converted"
  info "Skills written to: $OUT_DIR"
  echo ""
  info "Run install.sh to deploy skills to RudraX"
}

main