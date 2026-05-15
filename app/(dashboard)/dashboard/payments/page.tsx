import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, employees, classAttendance } from "@/lib/db/schema"
import { and, eq, gte, lte, isNotNull, isNull, sql } from "drizzle-orm"
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
import { Badge } from "@/components/ui/badge"
import { Money } from "@/components/crm/money"
import {
  markClassesPaid,
  markTeacherUnpaidPaid,
  unmarkClassPaid,
} from "./actions"
import { StatusSelect } from "./status-select"

export const dynamic = "force-dynamic"

type StatusFilter = "unpaid" | "paid" | "all"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: StatusFilter }>
}) {
  const session = await requireDashboardSession()
  const params = await searchParams

  const now = new Date()
  const fromDate = params.from ? parseISO(params.from) : startOfMonth(now)
  const toDate = params.to ? parseISO(params.to) : endOfMonth(now)
  const fromIso = formatISO(fromDate)
  const toIso = formatISO(toDate)
  const status: StatusFilter = params.status ?? "unpaid"

  const baseFilters = [
    gte(yogaClasses.scheduledAt, fromIso),
    lte(yogaClasses.scheduledAt, toIso),
    isNotNull(yogaClasses.employeeId),
  ]
  if (status === "unpaid") baseFilters.push(isNull(yogaClasses.paidAt))
  if (status === "paid") baseFilters.push(isNotNull(yogaClasses.paidAt))

  const whereClause =
    session.role === "teacher" && session.teacherId
      ? and(...baseFilters, eq(yogaClasses.employeeId, session.teacherId))
      : and(...baseFilters)

  const attendeesSub = db
    .select({
      classId: classAttendance.classId,
      n: sql<number>`count(*)::int`.as("n"),
    })
    .from(classAttendance)
    .groupBy(classAttendance.classId)
    .as("attendees")

  const classes = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      scheduledAt: yogaClasses.scheduledAt,
      priceThb: yogaClasses.priceThb,
      teacherSharePercent: yogaClasses.teacherSharePercent,
      teacherId: yogaClasses.employeeId,
      teacherName: employees.name,
      paidAt: yogaClasses.paidAt,
      attendeeCount: sql<number>`coalesce(${attendeesSub.n}, 0)`,
    })
    .from(yogaClasses)
    .leftJoin(employees, eq(employees.id, yogaClasses.employeeId))
    .leftJoin(attendeesSub, eq(attendeesSub.classId, yogaClasses.id))
    .where(whereClause)
    .orderBy(yogaClasses.scheduledAt)

  type Summary = {
    teacherId: string
    teacherName: string
    classCount: number
    attendeeTotal: number
    grossThb: number
    payoutThb: number
    unpaidPayoutThb: number
    unpaidClassCount: number
  }
  const byTeacher = new Map<string, Summary>()
  let grandGross = 0
  let grandPayout = 0
  let grandUnpaidPayout = 0
  let grandAttendees = 0

  for (const c of classes) {
    if (!c.teacherId) continue
    const attendees = Number(c.attendeeCount ?? 0)
    const gross = attendees * c.priceThb
    const payout = Math.round((gross * c.teacherSharePercent) / 100)

    grandGross += gross
    grandPayout += payout
    grandAttendees += attendees
    if (!c.paidAt) grandUnpaidPayout += payout

    const existing = byTeacher.get(c.teacherId) ?? {
      teacherId: c.teacherId,
      teacherName: c.teacherName ?? "—",
      classCount: 0,
      attendeeTotal: 0,
      grossThb: 0,
      payoutThb: 0,
      unpaidPayoutThb: 0,
      unpaidClassCount: 0,
    }
    existing.classCount += 1
    existing.attendeeTotal += attendees
    existing.grossThb += gross
    existing.payoutThb += payout
    if (!c.paidAt) {
      existing.unpaidPayoutThb += payout
      existing.unpaidClassCount += 1
    }
    byTeacher.set(c.teacherId, existing)
  }

  const summary = Array.from(byTeacher.values()).sort(
    (a, b) => b.unpaidPayoutThb - a.unpaidPayoutThb,
  )

  const isTeacher = session.role === "teacher"
  const canMarkPaid = session.role === "admin" || session.role === "manager"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isTeacher ? "My payments" : "Payroll"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(fromDate, "MMM dd, yyyy")} → {format(toDate, "MMM dd, yyyy")}{" "}
          · payout = attendees × price × share %
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
            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <StatusSelect defaultValue={status} />
            </div>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
              Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{grandAttendees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross
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
              Owed to teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">
              <Money thb={grandUnpaidPayout} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              of <Money thb={grandPayout} /> total payout
            </p>
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
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Total payout</TableHead>
                  <TableHead className="text-right">Unpaid</TableHead>
                  {canMarkPaid && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canMarkPaid ? 7 : 6}
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
                      <TableCell className="text-right">
                        {s.attendeeTotal}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <Money thb={s.grossThb} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money thb={s.payoutThb} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-600">
                        <Money thb={s.unpaidPayoutThb} />
                      </TableCell>
                      {canMarkPaid && (
                        <TableCell className="text-right">
                          {s.unpaidClassCount > 0 ? (
                            <form action={markTeacherUnpaidPaid}>
                              <input
                                type="hidden"
                                name="teacherId"
                                value={s.teacherId}
                              />
                              <input type="hidden" name="from" value={fromIso} />
                              <input type="hidden" name="to" value={toIso} />
                              <Button type="submit" size="sm" variant="outline">
                                Mark {s.unpaidClassCount} paid
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              All paid
                            </span>
                          )}
                        </TableCell>
                      )}
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
          <CardTitle>{classes.length} classes</CardTitle>
        </CardHeader>
        <CardContent>
          {canMarkPaid && (
            <form id="bulkPaidForm" action={markClassesPaid} className="hidden" />
          )}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  {canMarkPaid && <TableHead className="w-8"></TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  {!isTeacher && <TableHead>Teacher</TableHead>}
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead>Status</TableHead>
                  {canMarkPaid && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isTeacher ? 6 : 9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No classes in this date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((c) => {
                    const attendees = Number(c.attendeeCount ?? 0)
                    const gross = attendees * c.priceThb
                    const payout = Math.round(
                      (gross * c.teacherSharePercent) / 100,
                    )
                    const isPaid = !!c.paidAt
                    return (
                      <TableRow key={c.id}>
                        {canMarkPaid && (
                          <TableCell>
                            {!isPaid && (
                              <input
                                type="checkbox"
                                name="classId"
                                value={c.id}
                                form="bulkPaidForm"
                                className="h-4 w-4"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(c.scheduledAt), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        {!isTeacher && (
                          <TableCell>{c.teacherName ?? "—"}</TableCell>
                        )}
                        <TableCell className="text-right">
                          {attendees}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Money thb={c.priceThb} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {c.teacherSharePercent}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <Money thb={payout} />
                        </TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-700"
                            >
                              Paid {format(new Date(c.paidAt!), "MMM dd")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        {canMarkPaid && (
                          <TableCell className="text-right">
                            {isPaid && (
                              <form action={unmarkClassPaid}>
                                <input
                                  type="hidden"
                                  name="classId"
                                  value={c.id}
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs"
                                >
                                  Undo
                                </Button>
                              </form>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {canMarkPaid && classes.some((c) => !c.paidAt) && (
              <div className="mt-4 flex justify-end">
                <Button type="submit" form="bulkPaidForm" variant="outline">
                  Mark selected as paid
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
