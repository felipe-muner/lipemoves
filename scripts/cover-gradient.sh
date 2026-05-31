#!/usr/bin/env bash
# Cover/thumbnail maker (gradient variant): take an image (a video frame) + a
# phrase, and burn full-width text filled with ONE soft green gradient that
# flows diagonally across the entire block (top-left first letter -> bottom-
# right last letter), plus a thick black outline. Viral-fitness style.
#
# Usage:
#   ./scripts/cover-gradient.sh <image> "YOUR PHRASE" [out.jpg] [top|bottom|center]
#
# Notes:
#   - Use \n in the phrase to force line breaks, e.g. "TRAIN LIKE\nOUR ANCESTORS"
#   - The gradient spans the whole text box, so it is a single sweep across all
#     lines together — not one gradient per line.
#   - Output is forced to 1080x1920 portrait (Reels/TikTok). Source is
#     center-cropped to fill if its aspect differs.
#
# IMPORTANT (ImageMagick gotcha): never run -border or -extent on the colored
# gradient layer — both silently convert it to grayscale and kill the green.
# Instead the gradient + outline layers are rendered at their final padded size
# and composited directly onto the COLOR photo, which anchors the whole
# pipeline to sRGB so the green survives.
set -euo pipefail

MAGICK="$(command -v magick || true)"
[[ -n "$MAGICK" ]] || { echo "ImageMagick (magick) not found. brew install imagemagick" >&2; exit 1; }

IMG="${1:?image required}"
TEXT="${2:?text required}"
OUT="${3:-${IMG%.*}-cover.jpg}"
POS="${4:-bottom}"          # top | bottom | center

# ---- Look knobs -------------------------------------------------------------
W=1080; H=1920               # output canvas (portrait)
FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"  # wide+bold; matches ref
[[ -f "$FONT" ]] || FONT="Impact"
G_TL="#9BFF1A"               # gradient start (top-left)  — fluorescent lime
G_BR="#4FE000"               # gradient end   (bottom-right) — a bit deeper neon
G_ANGLE=135                  # 135 = top-left -> bottom-right diagonal
STROKE="#000000"            # black outline color
OUTLINE=13                   # outline radius in px (outside the letters)
MARGIN=48                    # side padding so text isn't edge-to-edge raw
TEXT_W=$(( W - MARGIN*2 ))   # text box width
BAND_H=560                   # height of the area the text is fit into
PW=$(( TEXT_W + OUTLINE*2 )) # padded layer width (room for the dilated outline)
PH=$(( BAND_H + OUTLINE*2 )) # padded layer height
# -----------------------------------------------------------------------------

GT=$(mktemp -t covergt).png   # green gradient text (sRGB — no border/extent!)
OL=$(mktemp -t coverol).png   # black dilated outline (grayscale is fine here)

# 1) Gradient text: a single diagonal gradient masked by the letter shapes, so
#    one continuous sweep flows across ALL lines together. caption: auto-sizes
#    the point size so the wrapped text fills the box.
"$MAGICK" \
  \( -size "${PW}x${PH}" -define gradient:angle="$G_ANGLE" "gradient:${G_TL}-${G_BR}" \) \
  \( -size "${PW}x${PH}" -background none -fill white -stroke none \
     -font "$FONT" -gravity center "caption:${TEXT}" \) \
  -compose CopyOpacity -composite "$GT"

# 2) Outline: same text, dilated with a disk kernel so the border sits OUTSIDE
#    the letters with rounded corners (the ref look). After dilating the alpha,
#    recolor the WHOLE layer to STROKE — the dilated ring otherwise inherits the
#    transparent-black background's RGB and renders black no matter what STROKE
#    is. -colorize 100 forces every pixel to STROKE while keeping the alpha.
"$MAGICK" -size "${PW}x${PH}" -background none -fill "$STROKE" -stroke none \
  -font "$FONT" -gravity center "caption:${TEXT}" \
  -channel A -morphology Dilate "Disk:${OUTLINE}" +channel \
  -fill "$STROKE" -colorize 100 "$OL"

# 3) Normalize the frame, then composite outline UNDER the gradient text onto
#    it. The photo is sRGB and stays the base, so the green never collapses.
case "$POS" in
  top)    GRAV="north"; OFFSET="+0+120" ;;
  center) GRAV="center"; OFFSET="+0+0" ;;
  *)      GRAV="south"; OFFSET="+0+160" ;;
esac

"$MAGICK" "$IMG" -auto-orient \
  -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
  "$OL" -gravity "$GRAV" -geometry "$OFFSET" -compose over -composite \
  "$GT" -gravity "$GRAV" -geometry "$OFFSET" -compose over -composite \
  -quality 92 "$OUT"

rm -f "$GT" "$OL"
echo "Cover written: $OUT"
