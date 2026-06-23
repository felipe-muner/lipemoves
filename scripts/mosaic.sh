#!/usr/bin/env bash
# Mosaic: tile 2-4 portrait clips into ONE 1080x1920 frame (the studio's Mosaic
# mode). All clips play AT ONCE, trimmed to the SHORTEST so no cell freezes or
# goes black.
#
# Layouts:
#   cols2   2 clips side by side        (each 540x1920 — keeps full bodies)
#   rows2   2 clips stacked top/bottom  (each 1080x960)
#   wedge3  3 clips as corner triangles meeting at the center (1=left, 2=right,
#           3=bottom) — uses ImageMagick alpha masks
#   quad    4 clips in a 2x2 grid       (each 540x960, stays 9:16)
#
# Color: if EVERY input is HLG/PQ HDR the output stays HDR 10-bit with no
# conversion at all. Otherwise the output is SDR Rec.709 and any HDR input is
# faithfully tone-mapped (colorimetric HLG/PQ -> SDR, desat=0 — no creative
# look change), exactly like frame-picker.sh.
#
# Usage:
#   ./scripts/mosaic.sh <cols2|rows2|wedge3|quad> <mute|first> <out.mp4> \
#       <in1> <in2> [in3] [in4]
set -euo pipefail

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"; [[ -x "$FFMPEG" ]] || FFMPEG="ffmpeg"
FFPROBE="/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"; [[ -x "$FFPROBE" ]] || FFPROBE="ffprobe"

LAYOUT="${1:?layout required (cols2|rows2|wedge3|quad)}"
AUDIO="${2:?audio required (mute|first)}"
OUT="${3:?out.mp4 required}"
shift 3
INPUTS=("$@")
N=${#INPUTS[@]}

W=1080; H=1920; FPS=30

case "$LAYOUT" in
  cols2|rows2) [[ "$N" -eq 2 ]] || { echo "mosaic: $LAYOUT needs 2 clips, got $N" >&2; exit 1; } ;;
  wedge3)      [[ "$N" -eq 3 ]] || { echo "mosaic: wedge3 needs 3 clips, got $N" >&2; exit 1; } ;;
  quad)        [[ "$N" -eq 4 ]] || { echo "mosaic: quad needs 4 clips, got $N" >&2; exit 1; } ;;
  *) echo "mosaic: unknown layout '$LAYOUT'" >&2; exit 1 ;;
esac

# --- shortest duration across inputs (everything plays for this long) ---
MIN=""
for v in "${INPUTS[@]}"; do
  d=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=duration \
       -of default=nw=1:nk=1 "$v" 2>/dev/null || true)
  [[ -z "$d" || "$d" == "N/A" ]] && d=$("$FFPROBE" -v error \
       -show_entries format=duration -of default=nw=1:nk=1 "$v" 2>/dev/null || true)
  [[ -z "$d" || "$d" == "N/A" ]] && continue
  if [[ -z "$MIN" ]] || awk "BEGIN{exit !($d < $MIN)}"; then MIN="$d"; fi
done
[[ -z "$MIN" ]] && MIN=3

# --- HDR only if EVERY input is HLG/PQ; one SDR clip drops the whole frame to SDR ---
ALL_HDR=1
for v in "${INPUTS[@]}"; do
  trc=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=color_transfer \
        -of default=nw=1:nk=1 "$v" 2>/dev/null || true)
  if [[ "$trc" != "arib-std-b67" && "$trc" != "smpte2084" ]]; then ALL_HDR=0; break; fi
done

# Faithful HLG/PQ -> SDR Rec.709 (no desat); used per HDR input on the SDR path.
TM_SDR="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"

