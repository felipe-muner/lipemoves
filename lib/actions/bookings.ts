"use server"

import { db } from "@/lib/db"
import { yogaClasses } from "@/lib/db/schema"
import { and, gte, lt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import {
  addWeeks,
  formatISO,
  parseISO,
  startOfWeek,
  endOfWeek,
  differenceInMilliseconds,
} from "date-fns"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

/**
 * Copy all classes from `sourceWeekStart` to `targetWeekStart` (Monday-based weeks),
 * preserving day-of-week and time-of-day. Skips classes that would land on
 * a slot (teacher + scheduledAt) that already exists in the target week.
 */
export async function copyWeek(
  sourceWeekStartIso: string,
  targetWeekStartIso: string,
) {
  await requireManageScope()

  const sourceStart = parseISO(sourceWeekStartIso)
  const sourceEnd = endOfWeek(sourceStart, { weekStartsOn: 1 })
  const targetStart = parseISO(targetWeekStartIso)

  const offsetMs = differenceInMilliseconds(targetStart, sourceStart)

  const sourceClasses = await db
    .select()
    .from(yogaClasses)
    .where(
      and(
        gte(yogaClasses.scheduledAt, formatISO(sourceStart)),
        lt(yogaClasses.scheduledAt, formatISO(sourceEnd)),
      ),
    )

  if (sourceClasses.length === 0) {
    return { copied: 0, skipped: 0 }
  }

  // Load any existing classes in target week to skip duplicates by (teacherId + scheduledAt)
  const targetEnd = endOfWeek(targetStart, { weekStartsOn: 1 })
  const existing = await db
    .select({
      employeeId: yogaClasses.employeeId,
      scheduledAt: yogaClasses.scheduledAt,
    })
    .from(yogaClasses)
    .where(
      and(
        gte(yogaClasses.scheduledAt, formatISO(targetStart)),
        lt(yogaClasses.scheduledAt, formatISO(targetEnd)),
      ),
    )
  const existingKeys = new Set(
    existing.map((e) => `${e.employeeId ?? ""}|${e.scheduledAt}`),
  )

  const toInsert = sourceClasses
    .map((c) => {
      const newDate = new Date(new Date(c.scheduledAt).getTime() + offsetMs)
      const newScheduledAt = formatISO(newDate)
      const key = `${c.employeeId ?? ""}|${newScheduledAt}`
      if (existingKeys.has(key)) return null
      return {
        employeeId: c.employeeId,
        name: c.name,
        description: c.description,
        scheduledAt: newScheduledAt,
        durationMinutes: c.durationMinutes,
        priceThb: c.priceThb,
        teacherSharePercent: c.teacherSharePercent,
        capacity: c.capacity,
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (toInsert.length > 0) {
    await db.insert(yogaClasses).values(toInsert)
  }

  revalidatePath("/dashboard/classes")

  return {
    copied: toInsert.length,
    skipped: sourceClasses.length - toInsert.length,
  }
}

export async function getWeekStart(date: Date) {
  return formatISO(startOfWeek(date, { weekStartsOn: 1 }))
}

export async function getNextWeekStart(weekStartIso: string) {
  return formatISO(addWeeks(parseISO(weekStartIso), 1))
}
