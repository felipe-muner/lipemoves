#!/usr/bin/env bash
# YouTube banner — multi-photo "wall" in the LIPEMOVES flyer look.
# Fills the full 2560x1440 with a row of photos, then a centered dark panel
# carries the text inside the 1546x423 safe zone. Eliminates dead space.
#
# Usage:
#   ./scripts/cover-banner-wall.sh OUT HEAD1 HEAD2 HANDLE SITE SUB BW "img1 img2 ..."
#
set -euo pipefail

OUT="${1:?out path required}"
HEAD1="${2:?headline required}"
HEAD2="${3:-}"
HANDLE="${4:-}"
SITE="${5:-}"
SUB="${6:-}"
BW="${7:-0}"
IMAGES="${8:?image list required}"

ARCHIVO="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTFIT="$(dirname "$SCRIPT_DIR")/assets/fonts/Outfit-600.ttf"
[[ -f "$OUTFIT" ]] || OUTFIT="$SCRIPT_DIR/../assets/fonts/Outfit-600.ttf"

G_TL="#9BFF1A"; G_BR="#4FE000"
LIME="#5BF11A"
OL=12

W=2560; H=1440
SH=423                 # safe-zone height
PANELW=1240            # centered text panel width

T=$(mktemp -d -t bannerwall)
trap 'rm -rf "$T"' EXIT

make_grad_fit() { # $1=text $2=width $3=outpng
  magick -background none -fill white -font "$ARCHIVO" -size "${2}x" -kerning 2 "label:$1" "$T/_m.png"
  local w h pw ph
  w=$(magick identify -format %w "$T/_m.png"); h=$(magick identify -format %h "$T/_m.png")
  pw=$(( w + OL*2 )); ph=$(( h + OL*2 ))
  magick "$T/_m.png" -background none -gravity center -extent "${pw}x${ph}" "PNG32:$T/_mp.png"
  magick \( -size "${pw}x${ph}" -define gradient:angle=135 "gradient:${G_TL}-${G_BR}" \) \
    "$T/_mp.png" -compose CopyOpacity -composite -colorspace sRGB "PNG32:$T/_g.png"
  magick "$T/_mp.png" -channel A -morphology Dilate "Disk:${OL}" +channel -fill black -colorize 100 "$T/_ol.png"
  magick "$T/_ol.png" -colorspace sRGB "$T/_g.png" -compose over -composite "PNG32:$3"
}
make_white_fit() { # $1 text $2 width $3 out
  magick -background none -fill white -font "$ARCHIVO" -size "${2}x" -kerning 2 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:${OL}" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}
make_sub() { # $1 text $2 pt $3 out
  magick -background none -fill white -font "$OUTFIT" -pointsize "$2" -kerning 6 "label:$1" "PNG32:$3"
}
make_brand() { # $1 pt $2 out
  magick -background none -fill white  -font "$OUTFIT" -pointsize "$1" -kerning 5 "label:LIPE"  "$T/_b1.png"
  magick -background none -fill "$LIME" -font "$OUTFIT" -pointsize "$1" -kerning 5 "label:MOVES" "$T/_b2.png"
  magick "$T/_b1.png" "$T/_b2.png" -background none +append "PNG32:$2"
}
make_meta() { # $1=handle $2=site $3=out   "@handle  ·  site"
  local parts=()
  if [[ -n "$1" ]]; then
    magick -background none -fill "$LIME" -font "$OUTFIT" -pointsize 50 -kerning 3 "label:$1" "$T/_mh.png"
    parts+=("$T/_mh.png")
  fi
  if [[ -n "$2" ]]; then
    [[ -n "$1" ]] && { magick -background none -fill "#9aa39a" -font "$OUTFIT" -pointsize 50 "label:   ·   " "$T/_md.png"; parts+=("$T/_md.png"); }
    magick -background none -fill white -font "$OUTFIT" -pointsize 50 -kerning 3 "label:$2" "$T/_ms.png"
    parts+=("$T/_ms.png")
  fi
  magick "${parts[@]}" -background none +append "PNG32:$3"
}
spacer() { magick -size "1x$1" xc:none "PNG32:$2"; }

# ---- photo wall -------------------------------------------------------------
read -ra IMGS <<< "$IMAGES"
N=${#IMGS[@]}
COLW=$(( (W + N - 1) / N + 2 ))
TONE="-modulate 92,108"
[[ "$BW" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB"
COLS=()
for img in "${IMGS[@]}"; do
  c="$T/col_${#COLS[@]}.png"
  magick "$img" -resize "${COLW}x${H}^" -gravity center -extent "${COLW}x${H}" $TONE "PNG32:$c"
  COLS+=("$c")
done
magick "${COLS[@]}" +append -gravity center -extent "${W}x${H}" "PNG32:$T/wall.png"
# subtle global darken + thin lime seams between photos
magick "$T/wall.png" -modulate 86 "PNG32:$T/wall.png"

# ---- centered text panel ----------------------------------------------------
PANELH=$(( SH + 150 ))
PY=$(( (H - PANELH) / 2 ))
magick -size "${PANELW}x${PANELH}" xc:none \
  -fill "rgba(8,11,9,0.82)" -draw "roundrectangle 0,0,$((PANELW-1)),$((PANELH-1)),36,36" \
  "PNG32:$T/panel.png"
# lime top accent bar inside panel
magick "$T/panel.png" -fill "$LIME" -draw "roundrectangle 40,28,$((PANELW-40)),36,4,4" "PNG32:$T/panel.png"

# ---- text stack (centered) --------------------------------------------------
make_brand 60 "$T/brand.png"
make_grad_fit "$HEAD1" 980 "$T/h1.png"
[[ -n "$HEAD2" ]] && make_white_fit "$HEAD2" 980 "$T/h2.png"
[[ -n "$SUB" ]] && make_sub "$SUB" 40 "$T/sub.png"
make_meta "$HANDLE" "$SITE" "$T/meta.png"

spacer 30 "$T/sp30.png"; spacer 22 "$T/sp22.png"; spacer 18 "$T/sp18.png"
PARTS=("$T/brand.png" "$T/sp30.png" "$T/h1.png")
[[ -n "$HEAD2" ]] && PARTS+=("$T/h2.png")
[[ -n "$SUB" ]] && PARTS+=("$T/sp22.png" "$T/sub.png")
PARTS+=("$T/sp18.png" "$T/meta.png")
magick "${PARTS[@]}" -background none -gravity center -append "PNG32:$T/stack.png"

# fit stack inside safe height
STH=$(magick identify -format %h "$T/stack.png")
if (( STH > SH )); then
  pct=$(awk -v sh="$SH" -v st="$STH" 'BEGIN{printf "%d", sh*100/st}')
  magick "$T/stack.png" -resize "${pct}%" "PNG32:$T/stack.png"
fi

# ---- compose ----------------------------------------------------------------
magick "$T/wall.png" \
  "$T/panel.png" -gravity center -geometry +0+0 -composite \
  "$T/stack.png" -gravity center -geometry +0+8 -composite \
  -quality 94 "$OUT"

echo "Banner wall: $OUT"
