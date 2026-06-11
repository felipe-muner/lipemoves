/**
 * Renders the "✅ 1/5" enumerate badge as a full-frame transparent PNG
 * (1080x1920) so ffmpeg can overlay it at 0:0, exactly like label-video.sh
 * does for text. Headless Chromium gives us proper color-emoji rendering,
 * which ffmpeg drawtext / ImageMagick can't do.
 */
import { chromium, type Browser } from "playwright"

const FRAME_W = 1080
const FRAME_H = 1920

function badgeHtml(text: string): string {
  return `<!doctype html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { width: ${FRAME_W}px; height: ${FRAME_H}px; background: transparent; }
  .badge {
    position: absolute;
    left: 72px;
    bottom: 280px;
    display: inline-flex;
    align-items: center;
    gap: 16px;
    padding: 22px 40px;
    border-radius: 28px;
    background: rgba(232, 232, 232, 0.62);
    color: #161616;
    font-family: -apple-system, "SF Pro Display", "Segoe UI", sans-serif;
    font-size: 72px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
  }
</style></head>
<body><div class="badge">${text}</div></body></html>`
}

export async function withBadgeRenderer<T>(
  fn: (render: (text: string, outPath: string) => Promise<void>) => Promise<T>,
): Promise<T> {
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: FRAME_W, height: FRAME_H },
    })
    const render = async (text: string, outPath: string) => {
      await page.setContent(badgeHtml(text))
      await page.screenshot({ path: outPath, omitBackground: true })
    }
    return await fn(render)
  } finally {
    await browser?.close()
  }
}
