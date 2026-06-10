/**
 * E2E test: a logged-in member can actually play the Bunny-hosted video.
 * Loads /videos/<slug>, waits for hls.js to buffer real media data.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-video-playback.ts [slug]
 */
import { chromium } from "playwright"

const BASE = "http://localhost:3000"
const EMAIL = "felipe.muner@gmail.com"
const PASSWORD = "test123"
const SLUG = process.argv[2] ?? "flow-01"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15000,
  })

  console.log(`→ opening /videos/${SLUG}…`)
  await page.goto(`${BASE}/videos/${SLUG}`)
  await page.waitForSelector("video", { timeout: 15000 })

  await page.evaluate(() => {
    const v = document.querySelector("video")!
    v.muted = true
    return v.play()
  })

  // readyState >= 3 means enough data buffered to actually play.
  await page.waitForFunction(
    () => {
      const v = document.querySelector("video")
      return v && v.readyState >= 3 && v.currentTime > 0
    },
    { timeout: 30000 }
  )

  const stats = await page.evaluate(() => {
    const v = document.querySelector("video")!
    return {
      readyState: v.readyState,
      currentTime: v.currentTime,
      duration: v.duration,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
    }
  })
  console.log("✓ VIDEO IS PLAYING:", JSON.stringify(stats))

  await browser.close()
}

main().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
