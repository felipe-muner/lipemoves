#!/usr/bin/env bash
# Anatomy-figures video compositor: the "anatomy spectators" reel effect for a
# locked-camera training video. Extracts a reference frame, asks the Gemini
# image API to render two écorché museum-statue figures (working muscles in
# red, one showing its back, one grinning with a thumbs-up) on a green screen
# matching the scene's lighting, then chroma-keys them into the background of
# the whole clip. The figures are static — shoot on a tripod and keep your
# movement clear of where they stand.
#
# Usage:
#   ./scripts/anatomy-video.sh <video> [muscles] [out.mp4]
#
# Defaults: muscles="chest and shoulders"
#   out defaults to <video>-anatomy.mp4 next to the source.
#
# Knobs (env):
#   H_PCT=52    figure-group height as % of video height
#   X_PCT=1     left edge of the figures as % of video width
#   Y_PCT=23    top edge of the figures as % of video height
#   FRAME_T=1   timestamp (s) of the reference frame sent to Gemini
#   STICKER=    reuse an existing green-screen sticker png (skips the API call,
#               keeps the same characters across reels)
#   FIGURES=two figure count: "one" or "two"
#   GAG=        what the figures are doing. Preset ideas:
#     "One faces away showing its back; the other grins hugely, thumbs-up." (default)
#     "They stand arm in arm like old buddies, both grinning at the camera."
#     "A single figure stands calmly, arms relaxed, watching me with a serene face."
#     "The figure leans casually with arms crossed, smirking at me."
#   ANATOMY_MODEL=gemini-3.1-flash-image
#
# Needs GEMINI_API_KEY (env or .env.local). ~$0.04 per generated sticker.
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
MUSCLES="${2:-chest and shoulders}"
OUT="${3:-${VIDEO%.*}-anatomy.mp4}"

H_PCT="${H_PCT:-52}"
X_PCT="${X_PCT:-1}"
Y_PCT="${Y_PCT:-23}"
FRAME_T="${FRAME_T:-1}"
MODEL="${ANATOMY_MODEL:-gemini-3.1-flash-image}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
if [[ -z "${GEMINI_API_KEY:-}" && -f "$REPO/.env.local" ]]; then
  GEMINI_API_KEY="$(grep -m1 '^GEMINI_API_KEY=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"')"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FIGURES="${FIGURES:-two}"
GAG="${GAG:-One figure faces away from the camera showing its back. The \
other faces the camera with a huge exaggerated creepy grin, giving a \
thumbs-up.}"

PROMPT="Using this photo strictly as a lighting, color-temperature and \
perspective reference, generate a new image: ${FIGURES} life-size écorché \
anatomy figure(s) standing, full body from head to feet, like \
hyper-realistic classical anatomy museum statues — skinless bodies of \
desaturated stone-gray flesh with finely detailed muscle fiber texture. \
ONLY the ${MUSCLES} are bright red; every other muscle stays gray. ${GAG} \
Render on a flat, uniform, pure green background (#00FF00): no shadows on \
the background, no ground, no other objects, and the figures must not \
touch the image edges."

STICKER="${STICKER:-}"
if [[ -z "$STICKER" ]]; then
  [[ -n "${GEMINI_API_KEY:-}" ]] || { echo "GEMINI_API_KEY not set (env or .env.local)" >&2; exit 1; }
  echo "Reference frame @ ${FRAME_T}s -> Gemini ($MODEL)"
  "$FFMPEG" -y -v error -ss "$FRAME_T" -i "$VIDEO" -frames:v 1 "$TMP/ref.jpg"
  base64 -i "$TMP/ref.jpg" | tr -d '\n' > "$TMP/img.b64"
  jq -n --rawfile data "$TMP/img.b64" --arg prompt "$PROMPT" \
    '{contents:[{parts:[{inline_data:{mime_type:"image/jpeg",data:$data}},{text:$prompt}]}]}' \
    > "$TMP/payload.json"
  curl -s --max-time 180 -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent" \
    -H "x-goog-api-key: ${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    --data-binary @"$TMP/payload.json" > "$TMP/resp.json"
  err="$(jq -r '.error.message // empty' "$TMP/resp.json")"
  [[ -z "$err" ]] || { echo "API error: $err" >&2; exit 1; }
  jq -r '[.candidates[0].content.parts[] | .inlineData.data // empty] | map(select(. != "")) | first // empty' \
    "$TMP/resp.json" > "$TMP/out.b64"
  [[ -s "$TMP/out.b64" ]] || { echo "no image in response" >&2; exit 1; }
  STICKER="${VIDEO%.*}-sticker.png"
  base64 -d -i "$TMP/out.b64" > "$STICKER"
  echo "  sticker -> $STICKER (reuse via STICKER=... for consistent characters)"
fi

# Key on the sticker's actual corner color — Gemini's "pure green" drifts.
KEY="$("$FFMPEG" -v error -i "$STICKER" -vf "format=rgb24,crop=2:2:4:4" -frames:v 1 \
      -f rawvideo -pix_fmt rgb24 - | xxd -p | head -c6)"

read -r W H FPS TRC <<< "$("$FFPROBE" -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,color_transfer \
  -of csv=p=0 "$VIDEO" | awk -F, '{print $1, $2, $3, $4}')"
SH=$(( H * H_PCT / 100 ))
SX=$(( W * X_PCT / 100 ))
SY=$(( H * Y_PCT / 100 ))

echo "Compositing: key=0x${KEY} figures ${SH}px tall at ${SX},${SY} (${W}x${H})"

PRE="null"
if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  echo "  HDR source ($TRC) -> tonemapping to SDR"
  PRE="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
fi

"$FFMPEG" -y -hide_banner -loglevel error -stats \
  -i "$VIDEO" -i "$STICKER" \
  -filter_complex "\
[1:v]chromakey=0x${KEY}:0.20:0.08,despill=type=green,scale=-2:${SH}[stk];\
[0:v]${PRE}[base];\
[base][stk]overlay=${SX}:${SY}[v]" \
  -map "[v]" -map 0:a:0? \
  -c:v hevc_videotoolbox -b:v 12M -tag:v hvc1 -c:a copy \
  "$OUT"

echo "-> $OUT"
