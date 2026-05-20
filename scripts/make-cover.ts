/**
 * Generate an Instagram cover image with bold neon-green text overlay.
 *
 * Usage:
 *   pnpm cover <input-image> "TEXT HERE" [--position top|bottom]
 *
 * Auto-fits text on 1 line if it fits with margin, otherwise wraps to 2 lines
 * (split at the most balanced word break). Uses Bebas Neue + neon green
 * (#39FF14) + thick black stroke to match the LipeMoves grid style.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const FONT_PATH = resolve("scripts/assets/BebasNeue-Regular.ttf");
const OUTPUT_DIR = resolve("out/covers");
const FILL = "#39FF14";
const STROKE = "black";

// % of image width the text block is allowed to occupy
const TEXT_WIDTH_RATIO = 0.9;
// % of image width = top/bottom margin from edge
const EDGE_MARGIN_RATIO = 0.04;
// stroke thickness as % of font size
const STROKE_RATIO = 0.055;
// when text length crosses this, wrap to 2 lines
const TWO_LINE_THRESHOLD = 16;

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function imageSize(path: string): { w: number; h: number } {
  const [w, h] = sh(`magick identify -format "%w %h" "${path}"`).split(" ");
  return { w: Number(w), h: Number(h) };
}

/**
 * Split text into 2 lines at the word boundary that yields the most balanced
 * (shortest max-length) split.
 */
function splitTwoLines(text: string): [string, string] {
  const words = text.split(/\s+/);
  if (words.length < 2) return [text, ""];
  let best = { idx: 1, score: Infinity };
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const score = Math.max(a.length, b.length);
    if (score < best.score) best = { idx: i, score };
  }
  return [
    words.slice(0, best.idx).join(" "),
    words.slice(best.idx).join(" "),
  ];
}

/**
 * Measure rendered width of a line at a given pointsize. Used to binary-search
 * the largest font size that fits within targetW.
 */
function measureWidth(text: string, pointsize: number): number {
  const out = sh(
    `magick -background none -font "${FONT_PATH}" -pointsize ${pointsize} ` +
      `label:"${text.replace(/"/g, '\\"')}" -format "%w" info:`,
  );
  return Number(out);
}

function findFontSize(text: string, targetW: number): number {
  let lo = 40;
  let hi = 600;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    if (measureWidth(text, mid) <= targetW) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Render text (one or two lines, already split) as a transparent PNG sized to
 * exactly fit the widest line at the picked font size.
 */
function renderCaption(
  lines: string[],
  targetW: number,
  outPath: string,
): number {
  // pick the size that makes the widest line fit
  const widestLine = lines.reduce((a, b) => (a.length >= b.length ? a : b));
  const pointsize = findFontSize(widestLine, targetW);
  const stroke = Math.max(4, Math.round(pointsize * STROKE_RATIO));
  const body = lines.join("\n");
  sh(
    `magick -background none -fill "${FILL}" -stroke "${STROKE}" -strokewidth ${stroke} ` +
      `-font "${FONT_PATH}" -pointsize ${pointsize} -gravity center ` +
      `label:"${body.replace(/"/g, '\\"')}" "${outPath}"`,
  );
  return pointsize;
}

function main() {
  const args = process.argv.slice(2);
  const positionIdx = args.indexOf("--position");
  const position =
    positionIdx >= 0 ? (args.splice(positionIdx, 2)[1] as "top" | "bottom") : "top";
  const marginIdx = args.indexOf("--margin");
  // `--margin 12%` or `--margin 250` (px). Default = EDGE_MARGIN_RATIO.
  const marginArg = marginIdx >= 0 ? args.splice(marginIdx, 2)[1] : null;

  const [inputPath, ...textParts] = args;
  const text = textParts.join(" ").toUpperCase();

  if (!inputPath || !text) {
    console.error('Usage: pnpm cover <input-image> "TEXT" [--position top|bottom]');
    process.exit(1);
  }
  if (!existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }
  if (!existsSync(FONT_PATH)) {
    console.error(`Font missing at ${FONT_PATH}`);
    process.exit(1);
  }

  const { w, h } = imageSize(inputPath);
  const textBoxW = Math.round(w * TEXT_WIDTH_RATIO);
  const useTwoLines = text.length > TWO_LINE_THRESHOLD;
  const lines = useTwoLines ? splitTwoLines(text) : [text];

  sh(`mkdir -p "${OUTPUT_DIR}"`);
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const ext = extname(inputPath) || ".jpg";
  const base = basename(inputPath, extname(inputPath));
  const captionPath = join(OUTPUT_DIR, `_caption-${slug}.png`);
  const outPath = join(OUTPUT_DIR, `${base}-${slug}${ext}`);

  console.log(`→ Image: ${w}×${h}`);
  console.log(`→ Text: "${lines.join(" / ")}" (${lines.length} line${lines.length > 1 ? "s" : ""})`);
  console.log("→ Picking font size…");
  const pt = renderCaption(lines, textBoxW, captionPath);
  console.log(`  picked ${pt}pt`);

  const margin = marginArg
    ? marginArg.endsWith("%")
      ? Math.round((h * Number(marginArg.slice(0, -1))) / 100)
      : Number(marginArg)
    : Math.round(h * EDGE_MARGIN_RATIO);
  const gravity = position === "bottom" ? "South" : "North";
  console.log(`→ Compositing at ${position} (margin ${margin}px)…`);
  sh(
    `magick "${inputPath}" "${captionPath}" -gravity ${gravity} -geometry +0+${margin} -composite "${outPath}"`,
  );
  sh(`rm -f "${captionPath}"`);
  console.log(`\n✓ ${outPath}`);
}

main();
