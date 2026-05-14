import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, employees } from "@/lib/db/schema"
import { and, eq, gte, lte, isNotNull } from "drizzle-orm"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Money } from "@/components/crm/money"

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

  const baseFilters = [
    gte(yogaClasses.scheduledAt, fromIso),
    lte(yogaClasses.scheduledAt, toIso),
    isNotNull(yogaClasses.employeeId),
  ]
  const whereClause =
    session.role === "teacher" && session.teacherId
      ? and(...baseFilters, eq(yogaClasses.employeeId, session.teacherId))
      : and(...baseFilters)

  const classes = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      scheduledAt: yogaClasses.scheduledAt,
      priceThb: yogaClasses.priceThb,
      teacherSharePercent: yogaClasses.teacherSharePercent,
      teacherId: yogaClasses.employeeId,
      teacherName: employees.name,
    })
    .from(yogaClasses)
    .leftJoin(employees, eq(employees.id, yogaClasses.employeeId))
    .where(whereClause)
    .orderBy(yogaClasses.scheduledAt)

  // Group by teacher for the summary table
  type Summary = {
    teacherId: string
    teacherName: string
    classCount: number
    grossThb: number
    payoutThb: number
  }
  const byTeacher = new Map<string, Summary>()
  let grandGross = 0
  let grandPayout = 0

  for (const c of classes) {
    if (!c.teacherId) continue
    const payout = Math.round((c.priceThb * c.teacherSharePercent) / 100)
    grandGross += c.priceThb
    grandPayout += payout

    const existing = byTeacher.get(c.teacherId) ?? {
      teacherId: c.teacherId,
      teacherName: c.teacherName ?? "—",
      classCount: 0,
      grossThb: 0,
      payoutThb: 0,
    }
    existing.classCount += 1
    existing.grossThb += c.priceThb
    existing.payoutThb += payout
    byTeacher.set(c.teacherId, existing)
  }

  const summary = Array.from(byTeacher.values()).sort(
    (a, b) => b.payoutThb - a.payoutThb,
  )

  const isTeacher = session.role === "teacher"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isTeacher ? "My payments" : "Payments"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(fromDate, "MMM dd, yyyy")} → {format(toDate, "MMM dd, yyyy")}{" "}
          · computed from classes (price × teacher share %)
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
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{classes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              <Money thb={grandGross} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total payout to employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              <Money thb={grandPayout} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Payout by teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No classes in this date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.map((s) => (
                    <TableRow key={s.teacherId}>
                      <TableCell className="font-medium">
                        {s.teacherName}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.classCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <Money thb={s.grossThb} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money thb={s.payoutThb} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{classes.length} classes in range</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                {!isTeacher && <TableHead>Teacher</TableHead>}
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isTeacher ? 5 : 6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No classes in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((c) => {
                  const payout = Math.round(
                    (c.priceThb * c.teacherSharePercent) / 100,
                  )
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(c.scheduledAt), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      {!isTeacher && (
                        <TableCell>{c.teacherName ?? "—"}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <Money thb={c.priceThb} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {c.teacherSharePercent}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money thb={payout} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
