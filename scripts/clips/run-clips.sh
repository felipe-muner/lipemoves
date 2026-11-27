#!/bin/zsh
# One scheduled clip run, outside any open Claude Code session.
# Fired every 3 hours by ~/Library/LaunchAgents/com.lipemoves.clips.plist
# (installed by scripts/clips/install.sh). Follows assets/glossary/RUN_CLIPS.md.
#
# Uses the same "auto" permission mode as an interactive session (no extra
# permissions are granted). Needs Chrome open with the Claude extension
# connected and the Mac awake.

set -u
REPO=/Users/felipe/projects/lipemoves
LOG="$HOME/Library/Logs/lipemoves-clips.log"
LOCK=/tmp/lipemoves-clips.lock

# Skip if a run is still going.
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "$(date '+%F %T') skipped: previous run still going" >> "$LOG"
  exit 0
fi
trap 'rmdir "$LOCK"' EXIT

cd "$REPO" || exit 1
echo "=== $(date '+%F %T') run start" >> "$LOG"
/usr/bin/caffeinate -i "$HOME/.local/bin/claude" -p --chrome --permission-mode auto \
  "Scheduled clip run. Read assets/glossary/RUN_CLIPS.md and follow it exactly for one run." \
  >> "$LOG" 2>&1
echo "=== $(date '+%F %T') run end (exit $?)" >> "$LOG"
