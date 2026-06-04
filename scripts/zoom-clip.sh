#!/usr/bin/env bash
# Ken Burns zoom for a SINGLE clip, with an explicit direction. This is the
# per-clip building block behind the studio's Compose mode (ken-burns.sh keeps
# the batch/alternating CLI workflow). Same color guarantees: each clip's own
# color tags + bit depth are detected and passed through verbatim, so HLG/BT.2020
# 10-bit stays HDR and bt709 8-bit stays SDR — no tonemap, no gamut change.
#
# Usage: ./scripts/zoom-clip.sh <video> <out.mp4> [in|out]
# Output: 1080x1920 @30fps (Reels/TikTok portrait).
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
[[ -x "$FFMPEG" ]] || FFMPEG="ffmpeg"
[[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

VIDEO="${1:?video required}"
OUT="${2:?out required}"
DIR="${3:-in}"   # in | out

ZOOM=0.20
FPS=30

probe_tag() {
  local v
  v=$("$FFPROBE" -v error -select_streams v:0 \
       -show_entries stream="$1" -of default=nw=1:nk=1 "$2" 2>/dev/null)
  [[ -z "$v" || "$v" == "unknown" || "$v" == "N/A" ]] && v="$3"
  printf '%s' "$v"
}

D=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=duration \
     -of default=nw=1:nk=1 "$VIDEO")
[[ -z "$D" || "$D" == "N/A" ]] && D=$("$FFPROBE" -v error \
     -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")

TOTAL_FRAMES=$(awk "BEGIN{f=$D*$FPS; printf \"%d\", (f<1?1:f)}")
if [[ "$DIR" == "out" ]]; then
  zexpr="1.0+${ZOOM}*(1-on/${TOTAL_FRAMES})"
else
  zexpr="1.0+${ZOOM}*on/${TOTAL_FRAMES}"
fi

CS=$(probe_tag color_space     "$VIDEO" bt709)
CP=$(probe_tag color_primaries "$VIDEO" bt709)
CT=$(probe_tag color_transfer  "$VIDEO" bt709)
CR=$(probe_tag color_range     "$VIDEO" tv)
PIXFMT=$(probe_tag pix_fmt     "$VIDEO" yuv420p)
case "$PIXFMT" in
  *10le|*10be|p010*|*10) OUTFMT=yuv420p10le ;;
  *)                     OUTFMT=yuv420p ;;
esac
if [[ "$CR" == pc || "$CR" == full ]]; then
  X265RANGE=full; FFRANGE=pc
else
  X265RANGE=limited; FFRANGE=tv
fi

echo "Zoom-${DIR} -> $OUT  (${D}s, ${CT}/${CP} ${FFRANGE} ${OUTFMT})"

VF="fps=${FPS},\
scale=2160:3840,\
zoompan=z='${zexpr}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},\
format=${OUTFMT},\
setparams=range=${FFRANGE}:colorspace=${CS}:color_primaries=${CP}:color_trc=${CT}"

"$FFMPEG" -y -hide_banner -loglevel error -i "$VIDEO" \
  -vf "$VF" \
  -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
  -x265-params "colorprim=${CP}:transfer=${CT}:colormatrix=${CS}:range=${X265RANGE}" \
  -color_primaries "${CP}" -colorspace "${CS}" -color_trc "${CT}" -color_range "${FFRANGE}" \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"

echo "Done: $OUT"
