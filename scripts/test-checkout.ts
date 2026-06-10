/**
 * E2E test: subscribe to the monthly plan through real Stripe hosted Checkout
 * (test mode). Logs in, creates a checkout session via the app's API, fills
 * the 4242 test card, and waits for the success redirect.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-checkout.ts [priceId]
 */
import { chromium } from "playwright"

const BASE = "http://localhost:3000"
const EMAIL = "felipe.muner@gmail.com"
const PASSWORD = "test123"
const PRICE_ID =
  process.argv[2] ?? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  console.log("→ logging in…")
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15000,
  })
  console.log(`  logged in, landed on ${page.url()}`)

  console.log(`→ creating checkout session for ${PRICE_ID}…`)
  const checkoutUrl = await page.evaluate(async (priceId) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(data))
    return data.url as string
  }, PRICE_ID)
  console.log(`  checkout url: ${checkoutUrl.slice(0, 60)}…`)

  console.log("→ filling Stripe Checkout with test card…")
  await page.goto(checkoutUrl)
  await page.waitForSelector("#cardNumber", { timeout: 30000 })
  await page.fill("#cardNumber", "4242 4242 4242 4242")
  await page.fill("#cardExpiry", "12 / 34")
  await page.fill("#cardCvc", "123")
  await page.fill("#billingName", "Felipe Muner")
  const country = page.locator("#billingCountry")
  if (await country.count()) await country.selectOption("BR")
  const postal = page.locator("#billingPostalCode")
  if ((await postal.count()) && (await postal.isVisible()))
    await postal.fill("84000-000")

  await page.click('button[type="submit"].SubmitButton, .SubmitButton')
  console.log("→ submitted, waiting for redirect…")
  await page.waitForURL(`${BASE}/videos?checkout=success`, { timeout: 60000 })
  console.log("✓ PAYMENT COMPLETE — redirected to /videos?checkout=success")

  await browser.close()
}

main().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
