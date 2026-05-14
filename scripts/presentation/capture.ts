/**
 * Auto-capture screenshots of every CRM page (and key dialogs) for the
 * Remotion presentation. Logs in as admin via credentials.
 *
 * Run with the dev server already running on http://localhost:3000:
 *   pnpm dev    (in one terminal)
 *   pnpm tsx scripts/presentation/capture.ts    (in another)
 */

import { chromium, type Page } from "playwright"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const ADMIN_EMAIL = "felipe.muner@gmail.com"
const ADMIN_PASSWORD = "test123"

const OUT_DIR = path.resolve(process.cwd(), "public/presentation")

async function shoot(page: Page, name: string) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  ✓ ${name}.png`)
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState("networkidle")
  await shoot(page, "01-login")

  await page.fill('input#email', ADMIN_EMAIL)
  await page.fill('input#password', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  // Login may redirect anywhere (videos or dashboard) — wait for it to leave /login then go to dashboard manually.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 })
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState("networkidle")
}

async function capture() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  console.log("→ Login")
  await login(page)

  console.log("→ Overview")
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "02-overview")

  console.log("→ Classes calendar")
  await page.goto(`${BASE}/dashboard/classes`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "03-classes-calendar")

  console.log("→ New class dialog (click empty cell)")
  // Click an empty cell — pick a Wednesday 10:00 row by aria-less heuristic:
  // the calendar grid renders 14 rows × 7 columns of buttons. Click first row's 3rd button.
  const emptyCell = page.locator('button.group').nth(2) // arbitrary empty-ish cell
  if (await emptyCell.count()) {
    await emptyCell.click()
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(400)
    await shoot(page, "04-new-class-dialog")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }

  console.log("→ Import dialog")
  const importBtn = page.getByRole("button", { name: /Import/i })
  if (await importBtn.count()) {
    await importBtn.first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(400)
    await shoot(page, "05-import-dialog")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }

  console.log("→ Copy week dialog")
  const copyBtn = page.getByRole("button", { name: /Copy week/i })
  if (await copyBtn.count()) {
    await copyBtn.first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(400)
    await shoot(page, "06-copy-week-dialog")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }

  console.log("→ Classes list view")
  const listTab = page.getByRole("tab", { name: /List/i })
  if (await listTab.count()) {
    await listTab.click()
    await page.waitForTimeout(500)
    await shoot(page, "07-classes-list")
  }

  console.log("→ Teachers")
  await page.goto(`${BASE}/dashboard/teachers`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "08-teachers")

  console.log("→ New teacher dialog")
  const newTeacherBtn = page.getByRole("button", { name: /New teacher/i })
  if (await newTeacherBtn.count()) {
    await newTeacherBtn.first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(400)
    await shoot(page, "09-teacher-dialog")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }

  console.log("→ Students")
  await page.goto(`${BASE}/dashboard/students`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "10-students")

  console.log("→ Payments")
  await page.goto(`${BASE}/dashboard/payments`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "11-payments")

  console.log("→ Account")
  await page.goto(`${BASE}/dashboard/account`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "12-account")

  await browser.close()
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`)
}

capture().catch((err) => {
  console.error(err)
  process.exit(1)
})
