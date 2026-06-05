#!/usr/bin/env bash
# Distress an RGBA text PNG into the "grunge stamp" look: a clean fill with a
# thin dark keyline, rough speckled edges and moderate diagonal scratch hatching
# — a worn screen-print. Shared by cover.sh and label-video.sh when the studio's
# "Grunge" toggle is on.
#
# Only the glyph SHAPE of the input is used; the fill colour is supplied
# explicitly so dilated/keyline pixels get a clean colour (white labels stay
# white, the green cover stays green). The glyph core stays near its original
# pixel scale (the added padding is transparent), so callers can still scale the
# whole layer to a measured target width afterwards.
#
# Usage: grunge-text.sh <in.png> <out.png> <#fillColor> [thickenPx]
#   thickenPx: extra glyph dilation for a chunkier look (0 = as-is, ~10 = bold).
set -euo pipefail

MAGICK="$(command -v magick || true)"
[[ -n "$MAGICK" ]] || { echo "ImageMagick (magick) not found. brew install imagemagick" >&2; exit 1; }

IN="${1:?input png required}"
OUT="${2:?output png required}"
COLOR="${3:-#FFFFFF}"
THICKEN="${4:-0}"

OUTLINE_PX=3                 # thin dark keyline width (at the reference render size)
EDGE_BAND=7                  # width of the speckled edge band (interior stays solid)

W0=$("$MAGICK" identify -format "%w" "$IN")
H0=$("$MAGICK" identify -format "%h" "$IN")
# Pad so dilation, keyline and shadow have room (otherwise they'd clip).
PAD=$(( THICKEN + OUTLINE_PX + EDGE_BAND + 18 ))
W=$(( W0 + PAD*2 ))
H=$(( H0 + PAD*2 ))

TMP=$(mktemp -d -t grunge)
trap 'rm -rf "$TMP"' EXIT

# Glyph shape (white = ink), padded.
"$MAGICK" "$IN" -alpha extract -bordercolor black -border "$PAD" "$TMP/ga.png"

# Optional thickening for a chunkier font.
if (( THICKEN > 0 )); then
  "$MAGICK" "$TMP/ga.png" -morphology Dilate "Disk:${THICKEN}" "$TMP/ga.png"
fi

# --- Speckled edge: eat away a thin band at the boundary, interior stays solid.
# (Threshold raw uniform noise — density is size-independent, unlike auto-level.)
"$MAGICK" -size "${W}x${H}" xc: -seed 11 +noise Random -colorspace Gray \
  -blur 0x0.5 -threshold 45% "$TMP/speck.png"
# Stipple only the outer band: glyph ∩ noise for the fringe, solid eroded core.
"$MAGICK" "$TMP/ga.png" "$TMP/speck.png" -compose Multiply -composite "$TMP/band.png"
"$MAGICK" "$TMP/ga.png" -morphology Erode "Disk:${EDGE_BAND}" "$TMP/core.png"
# Fill alpha = solid core OR speckled fringe (opaque inside, stippled edges).
"$MAGICK" "$TMP/core.png" "$TMP/band.png" -compose Lighten -composite "$TMP/fillA.png"

# --- Diagonal scratch hatch (dark marks across the letters). ---
# Seed sparse points (exact density), streak them diagonally, then re-binarise —
# this keeps the scratch coverage consistent at any glyph size.
"$MAGICK" -size "${W}x${H}" xc: -seed 29 +noise Random -colorspace Gray \
  -threshold 50% -motion-blur 0x32+52 -threshold 60% "$TMP/hatch.png"
"$MAGICK" "$TMP/fillA.png" "$TMP/hatch.png" -compose Multiply -composite "$TMP/scrA.png"

# --- Thin dark keyline: dilate the fill alpha and sit a dark ring underneath. ---
"$MAGICK" "$TMP/fillA.png" -morphology Dilate "Disk:${OUTLINE_PX}" "$TMP/keyA.png"

# Build coloured layers from each alpha mask. Write PNG32 (true 32-bit RGBA):
# a single-colour `xc:` is otherwise stored as a palette, which corrupts the
# alpha during the composites below and drops the fill colour.
"$MAGICK" -size "${W}x${H}" xc:"$COLOR" \( "$TMP/fillA.png" \) \
  -compose CopyOpacity -composite "PNG32:$TMP/fill.png"
"$MAGICK" -size "${W}x${H}" xc:"rgba(0,0,0,0.6)" \( "$TMP/scrA.png" \) \
  -compose CopyOpacity -composite "PNG32:$TMP/scratch.png"
"$MAGICK" -size "${W}x${H}" xc:black \( "$TMP/keyA.png" \) \
  -compose CopyOpacity -composite "PNG32:$TMP/key.png"

# Stack: keyline (under) → colour fill → scratches.
"$MAGICK" "$TMP/key.png" "$TMP/fill.png" -compose over -composite "PNG32:$TMP/kf.png"
"$MAGICK" "$TMP/kf.png" "$TMP/scratch.png" -compose over -composite "PNG32:$TMP/stamp.png"

# Soft drop shadow under the whole stamp.
"$MAGICK" "$TMP/stamp.png" \
  \( +clone -background black -shadow "80x4+0+4" \) +swap \
  -background none -layers merge +repage "PNG32:$OUT"
