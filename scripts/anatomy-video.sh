#!/usr/bin/env bash
# Anatomy-figures video compositor: the "anatomy spectators" reel effect for a
# locked-camera training video — now using the SAME look as the photo script
# (scripts/anatomy.sh). Instead of a flat green-screen sticker, it asks Gemini
# to paint the écorché figures DIRECTLY into a reference frame of the real
# scene — so they get correct contact shadows, grounding and perspective.
#
# How it stays consistent across the clip (no per-frame flicker, no Swift):
#   1. Extract one reference frame and tonemap to SDR if the source is HDR.
#   2. Gemini edits that frame in-scene (figures + shadows baked in).
#   3. A DIFFERENCE MATTE between the edited frame and the original isolates
#      only the added pixels (figures + their shadows) as a static layer.
#   4. That layer is overlaid on every frame of the clip. The figures hold
#      still — shoot on a tripod and keep your movement clear of where they
#      stand (if you cross in front of them, the figures draw on top).
#
# Usage:
#   ./scripts/anatomy-video.sh <video> [muscles] [out.mp4]
#
# Defaults: muscles="chest and shoulders"
#   out defaults to <video>-anatomy.mp4 next to the source.
#
# Knobs (env):
#   FRAME_T=1   timestamp (s) of the reference frame sent to Gemini
#   EDIT=       reuse an existing edited frame png (skips the API call) — keeps
#               the exact same figures/shadows across re-renders
#   PREV_REF=   feed a previous level's edited frame as a 2nd reference so the
#               SAME characters return more muscular each level (the "couple
#               leveling up" progression across a 1..N series of clips)
#   THRESH=14   difference-matte cutoff (0-255). Lower keeps more of the soft
#               contact shadows but more noise; raise it if specks appear.
#   FEATHER=4   matte edge softening (gaussian sigma) so the figures blend in
#   FIGURES=two figure count: "one" or "two"
#   GAG=        what the figures are doing. Preset ideas:
#     "One faces away showing its back; the other grins hugely, thumbs-up." (default)
#     "They stand arm in arm like old buddies, both grinning at the camera."
#     "A single figure stands calmly, arms relaxed, watching me with a serene face."
#     "The figure leans casually with arms crossed, smirking at me."
#   ANATOMY_MODEL=gemini-3.1-flash-image
#
# Needs GEMINI_API_KEY (env or .env.local). ~$0.04 per generated frame.
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
MUSCLES="${2:-chest and shoulders}"
OUT="${3:-${VIDEO%.*}-anatomy.mp4}"

FRAME_T="${FRAME_T:-1}"
THRESH="${THRESH:-14}"
FEATHER="${FEATHER:-4}"
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

# In-scene edit prompt (mirrors scripts/anatomy.sh): the figures are painted
# into the real photo, matching its light and casting real contact shadows.
PROMPT="Add ${FIGURES} life-size écorché anatomy figure(s) standing in the \
scene watching me train — full body from head to feet, rendered like a \
hyper-realistic 3D MEDICAL ANATOMY MODEL: skinless bodies of pale \
grayish-white muscle with finely detailed, realistic muscle-fiber texture \
and a subtle soft sheen, anatomically accurate. The face is a skinless \
muscular head wearing a huge, wide, exaggerated unsettling grin. \
ONLY the ${MUSCLES} are vivid bright red; every other muscle stays the pale \
gray-white. ${GAG} Match the scene's lighting, color temperature and \
perspective exactly, with correct contact shadows under their feet on the \
ground. Do not change me or anything else in the photo."

# Resolve the DISPLAY dimensions + color transfer up front so the reference
# frame, the edit and the base video all live in the same (SDR) space — the
# difference matte only makes sense when both sides match.
read -r W H FPS TRC <<< "$("$FFPROBE" -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,color_transfer \
  -of csv=p=0 "$VIDEO" | awk -F, '{print $1, $2, $3, $4}')"
# iPhone clips store portrait as landscape + a rotation flag; ffmpeg
# auto-rotates before filtering, so swap to the DISPLAY dims.
ROT="$("$FFPROBE" -v error -select_streams v:0 -show_entries side_data=rotation \
       -of default=nw=1:nk=1 "$VIDEO" 2>/dev/null | head -1 || true)"
ROT="${ROT:-0}"
if [[ "$ROT" == "90" || "$ROT" == "-90" || "$ROT" == "270" || "$ROT" == "-270" ]]; then
  tmp="$W"; W="$H"; H="$tmp"
