import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import { teacherPayouts } from "@/lib/finance/queries"
import { PrintFrame } from "../_print-frame"

export const dynamic = "force-dynamic"

export default async function TeacherPayoutsReport({
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

  const rows = await teacherPayouts({ from, to })

  type TeacherGroup = {
    teacherId: string
    teacherName: string
    classes: typeof rows
    payoutTotal: number
    attendeeTotal: number
  }
  const byTeacher = new Map<string, TeacherGroup>()
  for (const r of rows) {
    if (!r.teacherId) continue
    const g =
      byTeacher.get(r.teacherId) ??
      {
        teacherId: r.teacherId,
        teacherName: r.teacherName ?? "—",
        classes: [] as typeof rows,
        payoutTotal: 0,
        attendeeTotal: 0,
      }
    g.classes.push(r)
    g.payoutTotal += r.payoutThb
    g.attendeeTotal += r.attendeeCount
    byTeacher.set(r.teacherId, g)
  }
  const groups = Array.from(byTeacher.values()).sort(
    (a, b) => b.payoutTotal - a.payoutTotal,
  )

  const meta = `${format(from, "MMM dd, yyyy")} → ${format(to, "MMM dd, yyyy")}`

  return (
    <PrintFrame title="Teacher payout statements" meta={meta}>
      <h1>Teacher payout statements</h1>
      <p style={{ color: "#64748b", margin: "4px 0 24px", fontSize: 13 }}>
        {meta} · Generated {format(new Date(), "MMM dd, yyyy HH:mm")} · Cash
        basis (paidAt within range)
      </p>

      {groups.length === 0 ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>
          No teacher payouts marked paid in this range.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.teacherId} style={{ pageBreakInside: "avoid" }}>
            <h2>{g.teacherName}</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th className="num">Attendees</th>
                  <th className="num">Price</th>
                  <th className="num">Share</th>
                  <th className="num">Payout</th>
                </tr>
              </thead>
              <tbody>
                {g.classes.map((c) => (
                  <tr key={c.id}>
                    <td>{format(parseISO(c.scheduledAt), "MMM dd, HH:mm")}</td>
                    <td>{c.className}</td>
                    <td className="num">{c.attendeeCount}</td>
                    <td className="num">{c.priceThb.toLocaleString()} ฿</td>
                    <td className="num">{c.sharePercent}%</td>
                    <td className="num">{c.payoutThb.toLocaleString()} ฿</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}>
                    <strong>Total</strong>
                  </td>
                  <td className="num">
                    <strong>{g.attendeeTotal}</strong>
                  </td>
                  <td colSpan={2}></td>
                  <td className="num">
                    <strong>{g.payoutTotal.toLocaleString()} ฿</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ))
      )}
    </PrintFrame>
  )
}
