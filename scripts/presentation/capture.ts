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

  console.log("→ Emails composer")
  await page.goto(`${BASE}/dashboard/emails`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1200)
  await shoot(page, "13-emails")

  // ─── Last 24h features ────────────────────────────────────────

  console.log("→ Finance overview")
  await page.goto(`${BASE}/dashboard/finance`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await shoot(page, "14-finance-overview")

  console.log("→ Finance income (with tabs)")
  await page.goto(`${BASE}/dashboard/finance/income`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await shoot(page, "15-finance-income")

  console.log("→ Finance expenses (with tabs + employee filter)")
  await page.goto(`${BASE}/dashboard/finance/expenses`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await shoot(page, "16-finance-expenses")

  console.log("→ Expense categories")
  await page.goto(`${BASE}/dashboard/finance/categories`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "17-expense-categories")

  console.log("→ PDF reports hub")
  await page.goto(`${BASE}/dashboard/finance/reports`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  await shoot(page, "18-pdf-reports")

  console.log("→ Membership plans")
  await page.goto(`${BASE}/dashboard/memberships`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await shoot(page, "19-memberships")

  console.log("→ Per-student membership history dialog")
  await page.goto(`${BASE}/dashboard/students`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(800)
  // Click the first "plans" badge
  const plansBadge = page.locator("button:has-text('plans'), button:has-text('plan')").first()
  if (await plansBadge.count()) {
    await plansBadge.click()
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(500)
    await shoot(page, "20-student-memberships")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }

  console.log("→ Students with avatars + flag nationality")
  await shoot(page, "21-students-avatars")

  console.log("→ Restaurant POS")
  await page.goto(`${BASE}/dashboard/restaurant`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await shoot(page, "22-restaurant-pos")

  console.log("→ Command palette (⌘K search)")
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(600)
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K")
  await page.waitForTimeout(600)
  await shoot(page, "23-command-palette")
  await page.keyboard.press("Escape")

  console.log("→ Dark mode showcase")
  // Toggle theme by clicking the theme button in header
  const themeBtn = page.locator('button[aria-label*="theme" i], button:has(svg.lucide-moon), button:has(svg.lucide-sun)').first()
  if (await themeBtn.count()) {
    await themeBtn.click()
    await page.waitForTimeout(700)
    await shoot(page, "24-dark-mode")
  }

  await browser.close()
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`)
}

capture().catch((err) => {
  console.error(err)
  process.exit(1)
})
