#!/usr/bin/env bash
# Cover/thumbnail maker: take an image (a video frame) + a phrase, and burn
# lime-green text with a thick black stroke — viral-fitness style.
#
# Usage:
#   ./scripts/cover.sh <image> "YOUR PHRASE" [out.jpg] [top|bottom|center] \
#                      [xFrac] [yFrac] [widthFrac] [grunge:0|1] [thickenPx]
#
# Notes:
#   - Use \n in the phrase to force line breaks, e.g. "TRAIN LIKE\nOUR ANCESTORS"
#   - grunge=1 swaps the thick green outline for a distressed "stamp" look:
#     a thin dark keyline + rough edges + scratches + a soft drop shadow.
#   - thickenPx dilates the glyphs for a chunkier font (only with grunge=1).
#   - Output is forced to 1080x1920 portrait (Reels/TikTok). Source is
#     center-cropped to fill if its aspect differs.
#   - xFrac/yFrac (0..1) place the text block's CENTER (free-drag from studio).
#   - widthFrac (0..~2) is the widest line's width as a fraction of the frame —
#     the studio measures the live preview so the burn matches it exactly.
#     When omitted, the text auto-fits a fixed box at the named position.
set -euo pipefail

MAGICK="$(command -v magick || true)"
[[ -n "$MAGICK" ]] || { echo "ImageMagick (magick) not found. brew install imagemagick" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

IMG="${1:?image required}"
TEXT="${2:?text required}"
OUT="${3:-${IMG%.*}-cover.jpg}"
POS="${4:-bottom}"          # top | bottom | center (preset fallback)
XFRAC="${5:-}"              # optional: text-block center X as 0..1 fraction
YFRAC="${6:-}"             # optional: text-block center Y as 0..1 fraction
WFRAC="${7:-}"            # optional: widest line width as fraction of frame
GRUNGE="${8:-0}"         # optional: 1 = distressed grunge look instead of stroke
THICKEN="${9:-0}"       # optional: extra glyph dilation (grunge only)

# ---- Look knobs -------------------------------------------------------------
W=1080; H=1920               # output canvas (portrait)
FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"  # wide+bold; matches ref
[[ -f "$FONT" ]] || FONT="Impact"
GREEN="#00EF00"              # pure green fill (matches the "3 SIMBA" cover)
STROKE="#000000"            # black outline color
OUTLINE=13                   # outline radius in px (auto-fit path)
MARGIN=48                    # side padding so text isn't edge-to-edge raw
TEXT_W=$(( W - MARGIN*2 ))   # text box width (auto-fit path)
BAND_H=560                   # height of the area the text is fit into
REF_PS=220                   # reference point size for the explicit-width path
REF_OUT=21                   # outline at REF_PS — reproduces the original ~13px
                             # border at the default fill width, and scales with
                             # the text when you resize.
# -----------------------------------------------------------------------------

# 1) Normalize the frame: fill 1080x1920, center-crop overflow.
BG=$(mktemp -t coverbg).png
"$MAGICK" "$IMG" -auto-orient \
  -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
  "$BG"

TXT=$(mktemp -t covertxt).png

if [[ -n "$XFRAC" && -n "$YFRAC" && -n "$WFRAC" ]]; then
  # --- Explicit-width path (studio drag + resize) --------------------------
  # Render the text once at a big reference size (label: honors \n and never
  # wraps), with the outline baked in, then scale the whole layer — outline and
  # all — so the widest line spans exactly WIDTH = WFRAC*W. Because we scale the
  # measured GREEN width, the burn lines up with the live preview regardless of
  # CSS-vs-ImageMagick font-metric differences.
  GREEN_REF=$(mktemp -t covergrn).png
  "$MAGICK" -background none -fill "$GREEN" -stroke none -font "$FONT" \
    -pointsize "$REF_PS" -gravity center "label:${TEXT}" "$GREEN_REF"
  GREEN_W=$("$MAGICK" identify -format "%w" "$GREEN_REF")

  if [[ "$GRUNGE" == "1" ]]; then
    # Distressed look: grunge the plain coloured reference (no stroke ring).
    bash "$SCRIPT_DIR/grunge-text.sh" "$GREEN_REF" "$TXT" "$GREEN" "$THICKEN"
  else
    "$MAGICK" \
      \( -background none -fill "$STROKE" -stroke none -font "$FONT" \
         -pointsize "$REF_PS" -gravity center "label:${TEXT}" \
         -bordercolor none -border "$REF_OUT" \
         -channel A -morphology Dilate "Disk:${REF_OUT}" +channel \) \
      \( -background none -fill "$GREEN" -stroke none -font "$FONT" \
         -pointsize "$REF_PS" -gravity center "label:${TEXT}" \
         -bordercolor none -border "$REF_OUT" \) \
      -compose over -composite -colorspace sRGB -type TrueColorAlpha "$TXT"
  fi

  TARGET_W=$(awk -v f="$WFRAC" -v w="$W" 'BEGIN { printf "%.2f", f*w }')
  SCALE=$(awk -v t="$TARGET_W" -v g="$GREEN_W" 'BEGIN { printf "%.4f", (t/g)*100 }')
  "$MAGICK" "$TXT" -resize "${SCALE}%" "$TXT"

  GRAV="center"
  OFFSET=$(awk -v x="$XFRAC" -v y="$YFRAC" -v w="$W" -v h="$H" \
    'BEGIN { printf "%+d%+d", x*w - w/2, y*h - h/2 }')
  rm -f "$GREEN_REF"
else
  # --- Auto-fit path (CLI default) -----------------------------------------
  # caption: auto-sizes the point size so the wrapped text fills the box; both
  # layers use identical font/size/text so they register exactly.
  if [[ "$GRUNGE" == "1" ]]; then
    CAP=$(mktemp -t covercap).png
    "$MAGICK" -size "${TEXT_W}x${BAND_H}" -background none -fill "$GREEN" \
      -stroke none -font "$FONT" -gravity center "caption:${TEXT}" \
      -trim +repage "$CAP"
    bash "$SCRIPT_DIR/grunge-text.sh" "$CAP" "$TXT" "$GREEN" "$THICKEN"
    rm -f "$CAP"
  else
    "$MAGICK" -size "${TEXT_W}x${BAND_H}" \
      \( -background none -fill "$STROKE" -stroke none -font "$FONT" -gravity center \
         "caption:${TEXT}" -bordercolor none -border "$OUTLINE" \
         -channel A -morphology Dilate "Disk:${OUTLINE}" +channel \) \
      \( -background none -fill "$GREEN" -stroke none -font "$FONT" -gravity center \
         "caption:${TEXT}" -bordercolor none -border "$OUTLINE" \) \
      -compose over -composite -colorspace sRGB -type TrueColorAlpha "$TXT"
  fi

  case "$POS" in
    top)    GRAV="north"; OFFSET="+0+120" ;;
    center) GRAV="center"; OFFSET="+0+0" ;;
    *)      GRAV="south"; OFFSET="+0+160" ;;
  esac
fi

# Place the text band on the frame.
"$MAGICK" "$BG" "$TXT" -gravity "$GRAV" -geometry "$OFFSET" -composite \
  -quality 92 "$OUT"

rm -f "$BG" "$TXT"
echo "Cover written: $OUT"
