"use client"

import * as React from "react"
import {
  addDays,
  addMinutes,
  format,
  formatISO,
  getDay,
  getHours,
  parseISO,
} from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Money } from "@/components/crm/money"
import { ClassDialog, type ClassDialogValues } from "@/components/crm/class-dialog"
import { createClass, updateClass } from "@/lib/actions/classes"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 07:00 → 20:00

const TEACHER_TONES = [
  {
    border: "border-l-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-400",
  },
  {
    border: "border-l-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    dot: "bg-sky-400",
  },
  {
    border: "border-l-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-400",
  },
  {
    border: "border-l-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    dot: "bg-violet-400",
  },
  {
    border: "border-l-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    dot: "bg-rose-400",
  },
]

export interface CalendarClass {
  id: string
  name: string
  description: string | null
  scheduledAt: string
  durationMinutes: number
  priceThb: number
  teacherSharePercent: number
  capacity: number | null
  teacherId: string | null
  teacherName: string | null
}

export function CalendarGrid({
  weekStartIso,
  classes,
  teachers,
}: {
  weekStartIso: string
  classes: CalendarClass[]
  teachers: { id: string; name: string }[]
}) {
  const weekStart = parseISO(weekStartIso)

  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [values, setValues] = React.useState<ClassDialogValues>({})
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Action proxy: route to create or update bound to activeId
  const action = React.useCallback(
    async (formData: FormData) => {
      if (mode === "edit" && activeId) {
        await updateClass(activeId, formData)
      } else {
        await createClass(formData)
      }
    },
    [mode, activeId],
  )

  function openCreate(date: Date) {
    setMode("create")
    setActiveId(null)
    setValues({
      scheduledAt: formatISO(date),
      durationMinutes: 60,
      priceThb: 0,
      teacherSharePercent: 0,
    })
    setOpen(true)
  }

  function openEdit(c: CalendarClass) {
    setMode("edit")
    setActiveId(c.id)
    setValues({
      name: c.name,
      description: c.description,
      scheduledAt: c.scheduledAt,
      durationMinutes: c.durationMinutes,
      priceThb: c.priceThb,
      teacherSharePercent: c.teacherSharePercent,
      capacity: c.capacity,
      teacherId: c.teacherId,
    })
    setOpen(true)
  }

  // Assign a tone per teacher
  const teacherTone = React.useMemo(() => {
    const map = new Map<string, (typeof TEACHER_TONES)[number]>()
    Array.from(new Set(classes.map((c) => c.teacherId).filter(Boolean) as string[]))
      .forEach((id, i) => map.set(id, TEACHER_TONES[i % TEACHER_TONES.length]))
    return map
  }, [classes])

  // Group classes by hour-of-day × day-index (Mon=0..Sun=6)
  const grid = React.useMemo(() => {
    const g: Record<number, Record<number, CalendarClass[]>> = {}
    for (const h of HOURS) g[h] = {}
    for (const c of classes) {
      const date = new Date(c.scheduledAt)
      const dayIdx = (getDay(date) + 6) % 7
      const hour = getHours(date)
      if (!g[hour]) g[hour] = {}
      if (!g[hour][dayIdx]) g[hour][dayIdx] = []
      g[hour][dayIdx].push(c)
    }
    return g
  }, [classes])

  return (
    <>
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
                const cellDate = new Date(weekStart)
                cellDate.setDate(weekStart.getDate() + dayIdx)
                cellDate.setHours(h, 0, 0, 0)
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={(e) => {
                      // Only trigger create when clicking the empty cell background,
                      // not on the inner class buttons
                      if (e.target === e.currentTarget) {
                        openCreate(cellDate)
                      }
                    }}
                    className="group relative min-h-[64px] cursor-pointer border-l p-1 text-left transition hover:bg-muted/40"
                  >
                    {items.length === 0 && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/70">
                        + Add class
                      </span>
                    )}
                    <div className="space-y-1">
                      {items.map((c) => {
                        const tone = c.teacherId
                          ? teacherTone.get(c.teacherId)
                          : null
                        const start = new Date(c.scheduledAt)
                        const end = addMinutes(start, c.durationMinutes)
                        return (
                          <span
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(c)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                e.stopPropagation()
                                openEdit(c)
                              }
                            }}
                            className={`block w-full cursor-pointer rounded-md border-l-4 px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${
                              tone
                                ? `${tone.border} ${tone.bg}`
                                : "border-l-gray-300 bg-gray-50 dark:bg-gray-900/40"
                            }`}
                          >
                            <div className="font-medium leading-tight">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {format(start, "HH:mm")} → {format(end, "HH:mm")}{" "}
                              · {c.durationMinutes}m
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[10px]">
                              <span className="truncate">
                                {c.teacherName ?? "no teacher"}
                              </span>
                              {c.priceThb > 0 && (
                                <Money
                                  thb={c.priceThb}
                                  className="font-medium"
                                />
                              )}
                            </div>
                          </span>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <span className="text-xs uppercase text-muted-foreground">Teachers</span>
        {Array.from(teacherTone.entries()).map(([teacherId, tone]) => {
          const teacher = classes.find((c) => c.teacherId === teacherId)
          return (
            <Badge key={teacherId} variant="outline" className="gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${tone.dot}`} />
              {teacher?.teacherName ?? "—"}
            </Badge>
          )
        })}
        {teacherTone.size === 0 && (
          <span className="text-sm text-muted-foreground">
            No classes scheduled this week. Click any cell to add one.
          </span>
        )}
      </Card>

      <ClassDialog
        mode={mode}
        action={action}
        teachers={teachers}
        values={values}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
