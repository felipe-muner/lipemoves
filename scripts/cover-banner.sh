#!/usr/bin/env bash
# YouTube channel banner renderer in the LIPEMOVES flyer look.
# Canvas 2560x1440; all critical text is kept inside the 1546x423 center
# "safe zone" so it survives the TV/desktop/tablet/mobile crops.
#
# Look: blurred+darkened photo bg, sharp subject bleeding off one side, dark
# scrim under the text, lime gradient headline (Archivo Black), LIPEMOVES
# wordmark, @handle, optional sub line.
#
# Usage:
#   ./scripts/cover-banner.sh FRAME OUT HEAD1 [HEAD2] [HANDLE] [SUB] \
#       [BW 1|0] [SIDE right|left] [HEADW] [DUO 1|0]
#
# Empty optional args skip that element.
set -euo pipefail

FRAME="${1:?frame image required}"
OUT="${2:?out path required}"
HEAD1="${3:?headline required}"
HEAD2="${4:-}"
HANDLE="${5:-}"
SUB="${6:-}"
BW="${7:-0}"
SIDE="${8:-right}"
HEADW="${9:-1040}"
DUO="${10:-0}"

ARCHIVO="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTFIT="$(dirname "$SCRIPT_DIR")/assets/fonts/Outfit-600.ttf"
[[ -f "$OUTFIT" ]] || OUTFIT="$SCRIPT_DIR/../assets/fonts/Outfit-600.ttf"

G_TL="#9BFF1A"; G_BR="#4FE000"   # brand lime sweep
LIME="#5BF11A"
OL=12                            # gradient headline outline px

W=2560; H=1440
# Safe zone (centered 1546x423)
SX0=507; SY0=508; SW=1546; SH=423

T=$(mktemp -d -t coverbanner)
trap 'rm -rf "$T"' EXIT

# ---- text helpers -----------------------------------------------------------
make_grad_fit() { # $1=text $2=width $3=outpng  (lime gradient + black outline)
  magick -background none -fill white -font "$ARCHIVO" -size "${2}x" \
    -kerning 2 "label:$1" "$T/_m.png"
  local w h pw ph
  w=$(magick identify -format %w "$T/_m.png"); h=$(magick identify -format %h "$T/_m.png")
  pw=$(( w + OL*2 )); ph=$(( h + OL*2 ))
  magick "$T/_m.png" -background none -gravity center -extent "${pw}x${ph}" "PNG32:$T/_mp.png"
  magick \( -size "${pw}x${ph}" -define gradient:angle=135 "gradient:${G_TL}-${G_BR}" \) \
    "$T/_mp.png" -compose CopyOpacity -composite -colorspace sRGB "PNG32:$T/_g.png"
  magick "$T/_mp.png" -channel A -morphology Dilate "Disk:${OL}" +channel \
    -fill black -colorize 100 "$T/_ol.png"
  magick "$T/_ol.png" -colorspace sRGB "$T/_g.png" -compose over -composite "PNG32:$3"
}

