#!/usr/bin/env bash
# Flyer-style cover renderer — the look of the lipemoves flyers burned onto a
# video frame: B&W (optional) photo, lime gradient headline (Archivo Black),
# letterspaced kicker, sub line, lime pill badge, LIPEMOVES wordmark.
#
# Formats:
#   yt  1280x720  — YouTube thumbnail: blurred bg + sharp subject right,
#                   left scrim.
#   ig  1080x1920 — Instagram Reel cover, full-bleed. The profile grid shows
#                   the CENTER 3:4 crop (y 240..1680), so keep text inside it.
#
# Usage:
#   ./scripts/cover-flyer.sh <frame> <out.jpg> <yt|ig> <headline> \
#       [kicker] [headline2] [sub] [pill] [bw 1|0] \
#       [kickerPos] [headPos] [subPos] [pillPos] [brandPos]
#
# Empty optional args skip that element. bw defaults to 1 (B&W photo).
# The five *Pos args are free-drag CENTERS as "x,y" fractions of the canvas
# (from the studio preview). When ANY of them is set, every element is placed
# by its center (unset ones fall back to the default fractions below, kept in
# sync with FLYER_DEFAULT_POS in lib/studio/types.ts). With no *Pos args the
# legacy fixed flyer layout is used (batch scripts).
set -euo pipefail

FRAME="${1:?frame image required}"
OUT="${2:?out path required}"
FMT="${3:?format yt|ig required}"
HEAD1="${4:?headline required}"
KICKER="${5:-}"
HEAD2="${6:-}"
SUB="${7:-}"
PILL="${8:-}"
BW="${9:-1}"
KICKER_POS="${10:-}"
HEAD_POS="${11:-}"
SUB_POS="${12:-}"
PILL_POS="${13:-}"
BRAND_POS="${14:-}"

FREE=0
[[ -n "${KICKER_POS}${HEAD_POS}${SUB_POS}${PILL_POS}${BRAND_POS}" ]] && FREE=1

ARCHIVO="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTFIT="$(dirname "$SCRIPT_DIR")/assets/fonts/Outfit-600.ttf"
[[ -f "$OUTFIT" ]] || OUTFIT="$SCRIPT_DIR/../assets/fonts/Outfit-600.ttf"
G_TL="#9BFF1A"; G_BR="#4FE000"   # brand lime sweep
LIME="#5BF11A"
OL=10                            # gradient headline outline px

T=$(mktemp -d -t coverflyer)
trap 'rm -rf "$T"' EXIT

# ---- text helpers -----------------------------------------------------------
# Headline sized to fit a target width: lime gradient fill + black outline
# dilated outside the glyphs.
make_grad_fit() { # $1=text $2=width $3=outpng
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
  # _ol reads back as Gray (all-black PNG) — force sRGB at READ time or the
  # compose-over inherits Gray and the lime collapses.
  magick "$T/_ol.png" -colorspace sRGB "$T/_g.png" -compose over -composite "PNG32:$3"
}

