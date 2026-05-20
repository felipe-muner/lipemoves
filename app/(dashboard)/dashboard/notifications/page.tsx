import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import {
  yogaClasses,
  employees,
  locations,
  products,
  studentMemberships,
  students,
} from "@/lib/db/schema"
import { and, asc, eq, gte, isNotNull, lte, sql } from "drizzle-orm"
import {
  addDays,
  addMinutes,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  CalendarDays,
  MapPin,
  GraduationCap,
  Package,
  Ticket,
  AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/crm/page-header"

export const dynamic = "force-dynamic"

const LOW_STOCK_SERVINGS = 5
const EXPIRING_DAYS = 7

export default async function NotificationsPage() {
  await requireDashboardSession()

  const now = new Date()
  const nowIso = now.toISOString()

  const [classRows, lowStock, expiring] = await Promise.all([
    db
      .select({
        id: yogaClasses.id,
        name: yogaClasses.name,
        scheduledAt: yogaClasses.scheduledAt,
        durationMinutes: yogaClasses.durationMinutes,
        teacherName: employees.name,
        locationName: locations.name,
        locationColor: locations.color,
      })
      .from(yogaClasses)
      .leftJoin(employees, eq(yogaClasses.employeeId, employees.id))
      .leftJoin(locations, eq(yogaClasses.locationId, locations.id))
      .where(gte(yogaClasses.scheduledAt, nowIso))
      .orderBy(asc(yogaClasses.scheduledAt))
      .limit(10),

    db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        stockQty: products.stockQty,
        servingSize: products.servingSize,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          lte(
            sql`${products.stockQty} / NULLIF(${products.servingSize}, 0)`,
            LOW_STOCK_SERVINGS,
          ),
        ),
      )
      .orderBy(
        asc(sql`${products.stockQty} / NULLIF(${products.servingSize}, 0)`),
      )
      .limit(20),

    db
      .select({
        id: studentMemberships.id,
        endsOn: studentMemberships.endsOn,
        studentEmail: studentMemberships.studentEmail,
        studentName: students.name,
      })
      .from(studentMemberships)
      .leftJoin(students, eq(students.email, studentMemberships.studentEmail))
      .where(
        and(
          isNotNull(studentMemberships.endsOn),
          gte(studentMemberships.endsOn, format(now, "yyyy-MM-dd")),
          lte(studentMemberships.endsOn, format(addDays(now, EXPIRING_DAYS), "yyyy-MM-dd")),
        ),
      )
      .orderBy(asc(studentMemberships.endsOn))
      .limit(20),
  ])

  const totalCount = classRows.length + lowStock.length + expiring.length

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </span>
            Notifications
          </span>
        }
        subtitle={
          totalCount === 0
            ? "All clear — nothing needs your attention right now."
            : `${totalCount} items across classes, stock, and memberships.`
        }
      />

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Classes
            <Badge variant="secondary" className="h-5 px-1.5">
              {classRows.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            Stock
            <Badge
              variant={lowStock.length > 0 ? "destructive" : "secondary"}
              className="h-5 px-1.5"
            >
              {lowStock.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="memberships" className="gap-2">
            <Ticket className="h-4 w-4" />
            Memberships
            <Badge variant="secondary" className="h-5 px-1.5">
              {expiring.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardContent className="pt-6">
              {classRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No upcoming classes scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {classRows.map((r) => {
                const start = parseISO(r.scheduledAt)
                const end = addMinutes(start, r.durationMinutes)
                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <div
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: r.locationColor ?? "#64748b" }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          in {formatDistanceToNowStrict(start)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(start, "EEE, MMM dd · HH:mm")} –{" "}
                          {format(end, "HH:mm")}
                        </span>
                        {r.teacherName && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {r.teacherName}
                          </span>
                        )}
                        {r.locationName && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {r.locationName}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-xs text-muted-foreground">
                Showing items with ≤ {LOW_STOCK_SERVINGS} servings left.
              </p>
              {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All kitchen products are well stocked.
            </p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => {
                const servings = Math.floor(p.stockQty / (p.servingSize || 1))
                const out = servings === 0
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={
                          out
                            ? "h-4 w-4 text-destructive"
                            : "h-4 w-4 text-amber-600"
                        }
                      />
                      <div className="space-y-0.5">
                        <Link
                          href="/dashboard/products"
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs capitalize text-muted-foreground">
                          {p.category}
                        </div>
                      </div>
                    </div>
                    <Badge variant={out ? "destructive" : "outline"}>
                      {out
                        ? "Out of stock"
                        : `${servings} ${servings === 1 ? "serving" : "servings"} left`}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-xs text-muted-foreground">
                Memberships expiring within the next {EXPIRING_DAYS} days.
              </p>
              {expiring.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No memberships are expiring soon.
            </p>
          ) : (
            <ul className="space-y-2">
              {expiring.map((m) => {
                const end = parseISO(m.endsOn!)
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-0.5">
                      <Link
                        href={`/dashboard/students?studentId=${encodeURIComponent(m.studentEmail)}`}
                        className="font-medium hover:underline"
                      >
                        {m.studentName ?? m.studentEmail}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Ends {format(end, "EEE, MMM dd")}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      in {formatDistanceToNowStrict(end)}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