make_white_fit() { # $1=text $2=width $3=outpng  (solid white + black outline)
  magick -background none -fill white -font "$ARCHIVO" -size "${2}x" \
    -kerning 2 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:${OL}" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}

make_sub() { # $1=text $2=pointsize $3=outpng  (Outfit white, letterspaced)
  magick -background none -fill white -font "$OUTFIT" -pointsize "$2" \
    -kerning 6 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:5" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}

make_handle() { # $1=text $2=pointsize $3=outpng  (lime @handle, Outfit)
  magick -background none -fill "$LIME" -font "$OUTFIT" -pointsize "$2" \
    -kerning 4 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:5" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}

make_brand() { # $1=pointsize $2=outpng   LIPE white + MOVES lime
  magick -background none -fill white  -font "$OUTFIT" -pointsize "$1" -kerning 5 "label:LIPE"  "$T/_b1.png"
  magick -background none -fill "$LIME" -font "$OUTFIT" -pointsize "$1" -kerning 5 "label:MOVES" "$T/_b2.png"
  magick "$T/_b1.png" "$T/_b2.png" -background none +append \
    \( +clone -channel A -morphology Dilate "Disk:5" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$2"
}

spacer() { magick -size "1x$1" xc:none "PNG32:$2"; }

# ---- photo treatment --------------------------------------------------------
TONE="-modulate 96,104"
[[ "$BW" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB"
if [[ "$DUO" == "1" ]]; then
  # lime/black duotone for the subject
  TONE="-colorspace gray -level 0%,100% ( -size 256x1 gradient:#06120a-#9BFF1A ) -clut"
fi

# blurred dark background (full bleed)
magick "$FRAME" -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
  -blur 0x18 -colorspace gray -sigmoidal-contrast 2x50% -colorspace sRGB \
  -modulate 42 -type TrueColor "PNG32:$T/bg.png"

# sharp subject, full height, slight extra so it bleeds top/bottom
SUBJH=$(( H + 80 ))
magick "$FRAME" -resize "x${SUBJH}" $TONE -type TrueColor "PNG32:$T/subj.png"

# scrim: dark sweep from the text side
if [[ "$SIDE" == "left" ]]; then
  SUBJ_GRAV="west"; TEXT_GRAV="east"
  magick -size "${H}x${W}" "gradient:rgba(6,9,7,0)-rgba(6,9,7,0.96)" -rotate -90 "$T/scrim.png"
  TX=$(( W - SX0 - 40 ))   # right padding handled via geometry from east
else
  SUBJ_GRAV="east"; TEXT_GRAV="west"
  magick -size "${H}x${W}" "gradient:rgba(6,9,7,0.96)-rgba(6,9,7,0)" -rotate -90 "$T/scrim.png"
fi
# soft vignette bottom for legibility
magick -size "${W}x520" "gradient:rgba(0,0,0,0)-rgba(0,0,0,0.5)" "$T/scrim_bot.png"

# ---- build the text stack ---------------------------------------------------
make_brand 58 "$T/brand.png"
make_grad_fit "$HEAD1" "$HEADW" "$T/h1.png"
[[ -n "$HEAD2" ]] && make_white_fit "$HEAD2" "$HEADW" "$T/h2.png"
[[ -n "$HANDLE" ]] && make_handle "$HANDLE" 52 "$T/handle.png"
[[ -n "$SUB" ]] && make_sub "$SUB" 40 "$T/sub.png"

spacer 26 "$T/sp26.png"; spacer 20 "$T/sp20.png"; spacer 34 "$T/sp34.png"

PARTS=("$T/brand.png" "$T/sp34.png" "$T/h1.png")
[[ -n "$HEAD2" ]] && PARTS+=("$T/h2.png")
[[ -n "$SUB" ]] && PARTS+=("$T/sp26.png" "$T/sub.png")
[[ -n "$HANDLE" ]] && PARTS+=("$T/sp20.png" "$T/handle.png")

magick "${PARTS[@]}" -background none -gravity west -append "PNG32:$T/stack.png"

# scale the stack down if it exceeds the safe-zone height
STH=$(magick identify -format %h "$T/stack.png")
if (( STH > SH )); then
  pct=$(awk -v sh="$SH" -v st="$STH" 'BEGIN{printf "%d", sh*100/st}')
  magick "$T/stack.png" -resize "${pct}%" "PNG32:$T/stack.png"
fi

# ---- compose ----------------------------------------------------------------
# text x-pad from the safe-zone edge
PAD=$(( SX0 + 8 ))
if [[ "$SIDE" == "left" ]]; then
  TEXT_GEO="+${PAD}+0"   # from east: keep inside right safe edge
else
  TEXT_GEO="+${PAD}+0"   # from west
fi

magick "$T/bg.png" \
  "$T/subj.png"     -gravity "$SUBJ_GRAV" -geometry +0+0 -composite \
  "$T/scrim.png"    -gravity northwest    -geometry +0+0 -composite \
  "$T/scrim_bot.png" -gravity south       -geometry +0+0 -composite \
  "$T/stack.png"    -gravity "$TEXT_GRAV" -geometry "$TEXT_GEO" -composite \
  -quality 94 "$OUT"

echo "Banner: $OUT"
