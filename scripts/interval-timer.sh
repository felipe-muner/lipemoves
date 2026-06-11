#!/usr/bin/env bash
# Interval-timer burner: overlay a branded work/rest interval timer on the
# top-right corner of a WHOLE video — for daily training sessions (e.g. 30s ON
# / 30s REST for 30 minutes). Shows the brand name, the current phase (GO /
# REST) with a big per-phase countdown, plus elapsed time and round counter.
#
# Usage:
#   ./scripts/interval-timer.sh <video> [out.mp4] [workSecs] [restSecs] [brand]
#
# Defaults: workSecs=30 restSecs=30 brand=LIPEMOVES
#   out defaults to <video>-timer.mp4 next to the source.
#
# Notes:
#   - Keeps the source resolution/orientation untouched — pure overlay.
#   - HDR (HLG/PQ, BT.2020) is detected and preserved end-to-end.
#   - Encodes with hevc_videotoolbox (hardware) so a 30-min 60fps clip takes
#     minutes, not an hour; audio is stream-copied.
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]]  || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
OUT="${2:-${VIDEO%.*}-timer.mp4}"
WORK="${3:-30}"
REST="${4:-30}"
BRAND="${5:-LIPEMOVES}"
CYCLE=$(( WORK + REST ))

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
FONT="$REPO/assets/fonts/Outfit-600.ttf"
[[ -f "$FONT" ]] || FONT="/System/Library/Fonts/Supplemental/Impact.ttf"

# ---- Look knobs -------------------------------------------------------------
GO_COLOR="0x3DE08A"          # work phase (green)
REST_COLOR="0xFF9F6E"        # rest phase (soft orange)
SHADOW="shadowcolor=black@0.55:shadowx=0:shadowy=3"
PANEL_W=380                  # scrim panel behind the text block, bled into the
PANEL_H=372                  # top-right corner — keeps contrast on bright sky
PANEL="drawbox=x=iw-${PANEL_W}:y=0:w=${PANEL_W}:h=${PANEL_H}:color=black@0.42:t=fill"
# -----------------------------------------------------------------------------

DUR="$($FFPROBE -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"
TRC="$($FFPROBE -v error -select_streams v:0 -show_entries stream=color_transfer \
       -of default=nw=1:nk=1 "$VIDEO" 2>/dev/null || true)"
ROUNDS=$(awk -v d="$DUR" -v c="$CYCLE" 'BEGIN { printf "%d", (d+c-1)/c }')

echo "Interval timer -> $OUT"
echo "  work: ${WORK}s  rest: ${REST}s  rounds: $ROUNDS  brand: $BRAND"
echo "  duration: ${DUR}s  hdr: ${TRC:-none}"

# All lines centered on the panel's vertical axis (x = panel center - tw/2).
# The phase label + big countdown swap color via paired drawtexts gated by
# enable=.
RX="w-${PANEL_W}/2-tw/2"
# Colons inside %{...} must be \: — the filtergraph parser eats the quotes
# before the filter-args parser splits options on ':'.
IN_WORK="lt(mod(t\,${CYCLE})\,${WORK})"
CD_WORK="%{eif\\:${WORK}-mod(trunc(t)\\,${CYCLE})\\:d}"
CD_REST="%{eif\\:${CYCLE}-mod(trunc(t)\\,${CYCLE})\\:d}"
ELAPSED="%{eif\\:trunc(t/60)\\:d\\:2}\\:%{eif\\:mod(trunc(t)\\,60)\\:d\\:2}"
ROUND="ROUND %{eif\\:trunc(t/${CYCLE})+1\\:d}/${ROUNDS}"

FC="[0:v]\
${PANEL},\
drawtext=fontfile=${FONT}:text='${BRAND}':fontcolor=white:fontsize=38:x=${RX}:y=36:${SHADOW},\
drawtext=fontfile=${FONT}:text='GO':fontcolor=${GO_COLOR}:fontsize=54:x=${RX}:y=92:${SHADOW}:enable='${IN_WORK}',\
drawtext=fontfile=${FONT}:text='REST':fontcolor=${REST_COLOR}:fontsize=54:x=${RX}:y=92:${SHADOW}:enable='not(${IN_WORK})',\
drawtext=fontfile=${FONT}:text='${CD_WORK}':fontcolor=${GO_COLOR}:fontsize=120:x=${RX}:y=152:${SHADOW}:enable='${IN_WORK}',\
drawtext=fontfile=${FONT}:text='${CD_REST}':fontcolor=${REST_COLOR}:fontsize=120:x=${RX}:y=152:${SHADOW}:enable='not(${IN_WORK})',\
drawtext=fontfile=${FONT}:text='${ELAPSED}  ${ROUND}':fontcolor=white@0.75:fontsize=34:x=${RX}:y=294:${SHADOW}\
[v]"

if [[ "$TRC" == "arib-std-b67" || "$TRC" == "smpte2084" ]]; then
  "$FFMPEG" -y -hide_banner -loglevel error -stats \
    -i "$VIDEO" \
    -filter_complex "${FC};[v]format=p010le[vo]" -map "[vo]" -map 0:a:0? \
    -c:v hevc_videotoolbox -profile:v main10 -b:v 16M -tag:v hvc1 \
    -color_primaries bt2020 -colorspace bt2020nc -color_trc "$TRC" -color_range tv \
    -c:a copy -movflags +faststart "$OUT"
else
  "$FFMPEG" -y -hide_banner -loglevel error -stats \
    -i "$VIDEO" \
    -filter_complex "${FC};[v]format=nv12[vo]" -map "[vo]" -map 0:a:0? \
    -c:v hevc_videotoolbox -b:v 12M -tag:v hvc1 \
    -c:a copy -movflags +faststart "$OUT"
fi

echo "Done: $OUT"
