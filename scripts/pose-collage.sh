#!/usr/bin/env bash
# Goal-pose sequence card in the LipeMoves brand (black + lime #00EF00): the
# MAIN pose (Scorpion) big at the top, then the prep poses that build toward it
# in a grid below — sized to fill Instagram 4:5 (1080×1350). Figures are
# écorché bodies from scripts/pose-figure.sh (generated on a black background so
# they sit seamlessly on the brand canvas); missing figures render as dark
# placeholders.
#
# Usage:
#   ./scripts/pose-collage.sh           # compose with whatever figures exist
#   GEN=1 ./scripts/pose-collage.sh     # generate figures via Gemini first
#
# Output: /tmp/scorpion-collage/scorpion-sequence.png (1080×1350)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${OUT_DIR:-/tmp/scorpion-collage}"
FIG_DIR="$OUT_DIR/figures"
mkdir -p "$FIG_DIR"

FONT_HEAVY="$SCRIPT_DIR/../public/fonts/ArchivoBlack-Regular.ttf"  # brand display
FONT_SOFT="$SCRIPT_DIR/../public/fonts/Outfit-600.ttf"            # labels / breaths

# LipeMoves brand palette: near-black canvas, lime accent, white ink.
BG="#0b0b0b"; INK="#f4f4f4"; SUB="#8d9490"; GREEN="#00EF00"
TILE="#1c1c1c"; MAT="#111111"

IG_W=1080; IG_H=1350
W=1040; M=20; COLS=3; GUT=5
CAP_H=48; GRID_FIG_H=250; HERO_FIG_H=500; HERO_TITLE_H=96; LABEL_H=52; LOGO_H=54

GOAL_TITLE="SCORPION POSE"
GOAL_KICKER="THE GOAL"
SECTION_LABEL="PREP SEQUENCE · WORK UP TO IT"

GOAL="goal|Full Scorpion|Scorpion pose (Vrschikasana), a forearm-stand backbend, shown in true side profile. A real athletic man with believable, normal human proportions — a compact normal-length torso (NOT elongated, NOT stretched, NOT rubbery), realistic torso-to-leg ratio. He balances on BOTH FOREARMS pressed flat on the mat, palms down, elbows under the shoulders, upper arms vertical. Shoulders and chest press up and forward; the upper back arches into a deep but anatomically possible backbend; the knees bend and the feet lower from above toward the back of the head. Every joint bends the way a real human joint can. Correct, clean, natural anatomy throughout — no distortion, no extra-long spine."
PREP=(
  "g1|DOLPHIN POSE|8 breaths|front|Dolphin pose: forearms on the mat shoulder-width, hips lifted high into an inverted V, head between the arms, heels reaching down."
  "g2|FOREARM PLANK|30 sec|side|Forearm plank: a strong straight line from heels to head, forearms flat, elbows under the shoulders, core braced."
  "g3|PUPPY POSE|8 breaths|side|Extended puppy pose (Anahatasana): knees under hips, arms stretched far forward, chest and chin melting toward the mat."
  "g4|CAMEL POSE|8 breaths|front|Camel pose (Ustrasana): kneeling upright on the mat, knees hip-width, hips pressing forward, both hands reaching back onto the heels, chest opening into a deep backbend, head dropping back."
  "g5|FOREARM STAND|5 breaths|side|Forearm stand (Pincha Mayurasana): inverted balance on the forearms, body stacked vertically over the elbows, legs straight up."
  "g6|SCORPION PREP|5 breaths|side|Scorpion prep, a forearm stand entering a backbend. The body balances on BOTH FOREARMS flat on the mat, palms down and fingers spread, elbows directly under the shoulders. The spine arches back and the bent knees lower the feet down toward the head, not yet touching. Anatomically correct, clean, natural arms, elbows and hands — no distortion."
)

# ---- optional figure generation --------------------------------------------
if [[ "${GEN:-0}" == "1" ]]; then
  echo "Generating figures (Gemini)…"; REF=""
  gen() { # key view desc
    local out="$FIG_DIR/$1.png"
    if [[ -f "$out" ]]; then [[ -n "$REF" ]] || REF="$out"; return 0; fi
    echo "  $1 …"
    if VIEW="Full-body $2 view" REF="$REF" "$SCRIPT_DIR/pose-figure.sh" "$3" "$out"; then
      [[ -n "$REF" ]] || REF="$out"   # anchor style on the first success
    else
      echo "  (failed: $1)"
    fi
    return 0
  }
  IFS='|' read -r gk gn gd <<<"$GOAL"; gen "$gk" side "$gd"
  for row in "${PREP[@]}"; do IFS='|' read -r k n b v d <<<"$row"; gen "$k" "$v" "$d"; done
