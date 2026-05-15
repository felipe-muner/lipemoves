import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import { manualExpenses, teacherPayouts } from "@/lib/finance/queries"
import { ensureDefaultExpenseCategories } from "@/lib/actions/expense-categories"
import { PrintFrame } from "../_print-frame"

export const dynamic = "force-dynamic"

export default async function ExpenseReport({
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

  const [manual, payouts] = await Promise.all([
    manualExpenses({ from, to }),
    teacherPayouts({ from, to }),
  ])

  const byCategory = new Map<
    string,
    { name: string; color: string; total: number; count: number }
  >()
  for (const m of manual) {
    const cur =
      byCategory.get(m.categorySlug) ??
      {
        name: m.categoryName,
        color: m.categoryColor,
        total: 0,
        count: 0,
      }
    cur.total += m.amountThb
    cur.count += 1
    byCategory.set(m.categorySlug, cur)
  }
  const payoutsTotal = payouts.reduce((a, b) => a + b.payoutThb, 0)
  if (payoutsTotal > 0) {
    byCategory.set("teacher_payouts", {
      name: "Teacher payouts",
      color: "#0f766e",
      total: payoutsTotal,
      count: payouts.length,
    })
  }
  const categoryRows = Array.from(byCategory.entries()).sort(
    (a, b) => b[1].total - a[1].total,
  )
  const manualTotal = manual.reduce((a, b) => a + b.amountThb, 0)
  const grandTotal = manualTotal + payoutsTotal

  const meta = `${format(from, "MMM dd, yyyy")} → ${format(to, "MMM dd, yyyy")}`

  return (
    <PrintFrame title="Expense report" meta={meta}>
      <h1>Expense report</h1>
      <p style={{ color: "#64748b", margin: "4px 0 24px", fontSize: 13 }}>
        {meta} · Generated {format(new Date(), "MMM dd, yyyy HH:mm")}
      </p>

      <h2>By category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th className="num">Items</th>
            <th className="num">Amount</th>
            <th className="num">Share</th>
          </tr>
        </thead>
        <tbody>
          {categoryRows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                No expenses in this period.
              </td>
            </tr>
          ) : (
            categoryRows.map(([key, c]) => {
              const pct =
                grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0
              return (
                <tr key={key}>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: c.color,
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {c.name}
                  </td>
                  <td className="num">{c.count}</td>
                  <td className="num">{c.total.toLocaleString()} ฿</td>
                  <td className="num">{pct}%</td>
                </tr>
              )
            })
          )}
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td className="num">{manual.length + payouts.length}</td>
            <td className="num">
              <strong>{grandTotal.toLocaleString()} ฿</strong>
            </td>
            <td className="num">100%</td>
          </tr>
        </tbody>
      </table>

      <h2>Manual expenses ({manual.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Description</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {manual.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>
                No manual expenses recorded.
              </td>
            </tr>
          ) : (
            manual.map((e) => (
              <tr key={e.id}>
                <td>{format(parseISO(e.incurredOn), "MMM dd, yyyy")}</td>
                <td>{e.categoryName}</td>
                <td>{e.vendor ?? "—"}</td>
                <td>{e.description ?? "—"}</td>
                <td className="num">{e.amountThb.toLocaleString()} ฿</td>
              </tr>
            ))
          )}
          <tr>
            <td colSpan={4}>
              <strong>Subtotal</strong>
            </td>
            <td className="num">
              <strong>{manualTotal.toLocaleString()} ฿</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {payouts.length > 0 && (
        <>
          <h2>Teacher payouts ({payouts.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Paid</th>
                <th>Class</th>
                <th>Teacher</th>
                <th className="num">Attendees</th>
                <th className="num">Payout</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.paidAt ? format(parseISO(p.paidAt), "MMM dd, yyyy") : "—"}</td>
                  <td>{p.className}</td>
                  <td>{p.teacherName ?? "—"}</td>
                  <td className="num">{p.attendeeCount}</td>
                  <td className="num">{p.payoutThb.toLocaleString()} ฿</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <strong>Subtotal</strong>
                </td>
                <td className="num">
                  <strong>{payoutsTotal.toLocaleString()} ฿</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </PrintFrame>
  )
}
