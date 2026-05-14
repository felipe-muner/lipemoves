#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG_FILE=".activity-log"
DAYS=90
ADDED=0

for i in $(seq $DAYS -1 0); do
  DATE=$(date -v-${i}d +%Y-%m-%d)
  EXISTING=$(git log --since="${DATE} 00:00" --until="${DATE} 23:59" --oneline 2>/dev/null | wc -l | tr -d ' ')
  TARGET=$((4 + RANDOM % 5))
  NEED=$((TARGET - EXISTING))
  [ $NEED -le 0 ] && continue

  for j in $(seq 1 $NEED); do
    HOUR=$((8 + RANDOM % 14))
    MIN=$((RANDOM % 60))
    SEC=$((RANDOM % 60))
    TS="${DATE}T$(printf '%02d:%02d:%02d' $HOUR $MIN $SEC)"
    echo "$TS $RANDOM" >> "$LOG_FILE"
    git add "$LOG_FILE"
    GIT_AUTHOR_DATE="$TS" GIT_COMMITTER_DATE="$TS" \
      git commit -q -m "chore: activity $TS"
    ADDED=$((ADDED + 1))
  done
done

echo "Added $ADDED commits to fill recent days."
