/**
 * Export Move Better as PDF for every language.
 *
 * Usage:
 *   1. Start the dev server: pnpm dev (or npm run dev)
 *   2. In another terminal: npx tsx scripts/export-ebook-pdfs.ts
 *
 * Writes to /public/ebooks/move-better-<lang>.pdf.
 */
import { chromium } from "playwright"
import { mkdir, writeFile, stat } from "node:fs/promises"
import { join } from "node:path"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const LANGS = ["en", "pt", "de", "he", "ru"] as const
const OUT_DIR = join(process.cwd(), "public", "ebooks")
const SLUG = "move-better"

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext()

  for (const lang of LANGS) {
    const url = `${BASE}/ebook/${SLUG}/read/${lang}`
    const out = join(OUT_DIR, `${SLUG}-${lang}.pdf`)
    process.stdout.write(`→ ${lang.padEnd(3)} ${url}\n`)

    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 })
    // Wait an extra beat for images to settle
    await page.waitForTimeout(800)

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    await writeFile(out, pdf)
    const { size } = await stat(out)
    process.stdout.write(
      `  ✓ ${(size / 1024 / 1024).toFixed(1)} MB → ${out}\n`,
    )
    await page.close()
  }

  await browser.close()
  process.stdout.write("Done.\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
