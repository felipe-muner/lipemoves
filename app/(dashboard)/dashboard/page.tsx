import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import {
  employees,
  yogaClasses,
  students,
  studentMemberships,
  classAttendance,
} from "@/lib/db/schema"
import { and, count, eq, gte, lte, sum } from "drizzle-orm"
import {
  startOfMonth,
  endOfMonth,
  formatISO,
  subMonths,
  format,
} from "date-fns"
import { StatCard } from "@/components/crm/stat-card"
import { ActivityChart, ActivityPoint } from "@/components/crm/activity-chart"
import { Money } from "@/components/crm/money"
import {
  CalendarDays,
  GraduationCap,
  Users,
  Wallet,
  TrendingUp,
} from "lucide-react"

export const dynamic = "force-dynamic"

async function buildSeries(): Promise<ActivityPoint[]> {
  const now = new Date()
  const points: ActivityPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const from = formatISO(startOfMonth(monthDate))
    const to = formatISO(endOfMonth(monthDate))
    const [c] = await db
      .select({ v: count() })
      .from(yogaClasses)
      .where(and(gte(yogaClasses.scheduledAt, from), lte(yogaClasses.scheduledAt, to)))
    const [a] = await db
      .select({ v: count() })
      .from(classAttendance)
      .where(
        and(
          gte(classAttendance.checkedInAt, from),
          lte(classAttendance.checkedInAt, to),
        ),
      )
    points.push({
      label: format(monthDate, "MMM"),
      classes: c.v,
      attendees: a.v,
    })
  }
  return points
}

export default async function DashboardHome() {
  const session = await requireDashboardSession()
  const now = new Date()
  const monthStart = formatISO(startOfMonth(now))

  if (session.role === "admin" || session.role === "manager") {
    const [teachersCount] = await db.select({ v: count() }).from(employees)
    const [studentsCount] = await db.select({ v: count() }).from(students)
    const [activeMembershipsCount] = await db
      .select({ v: count() })
      .from(studentMemberships)
    const [classesThisMonth] = await db
      .select({ v: count() })
      .from(yogaClasses)
      .where(gte(yogaClasses.scheduledAt, monthStart))
    const [revenueThisMonth] = await db
      .select({ v: sum(studentMemberships.pricePaidThb) })
      .from(studentMemberships)
      .where(gte(studentMemberships.startsOn, monthStart))

    const series = await buildSeries()
    const revenue = Number(revenueThisMonth.v ?? 0)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {session.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at the studio this month.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Revenue"
            value={<Money thb={revenue} />}
            icon={Wallet}
            hint="From memberships this month"
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            label="Classes this month"
            value={classesThisMonth.v}
            icon={CalendarDays}
            hint="Scheduled or completed"
          />
          <StatCard
            label="Students"
            value={studentsCount.v}
            icon={Users}
            hint={`${activeMembershipsCount.v} memberships`}
          />
          <StatCard
            label="Teachers"
            value={teachersCount.v}
            icon={GraduationCap}
            hint="Active on payroll"
          />
        </div>

        <ActivityChart data={series} />
      </div>
    )
  }

  if (session.role === "teacher" && session.teacherId) {
    const teacherId = session.teacherId
    const monthEnd = formatISO(endOfMonth(now))

    const [myClassesThisMonth] = await db
      .select({ v: count() })
      .from(yogaClasses)
      .where(
        and(
          eq(yogaClasses.employeeId, teacherId),
          gte(yogaClasses.scheduledAt, monthStart),
          lte(yogaClasses.scheduledAt, monthEnd),
        ),
      )

    const myClasses = await db
      .select({
        priceThb: yogaClasses.priceThb,
        teacherSharePercent: yogaClasses.teacherSharePercent,
      })
      .from(yogaClasses)
      .where(
        and(
          eq(yogaClasses.employeeId, teacherId),
          gte(yogaClasses.scheduledAt, monthStart),
          lte(yogaClasses.scheduledAt, monthEnd),
        ),
      )
    const myPayout = myClasses.reduce(
      (acc, c) => acc + Math.round((c.priceThb * c.teacherSharePercent) / 100),
      0,
    )

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hi, {session.name?.split(" ")[0] ?? "teacher"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(now, "MMMM yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="My classes this month"
            value={myClassesThisMonth.v}
            icon={CalendarDays}
          />
          <StatCard
            label="Earnings this month"
            value={<Money thb={myPayout} />}
            icon={TrendingUp}
            hint="Computed from class prices × share %"
          />
          <StatCard
            label="Status"
            value="Active"
            icon={Wallet}
            hint="Linked to teacher record"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm text-muted-foreground">
      Your account isn&apos;t linked to a teacher record yet. Ask the admin or
      manager to add you.
    </div>
  )
}
