import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, employees, locations } from "@/lib/db/schema"
import { asc, eq, gte } from "drizzle-orm"
import { addMinutes, format, formatDistanceToNowStrict, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CalendarDays, MapPin, GraduationCap } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  await requireDashboardSession()

  const now = new Date()
  const nowIso = now.toISOString()

  const rows = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      scheduledAt: yogaClasses.scheduledAt,
      durationMinutes: yogaClasses.durationMinutes,
      capacity: yogaClasses.capacity,
      teacherName: employees.name,
      locationName: locations.name,
      locationColor: locations.color,
    })
    .from(yogaClasses)
    .leftJoin(employees, eq(yogaClasses.employeeId, employees.id))
    .leftJoin(locations, eq(yogaClasses.locationId, locations.id))
    .where(gte(yogaClasses.scheduledAt, nowIso))
    .orderBy(asc(yogaClasses.scheduledAt))
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Upcoming classes and events.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next {rows.length} classes</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No upcoming classes scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => {
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
    </div>
  )
}

