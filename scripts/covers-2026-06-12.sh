#!/usr/bin/env bash
# One-off cover batch for the 2026-06-12 kettlebell session: 5 designs, each
# rendered for YouTube (1280x720) and Instagram (1080x1920, grid-safe) via the
# shared flyer renderer (cover-flyer.sh — also used by the studio).
set -euo pipefail

FRAMES="${1:-/tmp/cover-frames/frames}"
OUTD="${2:-$HOME/Downloads/covers-2026-06-12}"
mkdir -p "$OUTD"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLYER="$SCRIPT_DIR/cover-flyer.sh"

render() { # $1=n $2=frame $3=bw $4=headline $5=kicker $6=headline2 $7=sub $8=pill
  echo "Design $1 (frame $2)"
  "$FLYER" "$FRAMES/$2" "$OUTD/cover-$1-yt.jpg" yt "$4" "$5" "$6" "$7" "$8" "$3" >/dev/null
  "$FLYER" "$FRAMES/$2" "$OUTD/cover-$1-ig.jpg" ig "$4" "$5" "$6" "$7" "$8" "$3" >/dev/null
  echo "  cover-$1-yt.jpg  cover-$1-ig.jpg"
}

#      n  frame    bw headline        kicker              headline2   sub                       pill
render 1 033.png 1 "2 MOVES"       "ONLY"              ""          "SWING SQUAT • FIGURE 8"  "20 MIN • 30s ON / 30s REST"
render 2 014.png 1 "20 MIN"        "KETTLEBELL"        ""          "SWING SQUAT • FIGURE 8"  "ONLY 2 MOVES • 30/30"
render 3 042.png 1 "30s ON"        "20 MIN KETTLEBELL" "30s OFF"   "SWING SQUAT • FIGURE 8"  "FOLLOW ALONG"
render 4 005.png 1 "SWING SQUAT"   "JUST 2 MOVES"      "FIGURE 8"  "30s ON • 30s REST"       "20 MIN FOLLOW ALONG"
render 5 033.png 0 "FOLLOW ALONG"  "TRAIN WITH ME"     ""          "SWING SQUAT • FIGURE 8"  "20 MIN • 30s ON / 30s REST"

echo "Done -> $OUTD"
