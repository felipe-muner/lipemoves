import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  subMonths,
  endOfDay,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Money } from "@/components/crm/money"
import { FinanceFilters } from "@/components/crm/finance-filters"
import { FinanceMonthlyChart } from "@/components/crm/finance-monthly-chart"
import { ensureDefaultExpenseCategories } from "@/lib/actions/expense-categories"
import { financeSummary, monthlySeries } from "@/lib/finance/queries"

export const dynamic = "force-dynamic"

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultExpenseCategories()

  const params = await searchParams
  const now = new Date()
  const from = params.from ? parseISO(params.from) : startOfMonth(now)
  const to = params.to ? endOfDay(parseISO(params.to)) : endOfMonth(now)

  const chartRange = {
    from: startOfMonth(subMonths(now, 5)),
    to: endOfMonth(now),
  }

  const [summary, series] = await Promise.all([
    financeSummary({ from, to }),
    monthlySeries(chartRange),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            {format(from, "MMM dd, yyyy")} → {format(to, "MMM dd, yyyy")} ·
            money in vs money out, at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/income">Income detail</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/expenses">Expenses</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/reports">Reports</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinanceFilters
            defaultFrom={format(from, "yyyy-MM-dd")}
            defaultTo={format(to, "yyyy-MM-dd")}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              <Money thb={summary.income.total} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Restaurant <Money thb={summary.income.restaurant} /> · Memberships{" "}
              <Money thb={summary.income.memberships} /> · Drop-in{" "}
              <Money thb={summary.income.dropIn} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              <Money thb={summary.expenses.total} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Manual <Money thb={summary.expenses.manual} /> · Teacher payouts{" "}
              <Money thb={summary.expenses.payouts} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${summary.net >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              <Money thb={summary.net} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">In − Out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${summary.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {summary.margin}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Net / income</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Not enough data yet.
            </p>
          ) : (
            <FinanceMonthlyChart data={series} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.expenses.breakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No expenses in this range.
              </p>
            ) : (
              <div className="space-y-2">
                {summary.expenses.breakdown.map((b) => {
                  const pct =
                    summary.expenses.total > 0
                      ? Math.round((b.amountThb / summary.expenses.total) * 100)
                      : 0
                  return (
                    <div key={b.key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ background: b.color }}
                          />
                          {b.name}
                        </span>
                        <span className="font-medium">
                          <Money thb={b.amountThb} />{" "}
                          <span className="text-xs text-muted-foreground">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income mix</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.income.total === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No income in this range.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <IncomeRow
                  label="Restaurant"
                  amount={summary.income.restaurant}
                  total={summary.income.total}
                  color="#10b981"
                />
                <IncomeRow
                  label="Memberships"
                  amount={summary.income.memberships}
                  total={summary.income.total}
                  color="#0ea5e9"
                />
                <IncomeRow
                  label="Drop-in"
                  amount={summary.income.dropIn}
                  total={summary.income.total}
                  color="#a855f7"
                />
                <div className="pt-2 text-xs text-muted-foreground">
                  <Link
                    href="/dashboard/finance/income"
                    className="inline-flex items-center hover:underline"
                  >
                    See every transaction
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/expenses">Manage expenses</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/categories">Expense categories</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/payments">Teacher payouts (payroll)</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/reports">PDF reports</Link>
          </Button>
        </CardContent>
      </Card>

      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
        Cash-basis: payouts count as expense on the date marked paid
      </Badge>
    </div>
  )
}

function IncomeRow({
  label,
  amount,
  total,
  color,
}: {
  label: string
  amount: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: color }}
          />
          {label}
        </span>
        <span className="font-medium">
          <Money thb={amount} />{" "}
          <span className="text-xs text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
