"use client"

import * as React from "react"
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { cn } from "@/lib/utils"
import {
  MovementDialog,
  type MovementValues,
} from "@/components/crm/movement-dialog"
import type { CategoryOption } from "@/components/crm/category-combobox"

interface Entry {
  id: string
  performedOn: string
  categoryColor: string
  categoryName: string
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function MovementMonthGrid({
  monthDate,
  entries,
  categories,
  createAction,
  createCategoryAction,
}: {
  monthDate: Date
  entries: Entry[]
  categories: CategoryOption[]
  createAction: (formData: FormData) => Promise<void>
  createCategoryAction: (formData: FormData) => Promise<{
    id: string
    name: string
    color: string
  }>
}) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const today = new Date()
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)

  const dialogValues: MovementValues | undefined = selectedDay
    ? {
        performedOn: formatISO(
          setMinutes(
            setHours(selectedDay, today.getHours()),
            today.getMinutes(),
          ),
        ),
      }
    : undefined

  return (
    <>
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
          {DAY_LABELS.map((d) => (
            <div key={d} className="px-1 py-0.5 text-center font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEntries = entries.filter((e) =>
              isSameDay(parseISO(e.performedOn), day),
            )
            const inMonth = isSameMonth(day, monthDate)
            const isToday = isSameDay(day, today)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex min-h-[68px] cursor-pointer flex-col rounded-md border bg-card p-1.5 text-left text-xs transition-colors hover:border-primary/60 hover:bg-accent",
                  !inMonth && "opacity-40",
                  isToday && "border-primary ring-1 ring-primary/40",
                )}
                aria-label={`Log movement on ${format(day, "MMM d")}`}
              >
                <div
                  className={cn(
                    "mb-1 text-right font-medium",
                    isToday && "text-primary",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {dayEntries.slice(0, 5).map((e) => (
                    <span
                      key={e.id}
                      title={`${e.categoryName} · ${format(parseISO(e.performedOn), "MMM dd HH:mm")}`}
                      className="h-2 w-2 rounded-full"
                      style={{ background: e.categoryColor }}
                    />
                  ))}
                  {dayEntries.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayEntries.length - 5}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <MovementDialog
        key={selectedDay?.toISOString() ?? "none"}
        mode="create"
        hideTrigger
        open={selectedDay !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedDay(null)
        }}
        values={dialogValues}
        categories={categories}
        action={createAction}
        createCategoryAction={createCategoryAction}
      />
    </>
  )
}