make_white_line() { # $1=text $2=pointsize $3=outpng
  magick -background none -fill white -font "$ARCHIVO" -pointsize "$2" \
    -kerning 2 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:7" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}

make_kicker() { # $1=text $2=pointsize $3=outpng   (Outfit, letterspaced)
  magick -background none -fill white -font "$OUTFIT" -pointsize "$2" \
    -kerning 14 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:4" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "PNG32:$3"
}

make_pill() { # $1=text $2=pointsize $3=outpng
  magick -background none -fill black -font "$OUTFIT" -pointsize "$2" \
    -kerning 1 "label:$1" "$T/_pt.png"
  local w h px py pw ph r
  w=$(magick identify -format %w "$T/_pt.png"); h=$(magick identify -format %h "$T/_pt.png")
  px=$2; py=$(( $2 * 45 / 100 ))
  pw=$(( w + px*2 )); ph=$(( h + py*2 )); r=$(( ph / 2 ))
  magick -size "${pw}x${ph}" xc:none -fill "$LIME" \
    -draw "roundrectangle 0,0,$((pw-1)),$((ph-1)),$r,$r" \
    "$T/_pt.png" -gravity center -compose over -composite "PNG32:$3"
}

make_brand() { # $1=pointsize $2=outpng   LIPE white + MOVES lime
  magick -background none -fill white  -font "$OUTFIT" -pointsize "$1" -kerning 6 "label:LIPE"  "$T/_b1.png"
  magick -background none -fill "$LIME" -font "$OUTFIT" -pointsize "$1" -kerning 6 "label:MOVES" "$T/_b2.png"
  magick "$T/_b1.png" "$T/_b2.png" -background none +append "PNG32:$2"
}

spacer() { magick -size "1x$1" xc:none "PNG32:$2"; }

stack_text() { # $1=outpng  rest=input pngs (left-aligned vertical stack)
  local O="$1"; shift
  magick "$@" -background none -gravity west -append "PNG32:$O"
}

# Append an element placed by its CENTER ("x,y" fractions) to ARGS.
place() { # $1=png $2="x,y"
  local x y dx dy
  IFS=, read -r x y <<< "$2"
  dx=$(awk -v x="$x" -v w="$W" 'BEGIN{printf "%d", x*w - w/2}')
  dy=$(awk -v y="$y" -v h="$H" 'BEGIN{printf "%d", y*h - h/2}')
  ARGS+=("$1" -gravity center -geometry "$(printf "%+d%+d" "$dx" "$dy")" -composite)
}

# B&W treatment shared by both formats.
TONE=""
[[ "$BW" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB"

spacer 16 "$T/sp16.png"; spacer 26 "$T/sp26.png"

# ---- per-format canvas, scrims and element sizes ----------------------------
if [[ "$FMT" == "yt" ]]; then
  W=1280; H=720
  BGTONE="-modulate 70,105"
  [[ "$BW" == "1" ]] && BGTONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB -modulate 60"
  magick "$FRAME" -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
    -blur 0x14 $BGTONE -type TrueColor "PNG32:$T/bg.png"
  magick "$FRAME" -resize "x${H}" $TONE -type TrueColor "PNG32:$T/subj.png"
  magick -size "${H}x${W}" "gradient:rgba(8,10,8,0.94)-rgba(8,10,8,0)" -rotate -90 "$T/scrim.png"
  make_brand 40 "$T/brand.png"
  [[ -n "$KICKER" ]] && make_kicker "$KICKER" 46 "$T/k.png"
  make_grad_fit "$HEAD1" 760 "$T/h1.png"
  [[ -n "$HEAD2" ]] && make_grad_fit "$HEAD2" 600 "$T/h2.png"
  [[ -n "$SUB" ]] && make_white_line "$SUB" 38 "$T/s.png"
  [[ -n "$PILL" ]] && make_pill "$PILL" 34 "$T/p.png"
  # default free-drag centers (keep in sync with FLYER_DEFAULT_POS)
  D_K="0.18,0.22"; D_H="0.34,0.45"; D_S="0.27,0.67"; D_P="0.25,0.82"; D_B="0.16,0.09"
elif [[ "$FMT" == "ig" ]]; then
  W=1080; H=1920
  magick "$FRAME" -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
    $TONE -type TrueColor "PNG32:$T/base.png"
  magick -size "1080x900" "gradient:rgba(0,0,0,0)-rgba(0,0,0,0.92)" "$T/scrim_bot.png"
  magick -size "1080x560" "gradient:rgba(0,0,0,0.55)-rgba(0,0,0,0)" "$T/scrim_top.png"
  make_brand 48 "$T/brand.png"
  [[ -n "$KICKER" ]] && make_kicker "$KICKER" 54 "$T/k.png"
  make_grad_fit "$HEAD1" 960 "$T/h1.png"
  [[ -n "$HEAD2" ]] && make_grad_fit "$HEAD2" 760 "$T/h2.png"
  [[ -n "$SUB" ]] && make_white_line "$SUB" 42 "$T/s.png"
  [[ -n "$PILL" ]] && make_pill "$PILL" 42 "$T/p.png"
  D_K="0.25,0.70"; D_H="0.47,0.785"; D_S="0.30,0.862"; D_P="0.30,0.165"; D_B="0.78,0.165"
else
  echo "unknown format: $FMT (yt|ig)" >&2; exit 1
fi

# Headline block: h1 (+ h2 below, left-aligned).
if [[ -n "$HEAD2" ]]; then
  stack_text "$T/head.png" "$T/h1.png" "$T/h2.png"
else
  cp "$T/h1.png" "$T/head.png"
fi

# ---- compose ----------------------------------------------------------------
if [[ "$FMT" == "yt" ]]; then
  ARGS=("$T/bg.png"
    "$T/subj.png"  -gravity east      -geometry +0+0 -composite
    "$T/scrim.png" -gravity northwest -geometry +0+0 -composite)
  if [[ "$FREE" == "1" ]]; then
    place "$T/brand.png" "${BRAND_POS:-$D_B}"
    [[ -n "$KICKER" ]] && place "$T/k.png" "${KICKER_POS:-$D_K}"
    place "$T/head.png" "${HEAD_POS:-$D_H}"
    [[ -n "$SUB" ]] && place "$T/s.png" "${SUB_POS:-$D_S}"
    [[ -n "$PILL" ]] && place "$T/p.png" "${PILL_POS:-$D_P}"
  else
    PARTS=()
    [[ -n "$KICKER" ]] && PARTS+=("$T/k.png" "$T/sp16.png")
    PARTS+=("$T/head.png")
    [[ -n "$SUB" ]] && PARTS+=("$T/sp16.png" "$T/s.png")
    [[ -n "$PILL" ]] && PARTS+=("$T/sp26.png" "$T/p.png")
    stack_text "$T/stack.png" "${PARTS[@]}"
    ARGS+=("$T/brand.png" -gravity northwest -geometry +56+40 -composite
      "$T/stack.png" -gravity west -geometry +56+24 -composite)
  fi
  ARGS+=(-quality 92 "$OUT")
  magick "${ARGS[@]}"
else
  ARGS=("$T/base.png"
    "$T/scrim_bot.png" -gravity south -geometry +0+0 -composite
    "$T/scrim_top.png" -gravity north -geometry +0+0 -composite)
  if [[ "$FREE" == "1" ]]; then
    [[ -n "$PILL" ]] && place "$T/p.png" "${PILL_POS:-$D_P}"
    place "$T/brand.png" "${BRAND_POS:-$D_B}"
    [[ -n "$KICKER" ]] && place "$T/k.png" "${KICKER_POS:-$D_K}"
    place "$T/head.png" "${HEAD_POS:-$D_H}"
    [[ -n "$SUB" ]] && place "$T/s.png" "${SUB_POS:-$D_S}"
  else
    # Offsets keep everything inside the grid-safe center band (y 240..1680).
    PARTS=()
    [[ -n "$KICKER" ]] && PARTS+=("$T/k.png" "$T/sp16.png")
    PARTS+=("$T/head.png")
    [[ -n "$SUB" ]] && PARTS+=("$T/sp16.png" "$T/s.png")
    stack_text "$T/stack.png" "${PARTS[@]}"
    [[ -n "$PILL" ]] && ARGS+=("$T/p.png" -gravity northwest -geometry +48+280 -composite)
    ARGS+=("$T/brand.png" -gravity northeast -geometry +48+288 -composite
      "$T/stack.png" -gravity southwest -geometry +52+316 -composite)
  fi
  ARGS+=(-quality 92 "$OUT")
  magick "${ARGS[@]}"
fi

echo "Flyer cover ($FMT): $OUT"
