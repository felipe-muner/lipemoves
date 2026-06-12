#!/usr/bin/env bash
# Timelapse: speed up a whole video by a factor (default 16x) — for condensing
# a full training session into a Reels-length clip. Audio is dropped (add music
# in the editor).
#
# Usage:
#   ./scripts/timelapse.sh <video> [out.mp4] [speed]
#
# Defaults: speed=16  out=<video>-timelapse.mp4 next to the source.
#
# Notes:
#   - Keeps the source resolution/orientation untouched.
#   - HDR (HLG/PQ, BT.2020) is detected and preserved end-to-end.
#   - Encodes with hevc_videotoolbox (hardware).
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
OUT="${2:-${VIDEO%.*}-timelapse.mp4}"
SPEED="${3:-16}"

DUR="$($FFPROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"
FPS="$($FFPROBE -v error -select_streams v:0 -show_entries stream=r_frame_rate \
       -of default=nw=1:nk=1 "$VIDEO")"
TRC="$($FFPROBE -v error -select_streams v:0 -show_entries stream=color_transfer \
       -of default=nw=1:nk=1 "$VIDEO" 2>/dev/null || true)"
OUT_DUR=$(awk -v d="$DUR" -v s="$SPEED" 'BEGIN { printf "%.1f", d/s }')

echo "Timelapse -> $OUT"
echo "  speed: ${SPEED}x  in: ${DUR}s  out: ~${OUT_DUR}s  hdr: ${TRC:-none}"

FC="[0:v]setpts=PTS/${SPEED},fps=${FPS}[v]"

if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  "$FFMPEG" -y -hide_banner -loglevel error -stats \
    -i "$VIDEO" \
    -filter_complex "${FC};[v]format=p010le[vo]" -map "[vo]" -an \
    -c:v hevc_videotoolbox -profile:v main10 -b:v 16M -tag:v hvc1 \
    -color_primaries bt2020 -colorspace bt2020nc -color_trc "$TRC" -color_range tv \
    -movflags +faststart "$OUT"
else
  "$FFMPEG" -y -hide_banner -loglevel error -stats \
    -i "$VIDEO" \
    -filter_complex "${FC};[v]format=nv12[vo]" -map "[vo]" -an \
    -c:v hevc_videotoolbox -b:v 12M -tag:v hvc1 \
    -movflags +faststart "$OUT"
fi

echo "Done: $OUT"
