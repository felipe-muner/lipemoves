#!/usr/bin/env bash
# Anatomy-figures compositor: send a training photo to the Gemini image API
# and get back the same photo with two life-size écorché anatomy figures
# standing in the background, the working muscles highlighted in red —
# the "anatomy spectators" reel style. The athlete and scene stay untouched.
#
# Usage:
#   ./scripts/anatomy.sh <photo-or-folder> [muscles] [out]
#
# Defaults: muscles="chest and shoulders"
#   out defaults to <photo>-anatomy.png next to the source.
#   Folder mode: processes every jpg/jpeg/png/heic inside (out arg ignored).
#
# Examples:
#   ./scripts/anatomy.sh photo.jpg "forearms, shoulders, glutes and hamstrings"
#   ANATOMY_MODEL=gemini-3-pro-image ./scripts/anatomy.sh photo.jpg   # hi-fi, pricier
#
# Notes:
#   - Needs GEMINI_API_KEY (env, or read from .env.local). Billed per image
#     (~$0.04 on the flash model).
#   - HEIC inputs are converted to JPEG via sips before upload.
set -euo pipefail

SRC="${1:?photo or folder required}"
MUSCLES="${2:-chest and shoulders}"
OUT_ARG="${3:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
MODEL="${ANATOMY_MODEL:-gemini-3.1-flash-image}"

if [[ -z "${GEMINI_API_KEY:-}" && -f "$REPO/.env.local" ]]; then
  GEMINI_API_KEY="$(grep -m1 '^GEMINI_API_KEY=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"')"
fi
[[ -n "${GEMINI_API_KEY:-}" ]] || { echo "GEMINI_API_KEY not set (env or .env.local)" >&2; exit 1; }

# ---- Look knobs -------------------------------------------------------------
# Museum-statue style with personality (the Moskalev reel look): stone-gray
# écorché figures, only the working muscles red. ${MUSCLES} swaps per
# exercise; FIGURES ("one"/"two") and GAG (what they're doing) via env.
FIGURES="${FIGURES:-two}"
GAG="${GAG:-One figure faces away from the camera showing its back. The \
other faces the camera with a huge exaggerated creepy grin, giving a \
thumbs-up.}"
PROMPT="Add ${FIGURES} life-size écorché anatomy figure(s) standing in the \
background, like hyper-realistic classical anatomy museum statues: skinless \
bodies of desaturated stone-gray flesh with finely detailed muscle fiber \
texture. ONLY the ${MUSCLES} are bright red — every other muscle stays \
gray. ${GAG} They are watching me train. Match the scene's lighting, \
shadows and perspective exactly, with correct contact shadows under their \
feet. Do not change me or anything else in the photo."
# -----------------------------------------------------------------------------

ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent"

process_one() {
  local in="$1" out="$2"
  local tmp; tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  local upload="$in" mime="image/jpeg"
  case "${in##*.}" in
    [Pp][Nn][Gg]) mime="image/png" ;;
    [Hh][Ee][Ii][Cc])
      sips -s format jpeg "$in" --out "$tmp/in.jpg" >/dev/null
      upload="$tmp/in.jpg" ;;
  esac

  base64 -i "$upload" | tr -d '\n' > "$tmp/img.b64"
  jq -n --rawfile data "$tmp/img.b64" --arg mime "$mime" --arg prompt "$PROMPT" \
    '{contents:[{parts:[{inline_data:{mime_type:$mime,data:$data}},{text:$prompt}]}]}' \
    > "$tmp/payload.json"

  curl -s --max-time 180 -X POST "$ENDPOINT" \
    -H "x-goog-api-key: ${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    --data-binary @"$tmp/payload.json" > "$tmp/resp.json"

  local err
  err="$(jq -r '.error.message // empty' "$tmp/resp.json")"
  [[ -z "$err" ]] || { echo "  API error: $err" >&2; return 1; }

  jq -r '[.candidates[0].content.parts[] | .inlineData.data // empty] | map(select(. != "")) | first // empty' \
    "$tmp/resp.json" > "$tmp/out.b64"
  [[ -s "$tmp/out.b64" ]] || {
    echo "  no image in response:" >&2
    jq -r '.candidates[0].content.parts[]?.text // .candidates[0].finishReason // .' "$tmp/resp.json" | head -5 >&2
    return 1
  }
  base64 -d -i "$tmp/out.b64" > "$out"
  echo "  -> $out"
}

echo "Anatomy figures (model: $MODEL)"
echo "  muscles: $MUSCLES"

if [[ -d "$SRC" ]]; then
  shopt -s nullglob nocaseglob
  files=("$SRC"/*.jpg "$SRC"/*.jpeg "$SRC"/*.png "$SRC"/*.heic)
  shopt -u nocaseglob
  [[ ${#files[@]} -gt 0 ]] || { echo "no images in $SRC" >&2; exit 1; }
  for f in "${files[@]}"; do
    [[ "$f" == *-anatomy.* ]] && continue
    echo "$f"
    process_one "$f" "${f%.*}-anatomy.png" || true
  done
else
  [[ -f "$SRC" ]] || { echo "not found: $SRC" >&2; exit 1; }
  process_one "$SRC" "${OUT_ARG:-${SRC%.*}-anatomy.png}"
fi
