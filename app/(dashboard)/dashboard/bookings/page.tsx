import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, teachers } from "@/lib/db/schema"
import { and, eq, gte, lt } from "drizzle-orm"
import {
  addDays,
  endOfWeek,
  format,
  formatISO,
  getDay,
  getHours,
  parseISO,
  startOfWeek,
} from "date-fns"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WeekNav } from "@/components/crm/week-nav"
import { CopyWeekDialog } from "@/components/crm/copy-week-dialog"
import { ClassDialog } from "@/components/crm/class-dialog"
import { createClass, updateClass } from "@/lib/actions/classes"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 07:00 → 20:00

// Pastel colors per teacher (cycled)
const TEACHER_TONES = [
  "border-l-amber-400 bg-amber-50 dark:bg-amber-950/30",
  "border-l-sky-400 bg-sky-50 dark:bg-sky-950/30",
  "border-l-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  "border-l-violet-400 bg-violet-50 dark:bg-violet-950/30",
  "border-l-rose-400 bg-rose-50 dark:bg-rose-950/30",
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const params = await searchParams
  const weekStart = params.week
    ? startOfWeek(parseISO(params.week), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const classes = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      description: yogaClasses.description,
      scheduledAt: yogaClasses.scheduledAt,
      durationMinutes: yogaClasses.durationMinutes,
      dropInPriceCents: yogaClasses.dropInPriceCents,
      capacity: yogaClasses.capacity,
      teacherId: yogaClasses.teacherId,
      teacherName: teachers.name,
    })
    .from(yogaClasses)
    .leftJoin(teachers, eq(teachers.id, yogaClasses.teacherId))
    .where(
      and(
        gte(yogaClasses.scheduledAt, formatISO(weekStart)),
        lt(yogaClasses.scheduledAt, formatISO(weekEnd)),
      ),
    )
    .orderBy(yogaClasses.scheduledAt)

  const teacherOptions = await db
    .select({ id: teachers.id, name: teachers.name })
    .from(teachers)
    .where(eq(teachers.isActive, true))
    .orderBy(teachers.name)

  // Assign a tone per teacher
  const teacherTone = new Map<string, string>()
  Array.from(new Set(classes.map((c) => c.teacherId).filter(Boolean) as string[]))
    .forEach((id, i) => {
      teacherTone.set(id, TEACHER_TONES[i % TEACHER_TONES.length])
    })

  // Build grid: rows = hours, cols = days (0..6 from Monday)
  const grid: Record<number, Record<number, typeof classes>> = {}
  for (const h of HOURS) grid[h] = {}
  for (const c of classes) {
    const date = new Date(c.scheduledAt)
    const dayIdx = (getDay(date) + 6) % 7 // make Mon=0
    const hour = getHours(date)
    if (!grid[hour]) grid[hour] = {}
    if (!grid[hour][dayIdx]) grid[hour][dayIdx] = []
    grid[hour][dayIdx].push(c)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Weekly schedule. Click a slot to view, or create new classes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeekNav weekStartIso={formatISO(weekStart)} />
          <CopyWeekDialog weekStartIso={formatISO(weekStart)} />
          <ClassDialog
            mode="create"
            action={createClass}
            teachers={teacherOptions}
          />
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <div className="px-3 py-2">Time</div>
            {DAY_LABELS.map((d, i) => {
              const date = addDays(weekStart, i)
              return (
                <div key={d} className="px-3 py-2">
                  <div className="font-medium">{d}</div>
                  <div className="text-[10px] normal-case">
                    {format(date, "MMM dd")}
                  </div>
                </div>
              )
            })}
          </div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b last:border-b-0"
            >
              <div className="px-3 py-3 text-xs text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </div>
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const items = grid[h]?.[dayIdx] ?? []
                return (
                  <div
                    key={dayIdx}
                    className="min-h-[64px] border-l p-1 space-y-1"
                  >
                    {items.map((c) => {
                      const tone = c.teacherId
                        ? teacherTone.get(c.teacherId) ?? TEACHER_TONES[0]
                        : "border-l-gray-300 bg-gray-50 dark:bg-gray-900/40"
                      return (
                        <ClassDialog
                          key={c.id}
                          mode="edit"
                          action={updateClass.bind(null, c.id)}
                          teachers={teacherOptions}
                          values={{
                            name: c.name,
                            description: c.description,
                            scheduledAt: c.scheduledAt,
                            durationMinutes: c.durationMinutes,
                            dropInPriceCents: c.dropInPriceCents,
                            capacity: c.capacity,
                            teacherId: c.teacherId,
                          }}
                          trigger={
                            <button
                              className={`block w-full rounded-md border-l-4 px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${tone}`}
                            >
                              <div className="font-medium leading-tight">
                                {c.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {format(new Date(c.scheduledAt), "HH:mm")} ·{" "}
                                {c.durationMinutes}m
                              </div>
                              <div className="mt-0.5 truncate text-[10px]">
                                {c.teacherName ?? "no teacher"}
                              </div>
                            </button>
                          }
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-4 p-4">
        <span className="text-xs uppercase text-muted-foreground">Teachers</span>
        {Array.from(teacherTone.entries()).map(([teacherId, tone]) => {
          const teacher = classes.find((c) => c.teacherId === teacherId)
          return (
            <Badge
              key={teacherId}
              variant="outline"
              className={`gap-2 ${tone.split(" ")[1]} ${tone.split(" ")[2] ?? ""}`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${tone.split(" ")[0].replace("border-l-", "bg-")}`}
              />
              {teacher?.teacherName ?? "—"}
            </Badge>
          )
        })}
        {teacherTone.size === 0 && (
          <span className="text-sm text-muted-foreground">
            No classes scheduled this week.
          </span>
        )}
      </Card>
    </div>
  )
}
