#!/usr/bin/env bash
set -euo pipefail

# Paints GitHub contribution graph with backdated commits.
# Pattern: varied intensity, ~85% of days filled, mixed light/medium/heavy.

cd "$(dirname "$0")/.."

LOG_FILE=".activity-log"
touch "$LOG_FILE"

# 365 days back to yesterday
DAYS=365
TOTAL_COMMITS=0
TOTAL_DAYS=0

for i in $(seq $DAYS -1 1); do
  DATE=$(date -v-${i}d +%Y-%m-%d)
  R=$((RANDOM % 100))

  # Distribution: 15% skip, 35% light(1-2), 35% medium(3-5), 15% heavy(6-10)
  if [ $R -lt 15 ]; then
    COUNT=0
  elif [ $R -lt 50 ]; then
    COUNT=$((1 + RANDOM % 2))
  elif [ $R -lt 85 ]; then
    COUNT=$((3 + RANDOM % 3))
  else
    COUNT=$((6 + RANDOM % 5))
  fi

  [ $COUNT -eq 0 ] && continue
  TOTAL_DAYS=$((TOTAL_DAYS + 1))

  for j in $(seq 1 $COUNT); do
    HOUR=$((8 + RANDOM % 14))
    MIN=$((RANDOM % 60))
    SEC=$((RANDOM % 60))
    TS="${DATE}T$(printf '%02d:%02d:%02d' $HOUR $MIN $SEC)"

    echo "$TS $RANDOM" >> "$LOG_FILE"
    git add "$LOG_FILE"
    GIT_AUTHOR_DATE="$TS" GIT_COMMITTER_DATE="$TS" \
      git commit -q -m "chore: activity $TS"
    TOTAL_COMMITS=$((TOTAL_COMMITS + 1))
  done
done

echo "Done. $TOTAL_COMMITS commits across $TOTAL_DAYS days."