# Build one input's prep chain: normalize fps, fill + center-crop to w x h,
# square pixels, and land in the shared output pixel format. Echoes the chain
# (ending in [label]).
prep() {  # idx w h label
  local i="$1" w="$2" h="$3" lbl="$4" pre="" post=",format=yuv420p"
  if [[ "$ALL_HDR" == "1" ]]; then
    post=",format=yuv420p10le"
  else
    local trc
    trc=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=color_transfer \
          -of default=nw=1:nk=1 "${INPUTS[$i]}" 2>/dev/null || true)
    [[ "$trc" == "arib-std-b67" || "$trc" == "smpte2084" ]] && pre="${TM_SDR},"
  fi
  printf '[%d:v]fps=%d,%sscale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,setsar=1%s[%s]' \
    "$i" "$FPS" "$pre" "$w" "$h" "$w" "$h" "$post" "$lbl"
}

declare -a IN_ARGS=()
for v in "${INPUTS[@]}"; do IN_ARGS+=(-i "$v"); done

TMP=""
case "$LAYOUT" in
  cols2)
    FILTER="$(prep 0 540 1920 a);$(prep 1 540 1920 b);[a][b]hstack=inputs=2[v]"
    ;;
  rows2)
    FILTER="$(prep 0 1080 960 a);$(prep 1 1080 960 b);[a][b]vstack=inputs=2[v]"
    ;;
  quad)
    FILTER="$(prep 0 540 960 a);$(prep 1 540 960 b);$(prep 2 540 960 c);$(prep 3 540 960 d);[a][b]hstack=inputs=2[top];[c][d]hstack=inputs=2[bot];[top][bot]vstack=inputs=2[v]"
    ;;
  wedge3)
    # clip 0 is the full-frame BASE (shows through the left wedge); clips 1 & 2
    # are masked to the right + bottom wedges and overlaid on top. Three spokes
    # from the center (540,960): up, down-left, down-right.
    TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
    magick -size ${W}x${H} xc:black -fill white \
      -draw "polygon 540,960 540,0 1080,0 1080,1920" "$TMP/right.png"   # clip 1
    magick -size ${W}x${H} xc:black -fill white \
      -draw "polygon 540,960 0,1920 1080,1920" "$TMP/bottom.png"        # clip 2
    IN_ARGS+=(-loop 1 -framerate "$FPS" -i "$TMP/right.png")            # input 3
    IN_ARGS+=(-loop 1 -framerate "$FPS" -i "$TMP/bottom.png")           # input 4
    FILTER="$(prep 0 "$W" "$H" v0);$(prep 1 "$W" "$H" v1);$(prep 2 "$W" "$H" v2);"
    FILTER+="[3:v]format=gray[gr];[4:v]format=gray[gb];"
    FILTER+="[v1][gr]alphamerge[r1];[v2][gb]alphamerge[r2];"
    FILTER+="[v0][r1]overlay=0:0:shortest=1[o1];[o1][r2]overlay=0:0:shortest=1[v]"
    ;;
esac

# Final color normalization + matching encoder flags.
if [[ "$ALL_HDR" == "1" ]]; then
  FILTER="$FILTER;[v]setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67:range=limited[vo]"
  CV=(-c:v libx265 -preset medium -crf 18 -tag:v hvc1
      -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited"
      -color_primaries bt2020 -colorspace bt2020nc -color_trc arib-std-b67 -color_range tv)
else
  FILTER="$FILTER;[v]format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv[vo]"
  CV=(-c:v libx265 -preset medium -crf 18 -tag:v hvc1
      -x265-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=limited"
      -color_primaries bt709 -colorspace bt709 -color_trc bt709 -color_range tv)
fi

declare -a AU=()
[[ "$AUDIO" == "first" ]] && AU=(-map "0:a:0?" -c:a aac -b:a 128k)

echo "Mosaic ${LAYOUT} (${N} clips, ${MIN}s, $([[ $ALL_HDR == 1 ]] && echo HDR || echo SDR)) -> $OUT"

# ${AU[@]+...} guards the empty (mute) case under `set -u` on bash 3.2 (macOS).
"$FFMPEG" -y -hide_banner -loglevel error "${IN_ARGS[@]}" \
  -filter_complex "$FILTER" -map "[vo]" ${AU[@]+"${AU[@]}"} \
  -t "$MIN" "${CV[@]}" -movflags +faststart "$OUT"

echo "Done: $OUT"
