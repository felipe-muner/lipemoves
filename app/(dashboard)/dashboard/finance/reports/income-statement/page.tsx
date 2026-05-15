import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import {
  restaurantDailyTotals,
  membershipPurchases,
  dropInPayments,
} from "@/lib/finance/queries"
import { PrintFrame } from "../_print-frame"

export const dynamic = "force-dynamic"

export default async function IncomeStatementReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const params = await searchParams
  const now = new Date()
  const from = params.from ? parseISO(params.from) : startOfMonth(now)
  const to = params.to ? endOfDay(parseISO(params.to)) : endOfMonth(now)

  const [restaurant, memberships, dropIns] = await Promise.all([
    restaurantDailyTotals({ from, to }),
    membershipPurchases({ from, to }),
    dropInPayments({ from, to }),
  ])

  const restaurantTotal = restaurant.reduce((a, b) => a + b.totalThb, 0)
  const membershipsTotal = memberships.reduce((a, b) => a + b.amountThb, 0)
  const dropInTotal = dropIns.reduce((a, b) => a + b.amountThb, 0)
  const grandTotal = restaurantTotal + membershipsTotal + dropInTotal

  const meta = `${format(from, "MMM dd, yyyy")} → ${format(to, "MMM dd, yyyy")}`

  return (
    <PrintFrame title="Detailed income statement" meta={meta}>
      <h1>Detailed income statement</h1>
      <p style={{ color: "#64748b", margin: "4px 0 24px", fontSize: 13 }}>
        {meta} · Generated {format(new Date(), "MMM dd, yyyy HH:mm")}
      </p>

      <h2>Restaurant — daily totals</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th className="num">Sales</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {restaurant.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", color: "#64748b" }}>
                No restaurant sales.
              </td>
            </tr>
          ) : (
            restaurant.map((r) => (
              <tr key={r.day}>
                <td>{format(parseISO(r.day), "EEE, MMM dd, yyyy")}</td>
                <td className="num">{r.salesCount}</td>
                <td className="num">{r.totalThb.toLocaleString()} ฿</td>
              </tr>
            ))
          )}
          <tr>
            <td>
              <strong>Subtotal</strong>
            </td>
            <td></td>
            <td className="num">
              <strong>{restaurantTotal.toLocaleString()} ฿</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Memberships</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Type</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {memberships.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                No memberships purchased.
              </td>
            </tr>
          ) : (
            memberships.map((m) => (
              <tr key={m.id}>
                <td>{format(parseISO(m.date), "MMM dd, yyyy")}</td>
                <td>{m.studentEmail}</td>
                <td style={{ textTransform: "capitalize" }}>{m.type}</td>
                <td className="num">{m.amountThb.toLocaleString()} ฿</td>
              </tr>
            ))
          )}
          <tr>
            <td colSpan={3}>
              <strong>Subtotal</strong>
            </td>
            <td className="num">
              <strong>{membershipsTotal.toLocaleString()} ฿</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Drop-in payments</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Class</th>
            <th>Student</th>
            <th>Method</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {dropIns.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>
                No drop-in payments.
              </td>
            </tr>
          ) : (
            dropIns.map((d) => (
              <tr key={d.id}>
                <td>{format(parseISO(d.date), "MMM dd, yyyy")}</td>
                <td>{d.className ?? "—"}</td>
                <td>{d.studentEmail}</td>
                <td style={{ textTransform: "capitalize" }}>
                  {d.paymentMethod ?? "—"}
                </td>
                <td className="num">{d.amountThb.toLocaleString()} ฿</td>
              </tr>
            ))
          )}
          <tr>
            <td colSpan={4}>
              <strong>Subtotal</strong>
            </td>
            <td className="num">
              <strong>{dropInTotal.toLocaleString()} ฿</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Grand total</h2>
      <table>
        <tbody>
          <tr>
            <th style={{ width: "60%" }}>Total income</th>
            <td className="num" style={{ fontWeight: 700, color: "#059669" }}>
              {grandTotal.toLocaleString()} ฿
            </td>
          </tr>
        </tbody>
      </table>
    </PrintFrame>
  )
}
