#!/usr/bin/env bash
# One-off cover builder for the 2026-06-12 kettlebell session.
# 5 designs x 2 formats (YouTube 1280x720, Instagram 1080x1350), flyer look:
# B&W photo, fluorescent lime gradient headlines (Archivo Black), LIPEMOVES
# wordmark (Outfit, MOVES in lime), lime pill badges.
set -euo pipefail

FRAMES="${1:-/tmp/cover-frames/frames}"
OUTD="${2:-$HOME/Downloads/covers-2026-06-12}"
mkdir -p "$OUTD"

ARCHIVO="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"
OUTFIT="/Users/felipemuner/felipe-projects/lipemoves/assets/fonts/Outfit-600.ttf"
G_TL="#9BFF1A"; G_BR="#4FE000"   # brand lime sweep
LIME="#5BF11A"
OL=10                            # gradient headline outline px

T=$(mktemp -d -t covers)
trap 'rm -rf "$T"' EXIT

# ---- text helpers -----------------------------------------------------------
# Headline sized to fit a target width: lime gradient fill + black outline
# dilated outside the glyphs. Never -extent the gradient layer (goes grayscale)
# and force the outline to sRGB before merging — same gotchas as yt-cover.sh.
make_grad_fit() { # $1=text $2=width $3=outpng
  magick -background none -fill white -font "$ARCHIVO" -size "${2}x" \
    -kerning 2 "label:$1" "$T/_m.png"
  local w h pw ph
  w=$(magick identify -format %w "$T/_m.png"); h=$(magick identify -format %h "$T/_m.png")
  pw=$(( w + OL*2 )); ph=$(( h + OL*2 ))
  # PNG32 + explicit sRGB everywhere: the gray+alpha mask otherwise drags the
  # whole composite down to grayscale and the lime collapses to gray.
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

make_kicker() { # $1=text $2=pointsize $3=outpng   (Outfit, letterspaced, flyer style)
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

# Left-aligned vertical stack of the design's text assets.
stack_text() { # $1=outpng  rest=input pngs
  local O="$1"; shift
  magick "$@" -background none -gravity west -append "PNG32:$O"
}

# ---- photo prep -------------------------------------------------------------
# Frames come out of frame-picker already portrait (1080x1920) and SDR.
prep_ig() { # $1=frame $2=out $3=bw(1|0)   full-bleed 1080x1350, crop biased up
  local TONE=""
  [[ "$3" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB"
  magick "$1" -resize "1080x" -crop "1080x1350+0+150" +repage \
    $TONE -type TrueColor "PNG32:$2"
}

prep_yt_bg() { # $1=frame $2=out $3=bw
  local TONE="-modulate 70,105"
  [[ "$3" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB -modulate 60"
  magick "$1" -resize "1280x720^" -gravity center -extent "1280x720" \
    -blur 0x14 $TONE -type TrueColor "PNG32:$2"
}

prep_yt_subj() { # $1=frame $2=out $3=bw
  local TONE=""
  [[ "$3" == "1" ]] && TONE="-colorspace gray -sigmoidal-contrast 3x45% -colorspace sRGB"
  magick "$1" -resize "x720" $TONE -type TrueColor "PNG32:$2"
}

# ---- scrims -----------------------------------------------------------------
magick -size "720x1280" "gradient:rgba(8,10,8,0.94)-rgba(8,10,8,0)" -rotate -90 "$T/scrim_yt.png"
magick -size "1080x760" "gradient:rgba(0,0,0,0)-rgba(0,0,0,0.92)" "$T/scrim_ig_bot.png"
magick -size "1080x240" "gradient:rgba(0,0,0,0.55)-rgba(0,0,0,0)" "$T/scrim_ig_top.png"

make_brand 40 "$T/brand_yt.png"
make_brand 48 "$T/brand_ig.png"
spacer 16 "$T/sp16.png"; spacer 26 "$T/sp26.png"; spacer 34 "$T/sp34.png"

# ---- per-design compose -----------------------------------------------------
# Globals set before each call: KICKER HEAD1 HEAD2 SUB PILL  (HEAD2 may be "")
compose_yt() { # $1=frame $2=bw $3=out
  prep_yt_bg   "$FRAMES/$1" "$T/bg.png"   "$2"
  prep_yt_subj "$FRAMES/$1" "$T/subj.png" "$2"
  make_kicker     "$KICKER" 46  "$T/k.png"
  make_grad_fit   "$HEAD1"  760 "$T/h1.png"
  local PARTS=("$T/k.png" "$T/sp16.png" "$T/h1.png")
  if [[ -n "$HEAD2" ]]; then
    make_grad_fit "$HEAD2"  600 "$T/h2.png"
    PARTS+=("$T/h2.png")
  fi
  make_white_line "$SUB"    38  "$T/s.png"
  make_pill       "$PILL"   34  "$T/p.png"
  PARTS+=("$T/sp16.png" "$T/s.png" "$T/sp26.png" "$T/p.png")
  stack_text "$T/stack.png" "${PARTS[@]}"
  magick "$T/bg.png" \
    "$T/subj.png"     -gravity east      -geometry +0+0   -composite \
    "$T/scrim_yt.png" -gravity northwest -geometry +0+0   -composite \
    "$T/brand_yt.png" -gravity northwest -geometry +56+40 -composite \
    "$T/stack.png"    -gravity west      -geometry +56+24 -composite \
    -quality 92 "$OUTD/$3"
  echo "  $3"
}

compose_ig() { # $1=frame $2=bw $3=out
  prep_ig "$FRAMES/$1" "$T/base.png" "$2"
  make_kicker     "$KICKER" 54  "$T/k.png"
  make_grad_fit   "$HEAD1"  960 "$T/h1.png"
  local PARTS=("$T/k.png" "$T/sp16.png" "$T/h1.png")
  if [[ -n "$HEAD2" ]]; then
    make_grad_fit "$HEAD2"  760 "$T/h2.png"
    PARTS+=("$T/h2.png")
  fi
  make_white_line "$SUB"    42  "$T/s.png"
  PARTS+=("$T/sp16.png" "$T/s.png")
  stack_text "$T/stack.png" "${PARTS[@]}"
  make_pill "$PILL" 42 "$T/p.png"
  magick "$T/base.png" \
    "$T/scrim_ig_bot.png" -gravity south     -geometry +0+0   -composite \
    "$T/scrim_ig_top.png" -gravity north     -geometry +0+0   -composite \
    "$T/p.png"            -gravity northwest -geometry +48+44 -composite \
    "$T/brand_ig.png"     -gravity northeast -geometry +48+48 -composite \
    "$T/stack.png"        -gravity southwest -geometry +52+76 -composite \
    -quality 92 "$OUTD/$3"
  echo "  $3"
}

# ---- the 5 designs ----------------------------------------------------------
echo "Design 1 — ONLY 2 MOVES (frame 033)"
KICKER="ONLY"; HEAD1="2 MOVES"; HEAD2=""
SUB="SWING SQUAT • FIGURE 8"; PILL="20 MIN • 30s ON / 30s REST"
compose_yt 033.png 1 cover-1-yt.jpg
compose_ig 033.png 1 cover-1-ig.jpg

echo "Design 2 — 20 MIN (frame 014)"
KICKER="KETTLEBELL"; HEAD1="20 MIN"; HEAD2=""
SUB="SWING SQUAT • FIGURE 8"; PILL="ONLY 2 MOVES • 30/30"
compose_yt 014.png 1 cover-2-yt.jpg
compose_ig 014.png 1 cover-2-ig.jpg

echo "Design 3 — 30 ON 30 OFF (frame 042)"
KICKER="20 MIN KETTLEBELL"; HEAD1="30s ON"; HEAD2="30s OFF"
SUB="SWING SQUAT • FIGURE 8"; PILL="FOLLOW ALONG"
compose_yt 042.png 1 cover-3-yt.jpg
compose_ig 042.png 1 cover-3-ig.jpg

echo "Design 4 — the moves (frame 005)"
KICKER="JUST 2 MOVES"; HEAD1="SWING SQUAT"; HEAD2="FIGURE 8"
SUB="30s ON • 30s REST"; PILL="20 MIN FOLLOW ALONG"
compose_yt 005.png 1 cover-4-yt.jpg
compose_ig 005.png 1 cover-4-ig.jpg

echo "Design 5 — follow along, color (frame 033)"
KICKER="TRAIN WITH ME"; HEAD1="FOLLOW ALONG"; HEAD2=""
SUB="SWING SQUAT • FIGURE 8"; PILL="20 MIN • 30s ON / 30s REST"
compose_yt 033.png 0 cover-5-yt.jpg
compose_ig 033.png 0 cover-5-ig.jpg

echo "Done -> $OUTD"
