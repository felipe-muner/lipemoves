// Maps subscriptions (Stripe-driven and manual/offline) to the LipeMoves plan model.

export type PlanKey = "monthly" | "annual" | "one_to_one" | "unknown"

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID

export function planFromPriceId(priceId: string | null | undefined): PlanKey {
  if (!priceId) return "unknown"
  if (priceId === MONTHLY_PRICE_ID) return "monthly"
  if (priceId === ANNUAL_PRICE_ID) return "annual"
  return "unknown"
}

/** Resolve the plan for any subscription row (Stripe or manual). */
export function planForSub(sub: {
  source?: string | null
  stripePriceId?: string | null
  plan?: string | null
}): PlanKey {
  if (sub.source === "manual") {
    if (sub.plan === "one_to_one") return "one_to_one"
    if (sub.plan === "monthly") return "monthly"
    if (sub.plan === "annual") return "annual"
    return "unknown"
  }
  return planFromPriceId(sub.stripePriceId)
}

export const PLAN_LABEL: Record<PlanKey, string> = {
  monthly: "Monthly",
  annual: "Annual",
  one_to_one: "1×1 Coaching",
  unknown: "—",
}

export const PAID_PRICE_IDS = [MONTHLY_PRICE_ID, ANNUAL_PRICE_ID].filter(
  (id): id is string => Boolean(id),
)
