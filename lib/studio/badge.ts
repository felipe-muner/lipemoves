/**
 * Renders the "✅ 1/5" enumerate badge as a full-frame transparent PNG
 * (1080x1920) so ffmpeg can overlay it at 0:0, exactly like label-video.sh
 * does for text. Headless Chromium gives us proper color-emoji rendering,
 * which ffmpeg drawtext / ImageMagick can't do.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { chromium, type Browser } from "playwright"
import {
  badgeClass,
  badgeStyleCss,
  outfitFontFace,
  type BadgeStyle,
} from "./badge-style"

const FRAME_W = 1080
const FRAME_H = 1920

// Inline the Outfit TTF as a data URI so the headless burn uses the exact same
// font the studio preview does (the preview loads /fonts/Outfit-600.ttf). Read
// once at module load. The grunge style relies on it; the pill is system fonts.
const OUTFIT_FONT_FACE = (() => {
  try {
    const ttf = readFileSync(
      path.join(process.cwd(), "assets/fonts/Outfit-600.ttf"),
    )
    return outfitFontFace(`data:font/ttf;base64,${ttf.toString("base64")}`)
  } catch {
    return "" // fall back to the CSS stack (var/system) if the file is missing
  }
})()

/** The badge text is user-edited — keep it text, not markup. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
/** Same, plus quotes — for the data-text attribute the grunge style reads. */
const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, "&quot;")

function badgeHtml(
  text: string,
  x: number,
  y: number,
  size: number,
  style: BadgeStyle,
  opacity: number,
): string {
  // size is a fraction of the frame width; pill metrics are in em so padding
  // and radius scale with the font. The badge classes (look) come from the
  // shared badge-style.ts so the burn matches the studio preview exactly;
  // only placement + size are set inline here.
  const fontPx = Math.round(size * FRAME_W)
  return `<!doctype html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { width: ${FRAME_W}px; height: ${FRAME_H}px; background: transparent; overflow: hidden; }
  ${OUTFIT_FONT_FACE}
  ${badgeStyleCss()}
  .badge {
    position: absolute;
    left: ${(x * 100).toFixed(2)}%;
    top: ${(y * 100).toFixed(2)}%;
    transform: translate(-50%, -50%);
    font-size: ${fontPx}px;
    opacity: ${opacity};
  }
</style></head>
<body><div class="badge ${badgeClass(style)}" data-text="${escapeAttr(text)}">${escapeHtml(text)}</div></body></html>`
}

export async function withBadgeRenderer<T>(
  fn: (
    render: (
      text: string,
      outPath: string,
      x: number,
      y: number,
      size: number,
      style: BadgeStyle,
      opacity: number,
    ) => Promise<void>,
  ) => Promise<T>,
): Promise<T> {
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: FRAME_W, height: FRAME_H },
    })
    const render = async (
      text: string,
      outPath: string,
      x: number,
      y: number,
      size: number,
      style: BadgeStyle,
      opacity: number,
    ) => {
      await page.setContent(badgeHtml(text, x, y, size, style, opacity))
      // Make sure the Outfit face is parsed before we snapshot (font-display:
      // block holds the text invisible until then, so this avoids a blank/
      // fallback-font badge).
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: outPath, omitBackground: true })
    }
    return await fn(render)
  } finally {
    await browser?.close()
  }
}
