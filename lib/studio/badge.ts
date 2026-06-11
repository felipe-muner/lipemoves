/**
 * Renders the "✅ 1/5" enumerate badge as a full-frame transparent PNG
 * (1080x1920) so ffmpeg can overlay it at 0:0, exactly like label-video.sh
 * does for text. Headless Chromium gives us proper color-emoji rendering,
 * which ffmpeg drawtext / ImageMagick can't do.
 */
import { chromium, type Browser } from "playwright"

const FRAME_W = 1080
const FRAME_H = 1920

/** The badge text is user-edited — keep it text, not markup. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function badgeHtml(text: string, x: number, y: number, size: number): string {
  // size is a fraction of the frame width; pill metrics are in em so padding
  // and radius scale with the font (22px/40px/28px at the original 72px).
  const fontPx = Math.round(size * FRAME_W)
  return `<!doctype html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { width: ${FRAME_W}px; height: ${FRAME_H}px; background: transparent; overflow: hidden; }
  .badge {
    position: absolute;
    left: ${(x * 100).toFixed(2)}%;
    top: ${(y * 100).toFixed(2)}%;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    padding: 0.306em 0.556em;
    border-radius: 0.389em;
    background: rgba(232, 232, 232, 0.62);
    color: #161616;
    font-family: -apple-system, "SF Pro Display", "Segoe UI", sans-serif;
    font-size: ${fontPx}px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
  }
</style></head>
<body><div class="badge">${escapeHtml(text)}</div></body></html>`
}

export async function withBadgeRenderer<T>(
  fn: (
    render: (
      text: string,
      outPath: string,
      x: number,
      y: number,
      size: number,
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
    ) => {
      await page.setContent(badgeHtml(text, x, y, size))
      await page.screenshot({ path: outPath, omitBackground: true })
    }
    return await fn(render)
  } finally {
    await browser?.close()
  }
}
