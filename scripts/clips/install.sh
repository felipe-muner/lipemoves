#!/bin/zsh
# Install (or remove with --remove) the launchd job that runs a clip run every
# 3 hours, even when no Claude Code terminal is open.
#   zsh scripts/clips/install.sh          # install / update
#   zsh scripts/clips/install.sh --remove # stop and delete it
set -e
LABEL=com.lipemoves.clips
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT=/Users/felipe/projects/lipemoves/scripts/clips/run-clips.sh

if [[ "${1:-}" == "--remove" ]]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "removed $LABEL"
  exit 0
fi

chmod +x "$SCRIPT"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/zsh</string><string>-l</string><string>$SCRIPT</string></array>
  <key>StartInterval</key><integer>10800</integer>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/lipemoves-clips.launchd.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/lipemoves-clips.launchd.log</string>
</dict>
</plist>
EOF
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed $LABEL: runs every 3 hours. Log: ~/Library/Logs/lipemoves-clips.log"
