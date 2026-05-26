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

ZOOM=0.16   # total zoom range over the clip (gentle, slow ken-burns)
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

  N=$(awk -v d="$D" -v f="$FPS" 'BEGIN{printf "%d", d*f}')
  (( N < 2 )) && N=2

  if (( i % 2 == 0 )); then
    zexpr="1.0+${ZOOM}*on/${N}"
    label="in"
  else
    zexpr="1.0+${ZOOM}-${ZOOM}*on/${N}"
    label="out"
  fi

  echo "[$((i+1))] $name  ->  ${base}-kb.mp4  (zoom-${label}, ${D}s, frames=${N})"

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
