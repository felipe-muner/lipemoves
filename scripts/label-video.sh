#!/usr/bin/env bash
# Drill-label burner: overlay a single positioned text line (e.g. "1 — HIP
# CIRCLES") onto a WHOLE video — for stitching a series of mobility/strength
# drills. Unlike add-caption.sh (bottom-left, white, drop-shadow, fog-fade) the
# text here is freely placed (drag from the studio), any color, any opacity, and
# fades in at the start and out at the end of the clip.
#
# Usage:
#   ./scripts/label-video.sh <video> "TEXT" <out.mp4> <#hexColor> <opacity> \
#                            <xFrac> <yFrac> <widthFrac> [fontKey] \
#                            [--no-anim] [--grunge] [--thick=N]
#   fontKey: outfit (default) | archivo | impact | georgia | script | mono
#   --grunge: distressed "stamp" look — keyline + rough edges + scratches + shadow.
#   --thick=N: extra glyph dilation for a chunkier font (only with --grunge).
#
# Notes:
#   - Use \n in the text to force line breaks.
#   - Output is forced to 1080x1920 portrait; source is center-cropped to fill
#     so a batch of mixed sources joins cleanly afterwards.
#   - xFrac/yFrac (0..1) place the text block's CENTER; widthFrac (0..~2) is the
#     widest line's width as a fraction of the frame (the studio measures the
#     live preview so the burn matches it exactly).
#   - opacity is 0..1 (0.5 = the default ghosted white).
#   - HDR (HLG/PQ, BT.2020) is detected and preserved end-to-end.
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"
MAGICK="$(command -v magick || true)"
[[ -n "$MAGICK" ]] || { echo "ImageMagick (magick) not found. brew install imagemagick" >&2; exit 1; }

VIDEO="${1:?video required}"
TEXT="${2:?text required}"
OUT="${3:-${VIDEO%.*}-label.mp4}"
COLOR="${4:-#FFFFFF}"
OPACITY="${5:-0.5}"
XFRAC="${6:-0.5}"
YFRAC="${7:-0.5}"
WFRAC="${8:-0.6}"
FONTKEY="${9:-outfit}"
case "$FONTKEY" in --no-anim|--grunge|--thick=*) FONTKEY="outfit" ;; esac  # fontKey is optional
ANIM=1
GRUNGE=0
THICKEN=0
for a in "$@"; do
  case "$a" in
    --no-anim) ANIM=0 ;;
    --grunge)  GRUNGE=1 ;;
    --thick=*) THICKEN="${a#--thick=}" ;;
  esac
done

# Repo root (this script lives in <repo>/scripts) for bundled fonts.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
SUP="/System/Library/Fonts/Supplemental"
case "$FONTKEY" in
  outfit)  FONT="$REPO/assets/fonts/Outfit-600.ttf" ;;
  archivo) FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf" ;;
  impact)  FONT="$SUP/Impact.ttf" ;;
  georgia) FONT="$SUP/Georgia Bold.ttf" ;;
  script)  FONT="$SUP/Brush Script.ttf" ;;
  mono)    FONT="$SUP/Courier New.ttf" ;;
  *)       FONT="$REPO/assets/fonts/Outfit-600.ttf" ;;
esac
[[ -f "$FONT" ]] || FONT="$SUP/Impact.ttf"

# ---- Look knobs -------------------------------------------------------------
W=1080; H=1920               # output canvas (portrait)
REF_PS=220                   # reference point size; the layer is scaled to WFRAC
FADE=0.5                     # fade in/out duration (s)
# -----------------------------------------------------------------------------

# 1) Render the text once at a big reference size (label: honors \n, never
#    wraps), measure its width, then scale the whole layer so the widest line
#    spans exactly WFRAC*W — matching the studio's live preview.
TXT=$(mktemp -t labeltxt).png
REF=$(mktemp -t labelref).png
trap 'rm -f "$TXT" "$REF"' EXIT

