#!/bin/bash
# Installs statusline-command.sh into ~/.claude and points settings.json at it.
# Usage: bash install.sh [safe-sf-org-alias]
#   From a clone it uses the sibling script; run on its own it downloads it from GitHub.
#   safe-sf-org-alias: the one org rendered green; omit it and every org renders red.
set -euo pipefail

REMOTE="https://raw.githubusercontent.com/handcrafting-codes/claude-utils/main/claude-statusline/statusline-command.sh"

command -v jq >/dev/null || { echo "jq is required: brew install jq" >&2; exit 1; }

safe_org="${1:-}"
if ! [[ "$safe_org" =~ ^[A-Za-z0-9._@-]*$ ]]; then
    echo "Invalid org alias: $safe_org" >&2
    exit 1
fi

dest="$HOME/.claude/statusline-command.sh"
settings="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"

src="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)/statusline-command.sh"
if [ -f "$src" ]; then
    cp "$src" "$dest"
else
    curl -fsSL "$REMOTE" -o "$dest"
fi

tmp=$(mktemp)
sed "s/^SAFE_SF_ORG=.*/SAFE_SF_ORG=\"${safe_org}\"/" "$dest" > "$tmp" && mv "$tmp" "$dest"
chmod +x "$dest"

if [ -f "$settings" ]; then
    cp "$settings" "$settings.bak.$(date +%s)"
else
    echo '{}' > "$settings"
fi
tmp=$(mktemp)
jq --arg cmd "bash $dest" '.statusLine = {type: "command", command: $cmd}' "$settings" > "$tmp" && mv "$tmp" "$settings"

echo "Installed $dest (green org: ${safe_org:-none}) and set statusLine in $settings. Restart Claude Code."