fi

PRE="null"
if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  echo "HDR source ($TRC) -> tonemapping to SDR"
  PRE="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
fi

# Reference frame in the SAME space we'll composite in (SDR if HDR source).
"$FFMPEG" -y -v error -ss "$FRAME_T" -i "$VIDEO" \
  -vf "${PRE},scale=${W}:${H}" -frames:v 1 "$TMP/ref.png"

EDIT="${EDIT:-}"
if [[ -z "$EDIT" ]]; then
  [[ -n "${GEMINI_API_KEY:-}" ]] || { echo "GEMINI_API_KEY not set (env or .env.local)" >&2; exit 1; }
  echo "Reference frame @ ${FRAME_T}s -> Gemini ($MODEL) [in-scene edit]"
  base64 -i "$TMP/ref.png" | tr -d '\n' > "$TMP/img.b64"
  PREV_REF="${PREV_REF:-}"
  if [[ -n "$PREV_REF" && -f "$PREV_REF" ]]; then
    echo "  chaining characters from: $PREV_REF"
    PROMPT="$PROMPT A SECOND reference image shows the exact écorché figures \
from the previous level: keep them as the SAME characters — same faces, same \
identity, same proportions and style — but render them noticeably MORE \
muscular and developed, as if they leveled up."
    base64 -i "$PREV_REF" | tr -d '\n' > "$TMP/prev.b64"
    jq -n --rawfile data "$TMP/img.b64" --rawfile prev "$TMP/prev.b64" --arg prompt "$PROMPT" \
      '{contents:[{parts:[{inline_data:{mime_type:"image/png",data:$data}},{inline_data:{mime_type:"image/png",data:$prev}},{text:$prompt}]}]}' \
      > "$TMP/payload.json"
  else
    jq -n --rawfile data "$TMP/img.b64" --arg prompt "$PROMPT" \
      '{contents:[{parts:[{inline_data:{mime_type:"image/png",data:$data}},{text:$prompt}]}]}' \
      > "$TMP/payload.json"
  fi
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
  EDIT="${VIDEO%.*}-edit.png"
  base64 -d -i "$TMP/out.b64" > "$EDIT"
  echo "  edited frame -> $EDIT (reuse via EDIT=... for the same figures)"
fi

# Normalise the edit to the exact display size so it lines up with the frame.
"$FFMPEG" -y -v error -i "$EDIT" -vf "scale=${W}:${H},setsar=1" "$TMP/edit.png"

# Difference matte: the edit minus the original leaves only the added figures
# and their contact shadows. The difference is taken in RGB and reduced by the
# MAX across channels (not luma) — a red muscle on green grass barely changes
# luma but swings hard in a channel, so a luma-only matte would miss it.
# Threshold to drop compression noise, despeckle, grow to catch soft edges,
# then feather.
echo "Building difference matte (thresh=${THRESH}, feather=${FEATHER})"
"$FFMPEG" -y -v error -i "$TMP/edit.png" -i "$TMP/ref.png" \
  -filter_complex "\
[0:v]format=gbrp[e];[1:v]format=gbrp[r];\
[e][r]blend=all_mode=difference,format=gbrp,extractplanes=r+g+b[dr][dg][db];\
[dr][dg]blend=all_mode=lighten[d1];\
[d1][db]blend=all_mode=lighten,\
geq=lum='if(gt(lum(X\,Y)\,${THRESH})\,255\,0)',\
median=radius=3,dilation,dilation,dilation,gblur=sigma=${FEATHER}" \
  "$TMP/mask.png"

# Composite the isolated figures+shadow layer over the (SDR) clip. The edit and
# matte are single stills; overlay's eof_action=repeat holds them for the whole
# clip (no -loop, which would never terminate).
echo "Compositing figures over the clip (${W}x${H})"
"$FFMPEG" -y -hide_banner -loglevel error -stats \
  -i "$VIDEO" -i "$TMP/edit.png" -i "$TMP/mask.png" \
  -filter_complex "\
[0:v]${PRE}[base];\
[1:v][2:v]alphamerge[fig];\
[base][fig]overlay=0:0:eof_action=repeat[v]" \
  -map "[v]" -map "0:a:0?" \
  -c:v hevc_videotoolbox -b:v 12M -tag:v hvc1 -c:a copy \
  "$OUT"

echo "-> $OUT"
