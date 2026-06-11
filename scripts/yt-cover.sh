#!/usr/bin/env bash
# One-off YouTube cover builder for the 2026-06-11 kettlebell video.
# Layout: blurred+darkened still as 1280x720 base, sharp portrait subject on
# the right, left->right black scrim, brand lime-gradient headline (same look
# as cover-gradient.sh: gradient fill + thick black outline, Archivo Black).
set -euo pipefail

SUBJ="${1:?subject image}"
OUT="${2:?out jpg}"

W=1280; H=720
FONT="$HOME/Library/Fonts/ArchivoBlack-Regular.ttf"
OUTFIT="/Users/felipemuner/felipe-projects/lipemoves/assets/fonts/Outfit-600.ttf"
G_TL="#9BFF1A"; G_BR="#4FE000"   # brand fluorescent lime sweep
OUTLINE=10

T=$(mktemp -d -t ytcover)
trap 'rm -rf "$T"' EXIT

# Base: blurred fill of the same shot, darkened, so edges aren't empty.
magick "$SUBJ" -auto-orient -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
  -blur 0x14 -modulate 70,105 "$T/bg.png"

# Sharp subject column on the right.
magick "$SUBJ" -auto-orient -resize "x${H}" "$T/subj.png"

# Left->right scrim (dark on the text side, clear over the subject).
magick -size "${H}x${W}" "gradient:rgba(8,10,8,0.92)-rgba(8,10,8,0)" -rotate -90 "$T/scrim.png"

# Headline "3 MOVES" — one diagonal lime gradient across the glyphs + black
# outline dilated OUTSIDE the letters (never -extent the gradient layer: it
# silently goes grayscale — same gotcha as cover-gradient.sh).
make_grad_line() { # $1=text $2=pointsize $3=outpng
  local PS="$2" TXT="$1" O="$3"
  magick -background none -fill white -font "$FONT" -pointsize "$PS" \
    -kerning 2 "label:${TXT}" "$T/_mask.png"
  local LW LH PW PH
  LW=$(magick identify -format %w "$T/_mask.png"); LH=$(magick identify -format %h "$T/_mask.png")
  PW=$(( LW + OUTLINE*2 )); PH=$(( LH + OUTLINE*2 ))
  magick -size "${PW}x${PH}" -background none -fill white -font "$FONT" \
    -pointsize "$PS" -kerning 2 -gravity center "label:${TXT}" "$T/_maskp.png"
  magick \
    \( -size "${PW}x${PH}" -define gradient:angle=135 "gradient:${G_TL}-${G_BR}" \) \
    "$T/_maskp.png" -compose CopyOpacity -composite "$T/_grad.png"
  magick "$T/_maskp.png" -channel A -morphology Dilate "Disk:${OUTLINE}" +channel \
    -fill black -colorize 100 "$T/_ol.png"
  # _ol is gray+alpha — force sRGB before merging or the lime collapses to gray
  magick "$T/_ol.png" -colorspace sRGB "$T/_grad.png" -compose over -composite "PNG32:$O"
}

make_white_line() { # $1=text $2=pointsize $3=outpng
  magick -background none -fill white -font "$FONT" -pointsize "$2" \
    -kerning 2 "label:$1" \
    \( +clone -channel A -morphology Dilate "Disk:7" +channel -fill black -colorize 100 \) \
    +swap -background none -layers merge +repage "$3"
}

make_grad_line  "3 MOVES"  170 "$T/l2.png"
make_white_line "ONLY"      84 "$T/l1.png"
make_white_line "FULL BODY • 30 MIN" 52 "$T/l3.png"

# Brand tag (Outfit, like the site).
magick -background none -fill white -font "$OUTFIT" -pointsize 42 -kerning 10 \
  "label:LIPEMOVES" "$T/brand.png"

# Compose. Subject right, scrim, then the text block on the left axis.
magick "$T/bg.png" \
  "$T/subj.png"  -gravity east      -geometry +0+0    -composite \
  "$T/scrim.png" -gravity northwest -geometry +0+0    -composite \
  "$T/brand.png" -gravity northwest -geometry +64+48  -composite \
  "$T/l1.png"    -gravity west      -geometry +60-160 -composite \
  "$T/l2.png"    -gravity west      -geometry +56+0   -composite \
  "$T/l3.png"    -gravity west      -geometry +62+150 -composite \
  -quality 92 "$OUT"
echo "Cover: $OUT"
