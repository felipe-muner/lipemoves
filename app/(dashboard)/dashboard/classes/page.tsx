import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, teachers, locations } from "@/lib/db/schema"
import { ensureDefaultLocation } from "@/lib/actions/locations"
import { and, eq, gte, lt } from "drizzle-orm"
import {
  endOfWeek,
  format,
  formatISO,
  parseISO,
  startOfWeek,
  addMinutes,
} from "date-fns"
import { notFound } from "next/navigation"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { CalendarGrid } from "@/components/crm/calendar-grid"
import { ClassDialog } from "@/components/crm/class-dialog"
import { ImportClassesDialog } from "@/components/crm/import-classes-dialog"
import { CopyWeekDialog } from "@/components/crm/copy-week-dialog"
import { WeekNav } from "@/components/crm/week-nav"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { Money } from "@/components/crm/money"
import {
  createClass,
  updateClass,
  deleteClass,
} from "@/lib/actions/classes"

export const dynamic = "force-dynamic"

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const params = await searchParams
  const weekStart = params.week
    ? startOfWeek(parseISO(params.week), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const weekClasses = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      description: yogaClasses.description,
      scheduledAt: yogaClasses.scheduledAt,
      durationMinutes: yogaClasses.durationMinutes,
      priceThb: yogaClasses.priceThb,
      teacherSharePercent: yogaClasses.teacherSharePercent,
      capacity: yogaClasses.capacity,
      teacherId: yogaClasses.teacherId,
      teacherName: teachers.name,
      locationId: yogaClasses.locationId,
      locationName: locations.name,
      locationColor: locations.color,
    })
    .from(yogaClasses)
    .leftJoin(teachers, eq(teachers.id, yogaClasses.teacherId))
    .leftJoin(locations, eq(locations.id, yogaClasses.locationId))
    .where(
      and(
        gte(yogaClasses.scheduledAt, formatISO(weekStart)),
        lt(yogaClasses.scheduledAt, formatISO(weekEnd)),
      ),
    )
    .orderBy(yogaClasses.scheduledAt)

  // For list view we show all classes (not just current week)
  const allClasses = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      description: yogaClasses.description,
      scheduledAt: yogaClasses.scheduledAt,
      durationMinutes: yogaClasses.durationMinutes,
      priceThb: yogaClasses.priceThb,
      teacherSharePercent: yogaClasses.teacherSharePercent,
      capacity: yogaClasses.capacity,
      teacherId: yogaClasses.teacherId,
      teacherName: teachers.name,
      locationId: yogaClasses.locationId,
      locationName: locations.name,
      locationColor: locations.color,
    })
    .from(yogaClasses)
    .leftJoin(teachers, eq(teachers.id, yogaClasses.teacherId))
    .leftJoin(locations, eq(locations.id, yogaClasses.locationId))
    .orderBy(yogaClasses.scheduledAt)

  const teacherOptions = await db
    .select({ id: teachers.id, name: teachers.name })
    .from(teachers)
    .where(eq(teachers.isActive, true))
    .orderBy(teachers.name)

  // Ensure at least one location exists then load
  await ensureDefaultLocation()
  const locationOptions = await db
    .select({
      id: locations.id,
      name: locations.name,
      color: locations.color,
      isDefault: locations.isDefault,
    })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(locations.name)

  const defaultView = params.view === "list" ? "list" : "calendar"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Schedule, edit and import classes. Set price and assign a teacher.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportClassesDialog />
          <ClassDialog
            mode="create"
            action={createClass}
            teachers={teacherOptions}
            locations={locationOptions}
          />
        </div>
      </div>

      <Tabs defaultValue={defaultView}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <WeekNav weekStartIso={formatISO(weekStart)} />
            <CopyWeekDialog weekStartIso={formatISO(weekStart)} />
          </div>
          <CalendarGrid
            weekStartIso={formatISO(weekStart)}
            classes={weekClasses}
            teachers={teacherOptions}
            locations={locationOptions}
          />
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>{allClasses.length} classes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Teacher %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allClasses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No classes yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allClasses.map((c) => {
                      const start = new Date(c.scheduledAt)
                      const end = addMinutes(start, c.durationMinutes)
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(start, "EEE, MMM dd")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {format(start, "HH:mm")} → {format(end, "HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.teacherName ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {c.durationMinutes} min
                          </TableCell>
                          <TableCell className="text-right">
                            <Money thb={c.priceThb} />
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {c.teacherSharePercent}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <ClassDialog
                                mode="edit"
                                values={{
                                  name: c.name,
                                  description: c.description,
                                  scheduledAt: c.scheduledAt,
                                  durationMinutes: c.durationMinutes,
                                  priceThb: c.priceThb,
                                  teacherSharePercent: c.teacherSharePercent,
                                  capacity: c.capacity,
                                  teacherId: c.teacherId,
                                  locationId: c.locationId,
                                }}
                                teachers={teacherOptions}
                                locations={locationOptions}
                                action={updateClass.bind(null, c.id)}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                              <DeleteRowButton
                                action={deleteClass.bind(null, c.id)}
                                confirmText={`Delete class "${c.name}"?`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
