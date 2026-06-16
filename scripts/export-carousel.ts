/**
 * Export an Instagram carousel to PNG slides (4:5, 1080×1350).
 *
 * Usage:
 *   1. Start the dev server: pnpm dev
 *   2. In another terminal: npx tsx scripts/export-carousel.ts [slug]
 *
 * Writes to /public/carousels/<slug>/slide-01.png ...
 * Default slug: longevity.
 */
import { chromium } from "playwright"
import { mkdir, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const SLUG = process.argv[2] || "longevity"
const OUT_DIR = join(process.cwd(), "public", "carousels", SLUG)

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  // deviceScaleFactor 2 → crisp 1080-wide PNGs (rendered at 2160 then sized by IG).
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  const url = `${BASE}/carousel/${SLUG}`
  process.stdout.write(`→ ${url}\n`)
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(800) // let images settle

  const slides = page.locator(".carousel-root .slide")
  const count = await slides.count()
  if (count === 0) throw new Error(`No slides found at ${url}`)

  for (let i = 0; i < count; i++) {
    const n = String(i + 1).padStart(2, "0")
    const out = join(OUT_DIR, `slide-${n}.png`)
    await slides.nth(i).screenshot({ path: out })
    process.stdout.write(`  ✓ slide-${n}.png\n`)
  }

  await browser.close()
  process.stdout.write(`Done. ${count} slides → ${OUT_DIR}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
