#!/usr/bin/env bash
# Stops and removes the motu-control LaunchAgent installed by install-launchagent.sh.
set -euo pipefail

LABEL="com.plarso.motu-control"
PLIST_DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
rm -f "$PLIST_DEST"

echo "Removed ${LABEL} LaunchAgent."