"$MAGICK" -background none -fill "$COLOR" -stroke none -font "$FONT" \
  -pointsize "$REF_PS" -gravity center "label:${TEXT}" "$REF"
REF_W=$("$MAGICK" identify -format "%w" "$REF")

# Colored text + a soft drop shadow for legibility on busy footage (or the
# distressed "grunge" treatment), then scale to the target width and fade the
# whole layer's alpha to the chosen opacity.
if (( GRUNGE )); then
  bash "$SCRIPT_DIR/grunge-text.sh" "$REF" "$TXT" "$COLOR" "$THICKEN"
  "$MAGICK" "$TXT" -channel A -evaluate multiply "$OPACITY" +channel "$TXT"
else
  "$MAGICK" "$REF" \
    \( +clone -background black -shadow "80x6+0+4" \) +swap \
    -background none -layers merge +repage \
    -channel A -evaluate multiply "$OPACITY" +channel \
    "$TXT"
fi

TARGET_W=$(awk -v f="$WFRAC" -v w="$W" 'BEGIN { printf "%.2f", f*w }')
SCALE=$(awk -v t="$TARGET_W" -v g="$REF_W" 'BEGIN { printf "%.4f", (t/g)*100 }')
OFFSET=$(awk -v x="$XFRAC" -v y="$YFRAC" -v w="$W" -v h="$H" \
  'BEGIN { printf "%+d%+d", x*w - w/2, y*h - h/2 }')

# Compose the scaled, faded text onto a full transparent 1080x1920 canvas so
# ffmpeg can simply overlay it at 0:0.
"$MAGICK" -size "${W}x${H}" xc:none \
  \( "$TXT" -resize "${SCALE}%" \) -gravity center -geometry "$OFFSET" \
  -composite "$TXT"

# 2) Probe duration + HDR.
DUR="$($FFPROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"
TRC="$($FFPROBE -v error -select_streams v:0 -show_entries stream=color_transfer \
       -of default=nw=1:nk=1 "$VIDEO" 2>/dev/null || true)"
OUT_ST=$(awk -v d="$DUR" -v f="$FADE" 'BEGIN { s=d-f; printf "%.3f", (s<0?0:s) }')

echo "Label -> $OUT"
echo "  text: $TEXT"
echo "  color: $COLOR  opacity: $OPACITY  pos: ${XFRAC},${YFRAC}  width: $WFRAC"
echo "  anim: $([[ $ANIM == 1 ]] && echo fade || echo none)   hdr: ${TRC:-unknown}"

# Normalize the source to 1080x1920 (fill + center-crop) so a batch joins.
norm="[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[bg];"
if (( ANIM )); then
  txt="[1:v]format=rgba,fade=t=in:st=0:d=${FADE}:alpha=1,fade=t=out:st=${OUT_ST}:d=${FADE}:alpha=1[txt];"
else
  txt="[1:v]format=rgba[txt];"
fi
fc="${norm}${txt}[bg][txt]overlay=0:0[v]"

if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  FC="${fc};[v]format=yuv420p10le,setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67[vo]"
  "$FFMPEG" -y -hide_banner -loglevel error \
    -i "$VIDEO" -loop 1 -i "$TXT" \
    -filter_complex "$FC" -map "[vo]" -map 0:a:0? -t "$DUR" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited" \
    -color_primaries bt2020 -colorspace bt2020nc -color_trc arib-std-b67 -color_range tv \
    -c:a aac -b:a 128k -movflags +faststart "$OUT"
else
  FC="${fc};[v]format=yuv420p[vo]"
  "$FFMPEG" -y -hide_banner -loglevel error \
    -i "$VIDEO" -loop 1 -i "$TXT" \
    -filter_complex "$FC" -map "[vo]" -map 0:a:0? -t "$DUR" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -c:a aac -b:a 128k -movflags +faststart "$OUT"
fi

echo "Done: $OUT"
