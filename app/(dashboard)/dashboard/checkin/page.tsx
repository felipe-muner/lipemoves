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
import { PageHeader } from "@/components/crm/page-header"

const MEMBERSHIP_TYPE_LABEL: Record<string, string> = {
  drop_in: "Drop-in",
  monthly: "Monthly",
  class_pack: "Class Pack",
  free_pass: "Free Pass",
  custom: "Custom",
}

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
      success: membershipCheckins.success,
      failureReason: membershipCheckins.failureReason,
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
      <PageHeader
        title="Check-in"
        subtitle="Validate a student's membership and log their entry. Same-day re-entries don't consume an extra day."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <CheckinPanel students={items} />
        </div>
        <StatCard label="Entries today" value={todayTotal} icon={LogIn} />
        <StatCard
          label="Unique students today"
          value={todayUnique}
          icon={Users}
        />
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
                      {r.success ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: r.planColor ?? "#64748b" }}
                          />
                          <span className="text-sm">
                            {r.planName ??
                              (r.type ? MEMBERSHIP_TYPE_LABEL[r.type] ?? r.type : "—")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {r.failureReason ?? "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!r.success ? (
                        <Badge className="border-rose-500/40 bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 dark:text-rose-400">
                          failed
                        </Badge>
                      ) : r.decremented ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                          −1 day
                        </Badge>
                      ) : (
                        <Badge className="border-sky-500/40 bg-sky-500/15 text-sky-700 hover:bg-sky-500/15 dark:text-sky-400">
                          re-entry
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {!r.success
                        ? "—"
                        : r.classesRemaining == null
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
