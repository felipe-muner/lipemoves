import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import {
  membershipCheckins,
  membershipPlans,
  studentMemberships,
  students,
} from "@/lib/db/schema"
import { desc, eq, gte, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import { format, parseISO, startOfDay } from "date-fns"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EntityAvatar } from "@/components/crm/entity-avatar"
import { CheckinPanel } from "@/components/crm/checkin-panel"
import { StatCard } from "@/components/crm/stat-card"
import { LogIn, Users } from "lucide-react"
import { StudentMembershipsCell } from "@/components/crm/student-memberships-cell"
import { ensureDefaultMembershipPlans } from "@/lib/actions/membership-plans"
import { loadStudentMembershipsData } from "@/lib/db/queries/student-memberships"

export const dynamic = "force-dynamic"

export default async function CheckinPage() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  await ensureDefaultMembershipPlans()

  const studentList = await db
    .select({
      email: students.email,
      name: students.name,
      passport: students.passport,
    })
    .from(students)
    .orderBy(students.name)

  const items = studentList.map((s) => ({
    id: s.email,
    label: s.name,
    description: [s.email, s.passport].filter(Boolean).join(" · "),
  }))

  const recent = await db
    .select({
      id: membershipCheckins.id,
      checkedInAt: membershipCheckins.checkedInAt,
      decremented: membershipCheckins.decremented,
      studentEmail: membershipCheckins.studentEmail,
      studentName: students.name,
      planName: membershipPlans.name,
      planColor: membershipPlans.color,
      type: studentMemberships.type,
      classesRemaining: studentMemberships.classesRemaining,
    })
    .from(membershipCheckins)
    .leftJoin(students, eq(students.email, membershipCheckins.studentEmail))
    .leftJoin(
      studentMemberships,
      eq(studentMemberships.id, membershipCheckins.membershipId),
    )
    .leftJoin(
      membershipPlans,
      eq(membershipPlans.id, studentMemberships.planId),
    )
    .orderBy(desc(membershipCheckins.checkedInAt))
    .limit(50)

  const recentEmails = Array.from(new Set(recent.map((r) => r.studentEmail)))
  const { planOptions, membershipsByStudent, checkinsByMembership } =
    await loadStudentMembershipsData(recentEmails)

  const todayStart = startOfDay(new Date()).toISOString()
  const [{ count: todayTotal }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(membershipCheckins)
    .where(gte(membershipCheckins.checkedInAt, todayStart))

  const [{ count: todayUnique }] = await db
    .select({
      count: sql<number>`count(distinct ${membershipCheckins.studentEmail})::int`,
    })
    .from(membershipCheckins)
    .where(gte(membershipCheckins.checkedInAt, todayStart))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Validate a student&apos;s membership and log their entry. Same-day
          re-entries don&apos;t consume an extra day.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Entries today" value={todayTotal} icon={LogIn} />
        <StatCard
          label="Unique students today"
          value={todayUnique}
          icon={Users}
        />
        <div className="md:col-span-2">
          <CheckinPanel students={items} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Memberships</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No check-ins yet.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(parseISO(r.checkedInAt), "MMM dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EntityAvatar name={r.studentName ?? r.studentEmail} />
                        <div className="leading-tight">
                          <div className="text-sm font-medium">
                            {r.studentName ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.studentEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: r.planColor ?? "#64748b" }}
                        />
                        <span className="text-sm">
                          {r.planName ?? r.type ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.decremented ? (
                        <Badge variant="outline">−1 day</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          re-entry
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {r.classesRemaining == null
                        ? "Unlimited"
                        : `${r.classesRemaining} left`}
                    </TableCell>
                    <TableCell className="text-right">
                      <StudentMembershipsCell
                        studentEmail={r.studentEmail}
                        studentName={r.studentName ?? r.studentEmail}
                        memberships={
                          membershipsByStudent.get(r.studentEmail) ?? []
                        }
                        plans={planOptions}
                        checkinsByMembership={checkinsByMembership}
                      />
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
