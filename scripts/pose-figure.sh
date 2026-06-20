#!/usr/bin/env bash
# Pose-figure generator: text-to-image écorché anatomy figure in a yoga pose,
# in the warm "anatomy chart" style (full red-muscle body, cream connective
# tissue, natural skin on face/hands/feet, parchment background). Used to build
# the "From here → To here" pose-sequence collage.
#
# Usage:
#   ./scripts/pose-figure.sh "<pose description>" <out.png>
#
# Env knobs:
#   VIEW    camera/view line (default: full-body side profile)
#   SUBJECT body description (default: lean muscular athletic male)
#   HAIR    hair description (default: short dark top-knot)
#   REF     optional reference image path to chain the style for consistency
#   POSE_MODEL  Gemini image model (default: gemini-3.1-flash-image;
#               gemini-3-pro-image = hi-fi, pricier)
#
# Needs GEMINI_API_KEY (env or .env.local). ~\$0.04/image on the flash model.
set -euo pipefail

POSE="${1:?pose description required}"
OUT="${2:?output path required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
MODEL="${POSE_MODEL:-gemini-3.1-flash-image}"

if [[ -z "${GEMINI_API_KEY:-}" && -f "$REPO/.env.local" ]]; then
  GEMINI_API_KEY="$(grep -m1 '^GEMINI_API_KEY=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"')"
fi
[[ -n "${GEMINI_API_KEY:-}" ]] || { echo "GEMINI_API_KEY not set (env or .env.local)" >&2; exit 1; }

VIEW="${VIEW:-Full-body side profile view}"
SUBJECT="${SUBJECT:-male body, lean muscular athletic build, mid-30s}"
HAIR="${HAIR:-medium-length voluminous dark curly hair}"

# Baked style — matches the reference anatomy chart exactly.
PROMPT="Anatomical écorché illustration of an athletic ${SUBJECT} holding a yoga \
pose, drawn as a classical medical-textbook anatomy plate. Every skeletal \
muscle is exposed and rendered in realistic reddish-brown muscle tissue with \
clearly visible muscle-fiber striations; tendons, fascia and aponeuroses are \
cream-white (linea alba down the abdomen, IT band on the thigh, retinacula at \
the wrists and ankles). The face, hands and feet keep natural skin tone; \
${HAIR}. Crisp directional studio light, painterly but anatomically \
accurate shading with subtle subsurface depth. ${VIEW}. The whole body is fully \
in frame and never cropped, resting on a dark charcoal yoga mat with a soft \
contact shadow. Plain solid near-black studio background (#0b0b0b), evenly lit. \
No props, no border, no text, no labels, no watermark, no anatomical leader \
lines. POSE: ${POSE}"

ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

if [[ -n "${REF:-}" && -f "${REF}" ]]; then
  # Chain off a reference figure so style/identity stays consistent.
  base64 -i "$REF" | tr -d '\n' > "$tmp/ref.b64"
  REFTEXT="Match the exact art style, body texture, lighting, color palette and \
proportions of the attached reference figure; same character. "
  jq -n --rawfile data "$tmp/ref.b64" --arg prompt "${REFTEXT}${PROMPT}" \
    '{contents:[{parts:[{inline_data:{mime_type:"image/png",data:$data}},{text:$prompt}]}]}' \
    > "$tmp/payload.json"
else
  jq -n --arg prompt "$PROMPT" \
    '{contents:[{parts:[{text:$prompt}]}]}' > "$tmp/payload.json"
fi

curl -s --max-time 180 -X POST "$ENDPOINT" \
  -H "x-goog-api-key: ${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @"$tmp/payload.json" > "$tmp/resp.json"

err="$(jq -r '.error.message // empty' "$tmp/resp.json")"
[[ -z "$err" ]] || { echo "API error: $err" >&2; exit 1; }

jq -r '[.candidates[0].content.parts[] | .inlineData.data // empty] | map(select(. != "")) | first // empty' \
  "$tmp/resp.json" > "$tmp/out.b64"
[[ -s "$tmp/out.b64" ]] || {
  echo "no image in response:" >&2
  jq -r '.candidates[0].content.parts[]?.text // .candidates[0].finishReason // .' "$tmp/resp.json" | head -5 >&2
  exit 1
}
base64 -d -i "$tmp/out.b64" > "$OUT"
echo "-> $OUT"
