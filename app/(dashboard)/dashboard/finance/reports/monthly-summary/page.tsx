import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import { financeSummary } from "@/lib/finance/queries"
import { ensureDefaultExpenseCategories } from "@/lib/actions/expense-categories"
import { PrintFrame } from "../_print-frame"

export const dynamic = "force-dynamic"

export default async function MonthlySummaryReport({
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

  const summary = await financeSummary({ from, to })

  const meta = `${format(from, "MMM dd, yyyy")} → ${format(to, "MMM dd, yyyy")}`

  return (
    <PrintFrame title="Monthly summary" meta={meta}>
      <h1>Monthly summary</h1>
      <p style={{ color: "#64748b", margin: "4px 0 24px", fontSize: 13 }}>
        {meta} · Generated {format(new Date(), "MMM dd, yyyy HH:mm")}
      </p>

      <table>
        <tbody>
          <tr>
            <th style={{ width: "40%" }}>Total income</th>
            <td className="num" style={{ color: "#059669", fontWeight: 600 }}>
              {summary.income.total.toLocaleString()} ฿
            </td>
          </tr>
          <tr>
            <th>Total expenses</th>
            <td className="num" style={{ color: "#dc2626", fontWeight: 600 }}>
              {summary.expenses.total.toLocaleString()} ฿
            </td>
          </tr>
          <tr>
            <th>Net profit</th>
            <td
              className="num"
              style={{
                fontWeight: 700,
                color: summary.net >= 0 ? "#059669" : "#dc2626",
              }}
            >
              {summary.net.toLocaleString()} ฿
            </td>
          </tr>
          <tr>
            <th>Margin</th>
            <td className="num">{summary.margin}%</td>
          </tr>
        </tbody>
      </table>

      <h2>Income breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th className="num">Amount</th>
            <th className="num">Share</th>
          </tr>
        </thead>
        <tbody>
          <IncomeLine
            label="Restaurant"
            amount={summary.income.restaurant}
            total={summary.income.total}
          />
          <IncomeLine
            label="Memberships"
            amount={summary.income.memberships}
            total={summary.income.total}
          />
          <IncomeLine
            label="Drop-in"
            amount={summary.income.dropIn}
            total={summary.income.total}
          />
        </tbody>
      </table>

      <h2>Expense breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th className="num">Amount</th>
            <th className="num">Share</th>
          </tr>
        </thead>
        <tbody>
          {summary.expenses.breakdown.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ color: "#64748b", textAlign: "center" }}>
                No expenses in this period.
              </td>
            </tr>
          ) : (
            summary.expenses.breakdown.map((b) => {
              const pct =
                summary.expenses.total > 0
                  ? Math.round((b.amountThb / summary.expenses.total) * 100)
                  : 0
              return (
                <tr key={b.key}>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: b.color,
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {b.name}
                  </td>
                  <td className="num">{b.amountThb.toLocaleString()} ฿</td>
                  <td className="num">{pct}%</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </PrintFrame>
  )
}

function IncomeLine({
  label,
  amount,
  total,
}: {
  label: string
  amount: number
  total: number
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
  return (
    <tr>
      <td>{label}</td>
      <td className="num">{amount.toLocaleString()} ฿</td>
      <td className="num">{pct}%</td>
    </tr>
  )
}
