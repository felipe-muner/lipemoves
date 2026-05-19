#!/usr/bin/env python3
"""Neon-green chunky-outlined text overlay for video thumbnails.

Usage:
    python3 thumb_text.py <image.jpg> "LINE ONE" "LINE TWO" [--out out.jpg]

Style: Arial Black, bright green (#3CF03C) fill with thick black outline,
text fills ~92% of image width, centered horizontally near the top.
Matches the gym-thumbnail aesthetic (TRAIN LIKE OUR ANCESTORS, etc.).
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
GREEN = (60, 240, 60)
BLACK = (0, 0, 0)
TARGET_WIDTH_RATIO = 0.92
LINE_GAP = 0.02
TOP_PAD = 0.04
OUTLINE_RATIO = 0.06


def render(src: Path, lines: list[str], out: Path):
    img = Image.open(src).convert("RGB")
    W, H = img.size
    draw = ImageDraw.Draw(img)

    def width_at(text, size):
        f = ImageFont.truetype(FONT_PATH, size)
        bbox = draw.textbbox((0, 0), text, font=f)
        return bbox[2] - bbox[0]

    target_w = int(W * TARGET_WIDTH_RATIO)
    lo, hi = 20, int(H)
    while lo < hi - 1:
        mid = (lo + hi) // 2
        if max(width_at(t, mid) for t in lines) <= target_w:
            lo = mid
        else:
            hi = mid
    font_size = lo
    font = ImageFont.truetype(FONT_PATH, font_size)
    outline_w = max(4, int(font_size * OUTLINE_RATIO))

    y = int(H * TOP_PAD)
    line_gap_px = int(H * LINE_GAP)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font, stroke_width=outline_w)
        lw = bbox[2] - bbox[0]
        lh = bbox[3] - bbox[1]
        x = (W - lw) // 2 - bbox[0]
        draw.text((x, y - bbox[1]), line, font=font,
                  fill=GREEN, stroke_width=outline_w, stroke_fill=BLACK)
        y += lh + line_gap_px

    img.save(out, quality=95)
    print(f"OK {out}  font_size={font_size}  stroke={outline_w}")


def main():
    ap = argparse.ArgumentParser(description="Neon-green thumbnail text overlay.")
    ap.add_argument("image", type=Path, help="Source image path")
    ap.add_argument("lines", nargs="+", help="One or more lines of text (uppercase recommended)")
    ap.add_argument("--out", type=Path, default=None,
                    help="Output path (default: <stem>-thumb.jpg next to source)")
    args = ap.parse_args()
    src = args.image.expanduser().resolve()
    out = args.out or src.with_name(f"{src.stem}-thumb.jpg")
    render(src, [l.upper() for l in args.lines], out)


if __name__ == "__main__":
    main()