fi

upper() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }

placeholder() { # out w h note big
  local out=$1 w=$2 h=$3 note=$4 big=${5:-0} r=18 lp=15 ls=12
  [[ "$big" == 1 ]] && { r=24; lp=20; ls=14; }
  magick -size "${w}x${h}" "xc:$BG" \
    -fill "$TILE" -draw "roundrectangle 7,7,$((w-8)),$((h-8)),$r,$r" \
    -fill "$MAT"  -draw "roundrectangle 18,$((h-26)),$((w-19)),$((h-12)),8,8" \
    -gravity center -font "$FONT_SOFT" -pointsize "$lp" -fill "#cfcfcf" -annotate +0-10 "écorché figure" \
    -gravity center -font "$FONT_SOFT" -pointsize "$ls" -fill "$GREEN" -annotate +0+14 "$note" \
    "$out"
}

figbox() { # key out w h note big
  local key=$1 out=$2 w=$3 h=$4 note=$5 big=${6:-0} src="$FIG_DIR/$1.png"
  if [[ -f "$src" ]]; then
    magick "$src" -resize "${w}x${h}" -background "$BG" -gravity center -extent "${w}x${h}" "$out"
  else
    placeholder "$out" "$w" "$h" "$note" "$big"
  fi
}

caption() { # out w name breaths
  magick -size "${2}x${CAP_H}" "xc:$BG" \
    -gravity North -font "$FONT_HEAVY" -pointsize 17 -fill "$INK"   -annotate +0+4  "$3" \
    -gravity North -font "$FONT_SOFT"  -pointsize 13 -fill "$GREEN" -annotate +0+32 "$(upper "$4")" \
    "$1"
}

echo "Composing collage…"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# grid of prep poses
cellW=$(( (W - 2*COLS*GUT) / COLS ))
cells=()
for row in "${PREP[@]}"; do
  IFS='|' read -r key name breaths view desc <<<"$row"
  n="${key#g}"
  figbox "$key" "$TMP/$key-f.png" "$cellW" "$GRID_FIG_H" "$breaths"
  caption "$TMP/$key-c.png" "$cellW" "$n. $name" "$breaths"
  magick "$TMP/$key-c.png" "$TMP/$key-f.png" -append "$TMP/$key.png"
  cells+=("$TMP/$key.png")
done
magick montage "${cells[@]}" -tile "${COLS}x2" -geometry "+${GUT}+${GUT}" -background "$BG" "$TMP/grid.png"
GW=$(magick identify -format '%w' "$TMP/grid.png")

# hero = the goal pose, big, with kicker (lime) + title (white) above it
IFS='|' read -r gk gn gd <<<"$GOAL"
figbox "$gk" "$TMP/goal-f.png" "$GW" "$HERO_FIG_H" "$gn" 1
magick -size "${GW}x$((HERO_TITLE_H + HERO_FIG_H))" "xc:$BG" \
  "$TMP/goal-f.png" -gravity South -geometry +0+0 -composite \
  -gravity North -font "$FONT_SOFT"  -pointsize 22 -fill "$GREEN" -kerning 6 -annotate +0+12 "$GOAL_KICKER" \
  -gravity North -font "$FONT_HEAVY" -pointsize 50 -fill "$INK"   -kerning 0 -annotate +0+40 "$GOAL_TITLE" \
  "$TMP/hero.png"

# section label (lime, letter-spaced)
magick -size "${GW}x${LABEL_H}" "xc:$BG" \
  -gravity center -font "$FONT_SOFT" -pointsize 18 -fill "$GREEN" -kerning 3 \
  -annotate +0+0 "$SECTION_LABEL" "$TMP/label.png"

# LIPEMOVES wordmark footer: LIPE (white) + MOVES (lime)
magick \
  \( -background "$BG" -fill "$INK"   -font "$FONT_HEAVY" -pointsize 26 label:"LIPE" \) \
  \( -background "$BG" -fill "$GREEN" -font "$FONT_HEAVY" -pointsize 26 label:"MOVES" \) \
  +append "$TMP/logo.png"
magick "$TMP/logo.png" -background "$BG" -gravity center -extent "${GW}x${LOGO_H}" "$TMP/footer.png"

# stack + pad to exact Instagram 4:5
magick "$TMP/hero.png" "$TMP/label.png" "$TMP/grid.png" "$TMP/footer.png" -background "$BG" -append \
  -background "$BG" -gravity center -extent "${IG_W}x${IG_H}" \
  "$OUT_DIR/scorpion-sequence.png"

echo "-> $OUT_DIR/scorpion-sequence.png ($(magick identify -format '%wx%h' "$OUT_DIR/scorpion-sequence.png"))"
