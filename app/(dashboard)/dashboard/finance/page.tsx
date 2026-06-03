import { and, count, gte, inArray } from "drizzle-orm"
import { startOfMonth, formatISO, format, parseISO, isAfter } from "date-fns"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { stripe } from "@/lib/stripe"
import { planForSub, PLAN_LABEL, type PlanKey } from "@/lib/stripe/plans"
import { PageHeader } from "@/components/crm/page-header"
import { StatCard } from "@/components/crm/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, Repeat, UserPlus, Coins } from "lucide-react"

export const dynamic = "force-dynamic"

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

async function loadStripePricing() {
  async function get(priceId: string | undefined) {
    if (!priceId) return null
    try {
      const price = await stripe.prices.retrieve(priceId)
      return { unitCents: price.unit_amount ?? 0, currency: price.currency ?? "usd" }
    } catch {
      return null
    }
  }
  const [monthly, annual] = await Promise.all([
    get(MONTHLY_PRICE_ID),
    get(ANNUAL_PRICE_ID),
  ])
  return { monthly, annual }
}

export default async function FinancePage() {
  await requireDashboardSession()
  const monthStartDate = startOfMonth(new Date())
  const monthStart = formatISO(monthStartDate)

  const active = await db
    .select({
      source: subscriptions.source,
      priceId: subscriptions.stripePriceId,
      plan: subscriptions.plan,
      amountCents: subscriptions.amountCents,
      currency: subscriptions.currency,
      billingInterval: subscriptions.billingInterval,
      periodStart: subscriptions.currentPeriodStart,
    })
    .from(subscriptions)
    .where(inArray(subscriptions.status, ["active", "trialing"]))

  const [{ n: newThisMonth } = { n: 0 }] = await db
    .select({ n: count() })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ["active", "trialing"]),
        gte(subscriptions.createdAt, monthStart),
      ),
    )

  const pricing = await loadStripePricing()
  const displayCurrency =
    pricing.monthly?.currency ??
    pricing.annual?.currency ??
    active.find((a) => a.currency)?.currency ??
    "usd"

  // Aggregate MRR (recurring), one-time-this-month, and per-plan stats.
  const stat: Record<PlanKey, { members: number; mrr: number; oneTime: number }> = {
    monthly: { members: 0, mrr: 0, oneTime: 0 },
    annual: { members: 0, mrr: 0, oneTime: 0 },
    one_to_one: { members: 0, mrr: 0, oneTime: 0 },
    unknown: { members: 0, mrr: 0, oneTime: 0 },
  }
  const currencies = new Set<string>()

  for (const s of active) {
    const key = planForSub(s)
    stat[key].members += 1

    if (s.source === "manual") {
      const amt = s.amountCents ?? 0
      if (s.currency) currencies.add(s.currency)
      if (s.billingInterval === "month") stat[key].mrr += amt
      else if (s.billingInterval === "year") stat[key].mrr += Math.round(amt / 12)
      else if (s.billingInterval === "one_time") {
        // Count one-time revenue only if it landed this month.
        if (s.periodStart && !isAfter(monthStartDate, parseISO(s.periodStart))) {
          stat[key].oneTime += amt
        }
      }
    } else {
      // Stripe
      if (key === "monthly" && pricing.monthly) {
        stat[key].mrr += pricing.monthly.unitCents
        currencies.add(pricing.monthly.currency)
      } else if (key === "annual" && pricing.annual) {
        stat[key].mrr += Math.round(pricing.annual.unitCents / 12)
        currencies.add(pricing.annual.currency)
      }
    }
  }

  const mrr = stat.monthly.mrr + stat.annual.mrr + stat.one_to_one.mrr
  const oneTimeThisMonth =
    stat.monthly.oneTime + stat.annual.oneTime + stat.one_to_one.oneTime
  const arr = mrr * 12
  const activeTotal =
    stat.monthly.members + stat.annual.members + stat.one_to_one.members

  const planRows: PlanKey[] = ["monthly", "annual", "one_to_one"]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle={`Revenue from members — ${format(new Date(), "MMMM yyyy")}`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="MRR"
          value={fmt(mrr, displayCurrency)}
          icon={Repeat}
          hint="Monthly recurring revenue"
        />
        <StatCard
          label="ARR"
          value={fmt(arr, displayCurrency)}
          icon={TrendingUp}
          hint="Annualized run-rate"
        />
        <StatCard
          label="One-time (this month)"
          value={fmt(oneTimeThisMonth, displayCurrency)}
          icon={Coins}
          hint="1×1 / one-off payments"
        />
        <StatCard
          label="New this month"
          value={newThisMonth}
          icon={UserPlus}
          hint="Memberships started"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">One-time (mo)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planRows.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{PLAN_LABEL[key]}</TableCell>
                  <TableCell className="text-right">{stat[key].members}</TableCell>
                  <TableCell className="text-right">
                    {fmt(stat[key].mrr, displayCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(stat[key].oneTime, displayCurrency)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  {activeTotal}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(mrr, displayCurrency)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(oneTimeThisMonth, displayCurrency)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currencies.size > 1 ? (
        <p className="text-xs text-muted-foreground">
          ⚠️ Members span multiple currencies ({[...currencies].join(", ").toUpperCase()}).
          Totals are summed as if {displayCurrency.toUpperCase()} — add FX conversion
          later for accuracy.
        </p>
      ) : null}
    </div>
  )
}
