#!/usr/bin/env bash
# Frame picker: sample one frame every STEP seconds from a video, save them
# full-res and NUMBERED, and build a numbered contact sheet so you can eyeball
# them and pick the best one by its number.
#
# Usage:
#   ./scripts/frame-picker.sh <video> [step_seconds] [out_dir]
#     step_seconds  default 0.5  (i.e. 2 frames per second)
#
# After it runs:
#   - open the contact sheet, find the number you like
#   - the full-res frame is  <out_dir>/frames/<NNN>.png
#     (e.g. number 14 -> frames/014.png) — ready to drop into a cover script.
set -euo pipefail

FF="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"; [[ -x "$FF" ]] || FF="ffmpeg"
FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"; [[ -f "$FONT" ]] || FONT="Impact"
GREEN="#7CFC00"   # brand lime for the badge number

VIDEO="${1:?video required}"
STEP="${2:-0.5}"
base="$(basename "${VIDEO%.*}")"
OUT_DIR="${3:-$(dirname "$VIDEO")/frames-$base}"
FRAMES="$OUT_DIR/frames"
mkdir -p "$FRAMES"
rm -f "$FRAMES"/*.png 2>/dev/null || true

# frames-per-second = 1 / step  (0.5s -> 2fps, 0.25s -> 4fps)
FPS=$(awk "BEGIN{printf \"%.6f\", 1/$STEP}")

# 1) full-res numbered frames (001.png, 002.png, ...) — these are what you keep
"$FF" -y -hide_banner -loglevel error -i "$VIDEO" -vf "fps=${FPS}" "$FRAMES/%03d.png"

# 2) numbered contact sheet: burn a black circular badge with the green frame
#    number into the top-left of each tile. The number maps straight to
#    frames/<NNN>.png (e.g. badge 14 -> frames/014.png).
CONTACT="$OUT_DIR/${base}-contact.png"
THUMBS="$(mktemp -d)"
for f in "$FRAMES"/*.png; do
  num="$(basename "${f%.*}")"      # 001
  n=$(( 10#$num ))                 # 1 (strip leading zeros for display)
  magick "$f" -resize 260x462 \
    \( -size 40x40 xc:none -fill black -draw "circle 20,20 20,4" \
       -gravity center -font "$FONT" -pointsize 17 -fill "$GREEN" -annotate +0+0 "$n" \) \
    -gravity northwest -geometry +3+3 -compose over -composite \
    "$THUMBS/$num.png"
done
# -shave 2x2 strips the outer 2px margin so there's no black frame around the
# whole sheet — only the thin gaps between tiles remain.
magick montage "$THUMBS"/*.png -tile 5x -geometry +2+2 -background black miff:- \
  | magick - -shave 2x2 "$CONTACT"
rm -rf "$THUMBS"

n=$(ls "$FRAMES"/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted $n frames (every ${STEP}s) -> $FRAMES"
echo "Contact sheet: $CONTACT"
echo "Pick a number N; full-res frame = $FRAMES/<NNN>.png"
