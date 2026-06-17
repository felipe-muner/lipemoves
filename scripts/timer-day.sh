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
  # Web-safe H.264 (faststart, yuv420p, even dims). If the source is HDR
  # (HLG/PQ, BT.2020) do a FAITHFUL colorimetric HLG/PQ→SDR conversion only:
  # linearize, convert primaries+transfer BT.2020→BT.709, clip out-of-range
  # highlights. NO creative tonemap / desaturation — colors must not shift.
  TRC="$("${FFMPEG%ffmpeg}ffprobe" -v error -select_streams v:0 \
    -show_entries stream=color_transfer -of csv=p=0 "$clip" 2>/dev/null || true)"
  if [[ "$TRC" == "arib-std-b67" || "$TRC" == smpte2084 || "$TRC" == "smpte428" ]]; then
    VF="zscale=t=linear:npl=203,zscale=p=bt709:t=bt709:m=bt709:r=tv,format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2"
  else
    VF="scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"
  fi
  "$FFMPEG" -y -loglevel error -i "$clip" -vf "$VF" \
    -c:v libx264 -preset veryfast -crf 20 -movflags +faststart \
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
