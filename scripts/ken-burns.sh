#!/usr/bin/env bash
# Ken Burns zoom (in/out alternating) for a batch of clips.
# - Output: 1080x1920 @30fps (Reels/TikTok portrait)
# - Video plays at original speed; zoom progresses slowly across the clip
# - Colors are NEVER changed: keeps source HDR (HLG/BT.2020, 10-bit), no tonemap
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

  # Pipeline — NO color change. The zoom is the only thing applied. We keep the
  # source HDR untouched (HLG/BT.2020, 10-bit): no tonemap, no gamut/transfer
  # conversion. setparams re-stamps the HDR tags zoompan strips, and libx265
  # writes the matching HLG VUI so players render it exactly like the source.
  #  1) upscale 2x to give zoompan crop room  2) zoompan zoom -> 1080x1920
  VF="fps=${FPS},\
scale=2160:3840,\
zoompan=z='${zexpr}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},\
format=yuv420p10le,\
setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67"

  "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
    -vf "$VF" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited" \
    -color_primaries bt2020 -colorspace bt2020nc -color_trc arib-std-b67 -color_range tv \
    -c:a aac -b:a 128k -movflags +faststart "$out"

  i=$((i+1))
done

echo "Done. $i files written to: $OUT_DIR"
