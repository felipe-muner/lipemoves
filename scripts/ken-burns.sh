#!/usr/bin/env bash
# Ken Burns zoom (in/out alternating) for a batch of clips.
# - Output: 1080x1920 @30fps (Reels/TikTok portrait)
# - Video plays at original speed; zoom progresses slowly across the clip
# - Colors are NEVER changed: each clip's own color tags (matrix/primaries/
#   transfer/range) + bit depth are detected and passed through verbatim. So
#   HLG/BT.2020 10-bit stays HDR and bt709 8-bit stays SDR — no tonemap, no
#   gamut change. Falls back to bt709 only when a clip is genuinely untagged.
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

ZOOM="${ZOOM:-0.10}"   # total zoom range across the whole clip (half-speed; was 0.20)
FPS=30

# Unpredictable Ken Burns moves: each is "dir:fx:fy" — dir zoom in/out, and
# (fx,fy) is the anchor the move drifts toward (0,0)=top-left, (1,0)=top-right,
# (.5,.5)=center, (0,.5)=left edge, (1,1)=bottom-right, etc. The list is
# SHUFFLED per run so consecutive clips pan different directions at random.
moves=("in:1:0" "out:0.5:0.5" "in:0:0.5" "in:0:1" "out:0:0" "in:0.5:0.5" \
       "out:1:0.5" "in:1:1" "out:0.5:0" "in:0.5:1" "out:0:1" "in:1:0.5")
MOVES=()
while IFS= read -r _m; do MOVES+=("$_m"); done < <(printf '%s\n' "${moves[@]}" | sort -R)

# Read one source video stream tag, falling back to a default when the source
# is missing/unknown for that field.  probe_tag <field> <file> <default>
probe_tag() {
  local v
  v=$("$FFPROBE" -v error -select_streams v:0 \
       -show_entries stream="$1" -of default=nw=1:nk=1 "$2" 2>/dev/null)
  [[ -z "$v" || "$v" == "unknown" || "$v" == "N/A" ]] && v="$3"
  printf '%s' "$v"
}

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
  # Pick this clip's shuffled move: direction + anchor (fx,fy).
  m="${MOVES[$(( i % ${#MOVES[@]} ))]}"
  dir="${m%%:*}"; rest="${m#*:}"; FX="${rest%%:*}"; FY="${rest##*:}"
  if [[ "$dir" == "in" ]]; then
    zexpr="1.0+${ZOOM}*on/${TOTAL_FRAMES}"
  else
    zexpr="1.0+${ZOOM}*(1-on/${TOTAL_FRAMES})"
  fi
  label="${dir}@${FX},${FY}"

  # Detect the SOURCE color so we PRESERVE it exactly: HLG/bt2020 stays HDR,
  # bt709 stays SDR. No tonemap, no gamut change. bt709 fallback if untagged.
  CS=$(probe_tag color_space     "$f" bt709)   # matrix
  CP=$(probe_tag color_primaries "$f" bt709)
  CT=$(probe_tag color_transfer  "$f" bt709)
  CR=$(probe_tag color_range     "$f" tv)
  PIXFMT=$(probe_tag pix_fmt     "$f" yuv420p)
  # Match source bit depth (HDR is 10-bit); otherwise 8-bit.
  case "$PIXFMT" in
    *10le|*10be|p010*|*10) OUTFMT=yuv420p10le ;;
    *)                     OUTFMT=yuv420p ;;
  esac
  # x265 wants full/limited; ffmpeg + ffprobe use pc/tv.
  if [[ "$CR" == pc || "$CR" == full ]]; then
    X265RANGE=full; FFRANGE=pc
  else
    X265RANGE=limited; FFRANGE=tv
  fi

  echo "[$((i+1))] $name  ->  ${base}-kb.mp4  (zoom-${label}, ${D}s, ${CT}/${CP} ${FFRANGE} ${OUTFMT})"

  # Pipeline — NO color change. The zoom is the only thing applied. setparams
  # re-stamps the color tags zoompan strips with the SOURCE's own values, and
  # libx265 writes a matching VUI, so players render it exactly like the source.
  #  1) upscale 2x to give zoompan crop room  2) zoompan zoom -> 1080x1920
  VF="fps=${FPS},\
scale=2160:3840,\
zoompan=z='${zexpr}':d=1:x='(iw-iw/zoom)*${FX}':y='(ih-ih/zoom)*${FY}':s=1080x1920:fps=${FPS},\
format=${OUTFMT},\
setparams=range=${FFRANGE}:colorspace=${CS}:color_primaries=${CP}:color_trc=${CT}"

  "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
    -vf "$VF" \
    -c:v libx265 -preset medium -crf 18 -tag:v hvc1 \
    -x265-params "colorprim=${CP}:transfer=${CT}:colormatrix=${CS}:range=${X265RANGE}" \
    -color_primaries "${CP}" -colorspace "${CS}" -color_trc "${CT}" -color_range "${FFRANGE}" \
    -c:a aac -b:a 128k -movflags +faststart "$out"

  i=$((i+1))
done

echo "Done. $i files written to: $OUT_DIR"
