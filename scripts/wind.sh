#!/usr/bin/env bash
# Wind whoosh: layer a short, faint gust of air over the START of a clip — the
# "feeling of your head moving the air" as you lift it toward the camera. The
# whoosh swells in and fades out fast, so it's gone before you start talking.
#
# Usage:
#   ./scripts/wind.sh <video> [out.mp4] [volume] [duration] [start]
#
# Defaults: volume=0.18 duration=0.35 start=0
#   out defaults to <video>-wind.mp4 next to the source.
#
#   volume   loudness of the gust, 0..1+ (0.10 = whisper, 0.30 = noticeable)
#   duration length of the whoosh in seconds (the air movement window)
#   start    when the gust begins, in seconds (match your head-lift moment)
#
# Notes:
#   - Video is stream-copied (no re-encode) so resolution/HDR is untouched and
#     it's instant; only the audio is re-mixed (AAC).
#   - Wind is synthesized (shaped pink noise), no asset file needed.
#   - Tune the air "color" with HP/LP env vars, e.g. HP=260 LP=850 ./scripts/wind.sh ...
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
[[ -x "$FFMPEG" ]] || FFMPEG="ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
OUT="${2:-${VIDEO%.*}-wind.mp4}"
VOL="${3:-0.18}"
DUR="${4:-0.35}"
ST="${5:-0}"

# ---- Air color knobs (override via env) -------------------------------------
HP="${HP:-240}"   # high-pass: cut rumble below this Hz
LP="${LP:-900}"   # low-pass: cut hiss above this Hz (lower = softer/airier)
# -----------------------------------------------------------------------------

# Full clip length so the noise source spans the whole timeline.
VLEN="$($FFPROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"

# Swell envelope derived from the requested duration: quick fade in, fast out.
read IN_D OUT_ST OUT_D < <(awk -v d="$DUR" -v s="$ST" 'BEGIN {
  printf "%.3f %.3f %.3f\n", d*0.25, s + d*0.5, d*0.55 }')

$FFMPEG -y -i "$VIDEO" -filter_complex "\
anoisesrc=color=pink:d=${VLEN}:amplitude=0.7,asetnsamples=1024[n];\
[n]highpass=f=${HP},lowpass=f=${LP},volume=${VOL},\
afade=t=in:st=${ST}:d=${IN_D}:curve=tri,\
afade=t=out:st=${OUT_ST}:d=${OUT_D}:curve=tri[wind];\
[0:a][wind]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$OUT" -loglevel error

echo "✓ $OUT  (vol=$VOL dur=${DUR}s start=${ST}s)"
