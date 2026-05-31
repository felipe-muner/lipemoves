#!/usr/bin/env bash
# Ken Burns zoom (in/out alternating) for a batch of clips.
# - Output: 1080x1920 @30fps (Reels/TikTok portrait)
# - Video plays at original speed; zoom progresses slowly across the clip
# - HLG/BT.2020 HDR -> BT.709 SDR tonemap (preserves source colors)
# Usage: ./scripts/ken-burns.sh <input_dir> [output_dir]
set -euo pipefail

# ffmpeg-full has zscale + tonemap (needed for proper HDR -> SDR)
FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]] || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

IN_DIR="${1:?input dir required}"
OUT_DIR="${2:-$IN_DIR/edited}"
mkdir -p "$OUT_DIR"

ZOOM=0.20      # total zoom range, spread across the whole clip
FPS=30

i=0
shopt -s nullglob nocaseglob
for f in "$IN_DIR"/*.{mov,mp4,m4v}; do
  name=$(basename "$f")
  base="${name%.*}"
  out="$OUT_DIR/${base}-kb.mp4"

  D=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=duration \
       -of default=nw=1:nk=1 "$f")
  [[ -z "$D" || "$D" == "N/A" ]] && D=$("$FFPROBE" -v error \
       -show_entries format=duration -of default=nw=1:nk=1 "$f")

  # Zoom progresses smoothly across the ENTIRE clip: it reaches the full ZOOM
  # range exactly at the last frame, so the effect never stops early. Longer
  # clips zoom slower, shorter clips faster — but all run end to end.
  TOTAL_FRAMES=$(awk "BEGIN{f=$D*$FPS; printf \"%d\", (f<1?1:f)}")
  if (( i % 2 == 0 )); then
    zexpr="1.0+${ZOOM}*on/${TOTAL_FRAMES}"
    label="in"
  else
    zexpr="1.0+${ZOOM}*(1-on/${TOTAL_FRAMES})"
    label="out"
  fi

  echo "[$((i+1))] $name  ->  ${base}-kb.mp4  (zoom-${label}, ${D}s)"

  # Pipeline:
  #  1) HDR HLG/BT.2020 10-bit -> linear -> hable tonemap -> BT.709 SDR 8-bit
  #  2) upscale 2x to give zoompan crop room
  #  3) zoompan with per-frame (d=1) zoom expression, output 1080x1920
  VF="fps=${FPS},\
zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,\
tonemap=tonemap=hable:desat=0,\
zscale=t=bt709:m=bt709:r=tv,format=yuv420p,\
scale=2160:3840,\
zoompan=z='${zexpr}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},\
format=yuv420p"

  "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
    -vf "$VF" \
    -c:v libx264 -preset medium -crf 18 \
    -color_primaries bt709 -colorspace bt709 -color_trc bt709 -color_range tv \
    -c:a aac -b:a 128k -movflags +faststart "$out"

  i=$((i+1))
done

echo "Done. $i files written to: $OUT_DIR"
