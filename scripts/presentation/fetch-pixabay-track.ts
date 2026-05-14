/**
 * Headless-browser search for a Pixabay track and download the mp3.
 * Pixabay's CDN blocks raw `curl` (403). Playwright works because it
 * runs in a real Chromium with cookies + headers.
 *
 * Usage:
 *   pnpm tsx scripts/presentation/fetch-pixabay-track.ts "gonna freak youval ziso" public/presentation/music/library/06-gonna-freak.mp3
 */

import { chromium, type Page } from "playwright"
import { writeFile } from "node:fs/promises"

const QUERY = process.argv[2]
const OUT = process.argv[3]

if (!QUERY || !OUT) {
  console.error("Usage: fetch-pixabay-track.ts <query> <output-path>")
  process.exit(1)
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  })
  const page = await ctx.newPage()

  const searchUrl = `https://pixabay.com/music/search/${encodeURIComponent(QUERY)}/`
  console.log(`→ ${searchUrl}`)
  await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 })
  // Trigger lazy-loaded audio by hovering / clicking the first result's play button.
  try {
    const playBtn = await page.$('button[aria-label*="lay" i], button[title*="lay" i]')
    if (playBtn) await playBtn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(1500)
  } catch {
    /* ignore */
  }

  const audioUrl = await page.evaluate(() => {
    const a = document.querySelector("audio")
    if (a && a.src) return a.src
    const s = document.querySelector("audio source") as HTMLSourceElement | null
    if (s && s.src) return s.src
    // Some pages have data-href or similar attributes
    const dataEl = document.querySelector("[data-track-mp3], [data-mp3]")
    if (dataEl) {
      return (
        dataEl.getAttribute("data-track-mp3") ||
        dataEl.getAttribute("data-mp3") ||
        null
      )
    }
    return null
  })

  if (!audioUrl) {
    // Fallback: grep page HTML for any cdn.pixabay.com/audio/...mp3 URL
    const html = await page.content()
    const match = html.match(/cdn\.pixabay\.com\/audio\/[^"'\s)]+\.mp3/)
    if (match) {
      const url = `https://${match[0]}`
      console.log(`  Found via regex: ${url}`)
      await downloadAudio(page, url)
      await browser.close()
      return
    }
    console.error("No audio URL found on the page.")
    await browser.close()
    process.exit(2)
  }

  console.log(`  Found: ${audioUrl}`)
  await downloadAudio(page, audioUrl)
  await browser.close()
}

async function downloadAudio(page: Page, url: string) {
  const buf = await page.evaluate(async (u: string) => {
    const res = await fetch(u, { credentials: "include" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ab = await res.arrayBuffer()
    return Array.from(new Uint8Array(ab))
  }, url)
  await writeFile(OUT, Buffer.from(buf))
  console.log(`  Saved ${buf.length} bytes → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
