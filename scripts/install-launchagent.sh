#!/usr/bin/env bash
# Installs motu-control as a macOS LaunchAgent so it starts automatically at login.
# Safe to re-run after pulling new code - it rebuilds and reinstalls the agent.
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "This installer is macOS-only (uses launchd)." >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="com.plarso.motu-control"
PLIST_DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$HOME/Library/Logs/motu-control"
NODE_PATH="$(command -v node || true)"

if [[ -z "$NODE_PATH" ]]; then
  echo "Could not find 'node' on PATH. Install Node.js first (e.g. 'brew install node')." >&2
  exit 1
fi

echo "Using node: $NODE_PATH"
echo "Building project..."
(cd "$REPO_DIR" && npm run build)

mkdir -p "$LOG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

sed \
  -e "s#__NODE_PATH__#${NODE_PATH}#g" \
  -e "s#__REPO_DIR__#${REPO_DIR}#g" \
  -e "s#__LOG_DIR__#${LOG_DIR}#g" \
  "$REPO_DIR/scripts/${LABEL}.plist.template" > "$PLIST_DEST"

# Unload any previous instance before (re)installing.
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
launchctl enable "gui/$(id -u)/${LABEL}"
# RunAtLoad doesn't auto-start on macOS Sonoma/Sequoia after bootstrap; kick it explicitly.
launchctl kickstart "gui/$(id -u)/${LABEL}"

echo
echo "Installed and started ${LABEL}."
echo "Logs:    ${LOG_DIR}/motu-control.out.log / motu-control.err.log"
echo "Status:  launchctl print gui/$(id -u)/${LABEL}"
echo "Restart: launchctl kickstart -k gui/$(id -u)/${LABEL}"
echo "Remove:  scripts/uninstall-launchagent.sh"
