#!/usr/bin/env bash
# Build a dated /timer workout: transcode a folder of clips to web-friendly MP4,
# upload them to Bunny Storage, and print the day-file JSON to drop into
# public/timer-days/<date>.json.
#
# Usage:
#   ./scripts/timer-day.sh <date:YYYY-MM-DD> <dir-with-clips> [workSecs]
#
# Example:
#   ./scripts/timer-day.sh 2026-06-17 ~/Movies/2026-06-17 50
#
# Clips are uploaded in NAME order (v1.mov, v2.mov, …) — one per minute. Each is
# transcoded to H.264 + AAC, faststart, so it autoplays/loops in the browser.
#
# Env (from apps' .env or your shell):
#   BUNNY_STORAGE_ZONE   Bunny Storage zone name (NOT the Stream library)
#   BUNNY_STORAGE_KEY    Storage zone password (Storage > FTP & API Access)
#   BUNNY_STORAGE_HOST   optional, default storage.bunnycdn.com (region endpoint)
#   BUNNY_CDN_BASE       public pull-zone base, e.g. https://lipemoves.b-cdn.net
set -euo pipefail

DATE="${1:?date required (YYYY-MM-DD)}"
SRC_DIR="${2:?clips dir required}"
WORK="${3:-50}"

[[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "bad date: $DATE" >&2; exit 1; }
: "${BUNNY_STORAGE_ZONE:?set BUNNY_STORAGE_ZONE}"
: "${BUNNY_STORAGE_KEY:?set BUNNY_STORAGE_KEY}"
: "${BUNNY_CDN_BASE:?set BUNNY_CDN_BASE (e.g. https://lipemoves.b-cdn.net)}"
STORAGE_HOST="${BUNNY_STORAGE_HOST:-storage.bunnycdn.com}"

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
[[ -x "$FFMPEG" ]] || FFMPEG="ffmpeg"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shopt -s nullglob nocaseglob
CLIPS=("$SRC_DIR"/*.{mov,mp4,m4v})
shopt -u nullglob nocaseglob
[[ ${#CLIPS[@]} -gt 0 ]] || { echo "no clips in $SRC_DIR" >&2; exit 1; }
IFS=$'\n' CLIPS=($(sort <<<"${CLIPS[*]}")); unset IFS

echo "→ ${#CLIPS[@]} clips for $DATE" >&2
blocks=()
i=0
for clip in "${CLIPS[@]}"; do
  i=$((i + 1))
  name="v${i}.mp4"
  out="$TMP/$name"
  echo "  [$i] transcoding $(basename "$clip")…" >&2
  # H.264 high, faststart, even dimensions; strip to web-safe yuv420p.
  "$FFMPEG" -y -loglevel error -i "$clip" \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p \
    -c:v libx264 -preset veryfast -crf 23 -movflags +faststart \
    -c:a aac -b:a 128k "$out"

  url="$BUNNY_CDN_BASE/timer/$DATE/$name"
  echo "  [$i] uploading → $url" >&2
  curl -fsS -X PUT \
    -H "AccessKey: $BUNNY_STORAGE_KEY" \
    -H "Content-Type: video/mp4" \
    --data-binary @"$out" \
    "https://$STORAGE_HOST/$BUNNY_STORAGE_ZONE/timer/$DATE/$name" >/dev/null

  blocks+=("    { \"name\": \"Exercise $i\", \"video\": \"$url\", \"work\": $WORK }")
done

# Print the day-file JSON (edit the names, then save to public/timer-days/).
joined="$(printf '%s,\n' "${blocks[@]}")"
joined="${joined%,$'\n'}"
cat <<JSON

==== public/timer-days/$DATE.json ====
{
  "date": "$DATE",
  "title": "Edit me",
  "rounds": 1,
  "blocks": [
$joined
  ]
}
JSON
echo "→ open /timer?date=$DATE once saved" >&2
