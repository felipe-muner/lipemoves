#!/usr/bin/env bash
# Bottom-left caption burner — run it AFTER ken-burns, on a single -kb.mp4 clip.
# Style: a bold WHITE main line (the move name) with a smaller WHITE subtitle
# below it (e.g. "3 ROUNDS | 30 SEC"), anchored bottom-left with a soft drop
# shadow. Entrance is a FOG FADE-IN: the text materialises blurry/soft and
# resolves into sharp focus (a blurred copy fades out as the sharp copy fades
# in).
#
# Usage:
#   ./scripts/add-caption.sh <video> "MAIN LINE" ["SUBTITLE LINE"] [out.mp4] [--no-anim]
#
# Examples:
#   ./scripts/add-caption.sh abs1-kb.mp4 "BENT OVER REVERSE FLY" "3 ROUNDS | 30 SEC"
#   ./scripts/add-caption.sh abs1-kb.mp4 "FULL BODY FLOW"                 # no subtitle
#   ./scripts/add-caption.sh abs1-kb.mp4 "CLEAN" "30 SEC" out.mp4 --no-anim
#
# Out defaults to <video-without-ext>-cap.mp4 next to the input.
# HDR (HLG/BT.2020) is detected and preserved end-to-end, like ken-burns.
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"
command -v magick >/dev/null || { echo "ImageMagick (magick) not found. brew install imagemagick" >&2; exit 1; }

VIDEO="${1:?video required}"
MAIN="${2:?main line required}"
SUB="${3:-}"
OUT="${4:-${VIDEO%.*}-cap.mp4}"
ANIM=1
for a in "$@"; do [[ "$a" == "--no-anim" ]] && ANIM=0; done

FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"; [[ -f "$FONT" ]] || FONT="/System/Library/Fonts/Supplemental/Impact.ttf"

# ---- Look knobs -------------------------------------------------------------
# Kept inside Instagram's Reels safe area: the bottom ~420px (caption, audio
# tag, progress bar) and the right column (action buttons) get covered by IG's
# UI, so the text sits well above that band and pulled in from the edge.
W=1080; H=1920
MAIN_SIZE=58        # main line point size
SUB_SIZE=34         # subtitle point size
LEFT=90             # left margin
SUB_BOTTOM=470      # subtitle distance up from the bottom edge (clears IG UI)
GAP=20              # vertical gap between subtitle and main line
BLUR=22             # fog blur strength (sigma)
AD=0.9              # fog fade-in total duration (s)
# -----------------------------------------------------------------------------

MAIN_BOTTOM=$(( SUB_BOTTOM + SUB_SIZE + GAP ))

# 1) Render the white text on a full transparent canvas, then drop a soft
#    shadow under it for legibility on busy backgrounds.
TXT=$(mktemp -t cap_txt).png
SHARP=$(mktemp -t cap_sharp).png
BLURP=$(mktemp -t cap_blur).png
trap 'rm -f "$TXT" "$SHARP" "$BLURP"' EXIT

args=( -size "${W}x${H}" xc:none -font "$FONT" -fill white -gravity southwest
       -pointsize "$MAIN_SIZE" -annotate "+${LEFT}+${MAIN_BOTTOM}" "$MAIN" )
[[ -n "$SUB" ]] && args+=( -pointsize "$SUB_SIZE" -annotate "+${LEFT}+${SUB_BOTTOM}" "$SUB" )
magick "${args[@]}" "$TXT"

# soft drop shadow merged under the white text
magick "$TXT" \( +clone -background black -shadow 70x4+3+4 \) +swap \
  -background none -layers merge +repage "$SHARP"
# blurred ("fog") copy of the finished caption
magick "$SHARP" -gaussian-blur "0x${BLUR}" "$BLURP"

# 2) Animation windows for the fog fade (blurred fades out as sharp fades in).
f() { awk "BEGIN{printf \"%.3f\", $1}"; }
B_IN=$(f "$AD*0.28"); B_OST=$(f "$AD*0.45"); B_OUT=$(f "$AD*0.55")
S_ST=$(f "$AD*0.40");  S_IN=$(f "$AD*0.60")

if (( ANIM )); then
  fc="[1:v]format=rgba,fade=t=in:st=0:d=${B_IN}:alpha=1,fade=t=out:st=${B_OST}:d=${B_OUT}:alpha=1[blur];\
[2:v]format=rgba,fade=t=in:st=${S_ST}:d=${S_IN}:alpha=1[sharp];\
[0:v][blur]overlay=0:0[b1];[b1][sharp]overlay=0:0[v]"
else
  # no animation: just the sharp caption, full opacity
  fc="[0:v][2:v]overlay=0:0[v]"
fi

# Detect HDR (HLG/PQ) so we can preserve it; otherwise stay SDR.
TRC="$($FFPROBE -v error -select_streams v:0 -show_entries stream=color_transfer \
       -of default=nw=1:nk=1 "$VIDEO" 2>/dev/null || true)"

echo "Caption -> $OUT"
echo "  main: $MAIN"
[[ -n "$SUB" ]] && echo "  sub : $SUB"
echo "  anim: $([[ $ANIM == 1 ]] && echo fog-fade || echo none)   hdr: ${TRC:-unknown}"

DUR="$($FFPROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"

if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  FC="${fc};[v]format=yuv420p10le,setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67[vo]"
  "$FFMPEG" -y -hide_banner -loglevel error \
    -i "$VIDEO" -loop 1 -i "$BLURP" -loop 1 -i "$SHARP" \
    -filter_complex "$FC" -map "[vo]" -map 0:a? -t "$DUR" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited" \
    -color_primaries bt2020 -colorspace bt2020nc -color_trc arib-std-b67 -color_range tv \
    -c:a aac -b:a 128k -movflags +faststart "$OUT"
else
  FC="${fc};[v]format=yuv420p[vo]"
  "$FFMPEG" -y -hide_banner -loglevel error \
    -i "$VIDEO" -loop 1 -i "$BLURP" -loop 1 -i "$SHARP" \
    -filter_complex "$FC" -map "[vo]" -map 0:a? -t "$DUR" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -c:a aac -b:a 128k -movflags +faststart "$OUT"
fi

echo "Done: $OUT"
