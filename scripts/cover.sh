#!/usr/bin/env bash
# Cover/thumbnail maker: take an image (a video frame) + a phrase, and burn
# full-width lime-green text with a thick black stroke — viral-fitness style.
#
# Usage:
#   ./scripts/cover.sh <image> "YOUR PHRASE" [out.jpg] [top|bottom|center]
#
# Notes:
#   - Use \n in the phrase to force line breaks, e.g. "TRAIN LIKE\nOUR ANCESTORS"
#   - Output is forced to 1080x1920 portrait (Reels/TikTok). Source is
#     center-cropped to fill if its aspect differs.
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
GREEN="#7CFC00"              # lime fill
STROKE="#000000"            # black outline color
OUTLINE=13                   # outline radius in px (outside the letters)
MARGIN=48                    # side padding so text isn't edge-to-edge raw
TEXT_W=$(( W - MARGIN*2 ))   # text box width
BAND_H=560                   # height of the area the text is fit into
# -----------------------------------------------------------------------------

# 1) Normalize the frame: fill 1080x1920, center-crop overflow.
BG=$(mktemp -t coverbg).png
"$MAGICK" "$IMG" -auto-orient \
  -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
  "$BG"

# 2) Render the text layer with a TRUE outside outline, all in ONE command so
#    the colorspace never collapses to grayscale (a black silhouette saved as
#    a standalone PNG turns gray and kills the green on composite):
#    - black silhouette of the text, DILATED with a disk kernel so the border
#      sits OUTSIDE the letters with rounded corners (the ref look)
#    - green fill layer (full-weight letters) composited on top
#    caption: auto-sizes the point size so the wrapped text fills the box;
#    both layers use identical font/size/text so they register exactly.
TXT=$(mktemp -t covertxt).png
"$MAGICK" -size "${TEXT_W}x${BAND_H}" \
  \( -background none -fill "$STROKE" -stroke none -font "$FONT" -gravity center \
     "caption:${TEXT}" -bordercolor none -border "$OUTLINE" \
     -channel A -morphology Dilate "Disk:${OUTLINE}" +channel \) \
  \( -background none -fill "$GREEN" -stroke none -font "$FONT" -gravity center \
     "caption:${TEXT}" -bordercolor none -border "$OUTLINE" \) \
  -compose over -composite -colorspace sRGB -type TrueColorAlpha "$TXT"

# 3) Place the text band on the frame.
case "$POS" in
  top)    GRAV="north"; OFFSET="+0+120" ;;
  center) GRAV="center"; OFFSET="+0+0" ;;
  *)      GRAV="south"; OFFSET="+0+160" ;;
esac

"$MAGICK" "$BG" "$TXT" -gravity "$GRAV" -geometry "$OFFSET" -composite \
  -quality 92 "$OUT"

rm -f "$BG" "$TXT"
echo "Cover written: $OUT"
