"use client"

import * as React from "react"
import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns"
import { cn } from "@/lib/utils"

interface Entry {
  performedOn: string
  categoryColor: string
  categoryName: string
}

interface DayCell {
  date: Date
  inRange: boolean
  count: number
  topCategory: { color: string; name: string } | null
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""]
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/**
 * GitHub-style year heatmap. Renders the last ~52 weeks ending today,
 * one column per week (Mon → Sun), color = dominant category that day.
 */
export function YearHeatmap({ entries }: { entries: Entry[] }) {
  const today = startOfDay(new Date())
  // 52 weeks back + extra to align to Monday of that week
  const startOfFirstWeek = startOfWeek(subDays(today, 52 * 7), {
    weekStartsOn: 1,
  })
  const totalDays = differenceInCalendarDays(today, startOfFirstWeek) + 1
  const totalWeeks = Math.ceil(totalDays / 7)

  // bucket entries by yyyy-MM-dd for O(1) lookup
  const byDay = React.useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of entries) {
      const d = format(parseISO(e.performedOn), "yyyy-MM-dd")
      const arr = m.get(d) ?? []
      arr.push(e)
      m.set(d, arr)
    }
    return m
  }, [entries])

  const weeks: DayCell[][] = []
  for (let w = 0; w < totalWeeks; w++) {
    const col: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startOfFirstWeek, w * 7 + d)
      const inRange = date <= today
      const dayEntries = byDay.get(format(date, "yyyy-MM-dd")) ?? []
      // pick most-frequent category that day
      let topCategory: { color: string; name: string } | null = null
      if (dayEntries.length) {
        const counts = new Map<string, { color: string; n: number }>()
        for (const e of dayEntries) {
          const prev = counts.get(e.categoryName)
          counts.set(e.categoryName, {
            color: e.categoryColor,
            n: (prev?.n ?? 0) + 1,
          })
        }
        const best = [...counts.entries()].sort((a, b) => b[1].n - a[1].n)[0]
        topCategory = { color: best[1].color, name: best[0] }
      }
      col.push({ date, inRange, count: dayEntries.length, topCategory })
    }
    weeks.push(col)
  }

  // Month labels — show above the column where the month changes.
  const monthLabels: Array<{ weekIdx: number; label: string }> = []
  let lastMonth = -1
  for (let w = 0; w < weeks.length; w++) {
    const firstDayOfWeek = weeks[w][0].date
    const m = firstDayOfWeek.getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: w, label: MONTH_LABELS[m] })
      lastMonth = m
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* month labels */}
        <div
          className="ml-7 grid gap-[3px] text-[10px] text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${totalWeeks}, 11px)` }}
        >
          {Array.from({ length: totalWeeks }).map((_, w) => {
            const label = monthLabels.find((m) => m.weekIdx === w)?.label
            return (
              <div key={w} className="h-3 leading-3">
                {label ?? ""}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          {/* day-of-week labels */}
          <div className="grid grid-rows-7 gap-[3px] pr-1 text-[10px] text-muted-foreground">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[11px] leading-[11px]">
                {d}
              </div>
            ))}
          </div>
          {/* grid */}
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${totalWeeks}, 11px)`,
              gridAutoFlow: "column",
              gridTemplateRows: "repeat(7, 11px)",
            }}
          >
            {weeks.flatMap((col) =>
              col.map((cell) => {
                if (!cell.inRange) {
                  return (
                    <div
                      key={cell.date.toISOString()}
                      className="h-[11px] w-[11px] rounded-[2px] bg-transparent"
                    />
                  )
                }
                const empty = cell.count === 0
                const tooltip = empty
                  ? format(cell.date, "MMM d, yyyy") + " — rest day"
                  : `${format(cell.date, "MMM d, yyyy")} — ${cell.count} session${cell.count === 1 ? "" : "s"}${cell.topCategory ? ` · ${cell.topCategory.name}` : ""}`

                return (
                  <div
                    key={cell.date.toISOString()}
                    title={tooltip}
                    className={cn(
                      "h-[11px] w-[11px] rounded-[2px] ring-1 ring-inset",
                      empty
                        ? "bg-muted/50 ring-border/50"
                        : "ring-black/10 dark:ring-white/10",
                    )}
                    style={
                      empty
                        ? undefined
                        : {
                            background: cell.topCategory?.color ?? "#22c55e",
                            opacity: Math.min(0.4 + cell.count * 0.25, 1),
                          }
                    }
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
