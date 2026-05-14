import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { teacherPayments, teachers } from "@/lib/db/schema"
import { and, eq, gte, lte } from "drizzle-orm"
import { format, startOfMonth, endOfMonth, parseISO, formatISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await requireDashboardSession()
  const params = await searchParams

  const now = new Date()
  const fromDate = params.from ? parseISO(params.from) : startOfMonth(now)
  const toDate = params.to ? parseISO(params.to) : endOfMonth(now)
  const fromIso = formatISO(fromDate)
  const toIso = formatISO(toDate)

  const baseSelect = db
    .select({
      id: teacherPayments.id,
      teacherName: teachers.name,
      periodStart: teacherPayments.periodStart,
      periodEnd: teacherPayments.periodEnd,
      amountCents: teacherPayments.amountCents,
      currency: teacherPayments.currency,
      status: teacherPayments.status,
      paidAt: teacherPayments.paidAt,
    })
    .from(teacherPayments)
    .leftJoin(teachers, eq(teachers.id, teacherPayments.teacherId))

  const teacherFilter =
    session.role === "teacher" && session.teacherId
      ? eq(teacherPayments.teacherId, session.teacherId)
      : undefined

  const rows = await baseSelect
    .where(
      teacherFilter
        ? and(
            teacherFilter,
            gte(teacherPayments.periodStart, fromIso),
            lte(teacherPayments.periodStart, toIso),
          )
        : and(
            gte(teacherPayments.periodStart, fromIso),
            lte(teacherPayments.periodStart, toIso),
          ),
    )
    .orderBy(teacherPayments.periodStart)

  const total = rows.reduce((acc, r) => acc + (r.amountCents ?? 0), 0)
  const totalPaid = rows
    .filter((r) => r.status === "paid")
    .reduce((acc, r) => acc + (r.amountCents ?? 0), 0)
  const totalPending = total - totalPaid

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {session.role === "teacher" ? "My payments" : "Payments"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(fromDate, "MMM dd, yyyy")} → {format(toDate, "MMM dd, yyyy")}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <form className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input
                id="from"
                type="date"
                name="from"
                defaultValue={format(fromDate, "yyyy-MM-dd")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input
                id="to"
                type="date"
                name="to"
                defaultValue={format(toDate, "yyyy-MM-dd")}
              />
            </div>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {Math.round(total / 100).toLocaleString()} THB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {Math.round(totalPaid / 100).toLocaleString()} THB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">
              {Math.round(totalPending / 100).toLocaleString()} THB
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                {session.role !== "teacher" && <TableHead>Teacher</TableHead>}
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid on</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={session.role !== "teacher" ? 5 : 4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No payments in this range.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(r.periodStart), "MMM dd")} →{" "}
                      {format(new Date(r.periodEnd), "MMM dd, yyyy")}
                    </TableCell>
                    {session.role !== "teacher" && (
                      <TableCell>{r.teacherName ?? "—"}</TableCell>
                    )}
                    <TableCell className="text-right whitespace-nowrap">
                      {Math.round((r.amountCents ?? 0) / 100).toLocaleString()}{" "}
                      {r.currency?.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {r.status === "paid" ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.paidAt ? format(new Date(r.paidAt), "MMM dd, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
