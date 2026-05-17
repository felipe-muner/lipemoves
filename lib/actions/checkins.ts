"use server"

import { db } from "@/lib/db"
import {
  membershipCheckins,
  membershipPlans,
  studentMemberships,
  students,
} from "@/lib/db/schema"
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { endOfDay, parseISO, startOfDay } from "date-fns"

export type CheckinResult =
  | {
      ok: true
      decremented: boolean
      studentName: string
      planLabel: string
      classesRemaining: number | null
      endsOn: string | null
    }
  | { ok: false; reason: string }

async function requireScope() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") throw new Error("No permission")
  return session
}

interface ActiveCandidate {
  id: string
  type: string
  startsOn: string
  endsOn: string | null
  classesRemaining: number | null
  planName: string | null
}

/**
 * Preference: an active class-pack with credits remaining (oldest first) over
 * an unlimited monthly. An active row has startsOn ≤ today and either no
 * endsOn or endsOn covers today.
 */
function pickActiveMembership(
  memberships: ActiveCandidate[],
  today: Date,
  usedTodayIds: Set<string>,
): ActiveCandidate | null {
  const dayStart = startOfDay(today)
  const active = memberships.filter((m) => {
    const starts = parseISO(m.startsOn)
    if (starts > today) return false
    if (m.endsOn && parseISO(m.endsOn) < dayStart) return false
    return true
  })
  // Re-use a class-pack / drop-in already used today (no extra decrement).
  const reusable = active
    .filter((m) => m.classesRemaining != null && usedTodayIds.has(m.id))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  if (reusable[0]) return reusable[0]
  const withCredits = active
    .filter((m) => m.classesRemaining != null && m.classesRemaining > 0)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  if (withCredits[0]) return withCredits[0]
  return active.find((m) => m.classesRemaining == null) ?? null
}

export async function checkInStudent(
  studentEmail: string,
): Promise<CheckinResult> {
  await requireScope()
  const email = studentEmail.trim().toLowerCase()
  if (!email) return { ok: false, reason: "No student selected" }

  const [student] = await db
    .select({ email: students.email, name: students.name })
    .from(students)
    .where(eq(students.email, email))
    .limit(1)
  if (!student) return { ok: false, reason: "Student not found" }

  async function logFailure(reason: string): Promise<CheckinResult> {
    await db.insert(membershipCheckins).values({
      membershipId: null,
      studentEmail: email,
      decremented: false,
      success: false,
      failureReason: reason,
    })
    revalidatePath("/dashboard/checkin")
    return { ok: false, reason }
  }

  const rows = await db
    .select({
      id: studentMemberships.id,
      type: studentMemberships.type,
      startsOn: studentMemberships.startsOn,
      endsOn: studentMemberships.endsOn,
      classesRemaining: studentMemberships.classesRemaining,
      planName: membershipPlans.name,
    })
    .from(studentMemberships)
    .leftJoin(
      membershipPlans,
      eq(membershipPlans.id, studentMemberships.planId),
    )
    .where(eq(studentMemberships.studentEmail, email))

  const today = new Date()
  const dayStart = startOfDay(today).toISOString()
  const dayEnd = endOfDay(today).toISOString()

  const usedTodayRows = rows.length
    ? await db
        .selectDistinct({ membershipId: membershipCheckins.membershipId })
        .from(membershipCheckins)
        .where(
          and(
            inArray(
              membershipCheckins.membershipId,
              rows.map((r) => r.id),
            ),
            gte(membershipCheckins.checkedInAt, dayStart),
            lte(membershipCheckins.checkedInAt, dayEnd),
          ),
        )
    : []
  const usedTodayIds = new Set(
    usedTodayRows
      .map((r) => r.membershipId)
      .filter((id): id is string => id !== null),
  )

  const chosen = pickActiveMembership(rows, today, usedTodayIds)
  if (!chosen) {
    return logFailure("No active membership")
  }

  const usedToday = usedTodayIds.has(chosen.id)
  const shouldDecrement =
    !usedToday &&
    chosen.classesRemaining != null &&
    chosen.classesRemaining > 0

  await db.insert(membershipCheckins).values({
    membershipId: chosen.id,
    studentEmail: email,
    decremented: shouldDecrement,
  })

  let newRemaining = chosen.classesRemaining
  if (shouldDecrement && chosen.classesRemaining != null) {
    newRemaining = chosen.classesRemaining - 1
    await db
      .update(studentMemberships)
      .set({ classesRemaining: newRemaining })
      .where(eq(studentMemberships.id, chosen.id))
  }

  revalidatePath("/dashboard/checkin")
  revalidatePath("/dashboard/students")

  return {
    ok: true,
    decremented: shouldDecrement,
    studentName: student.name,
    planLabel: chosen.planName ?? chosen.type,
    classesRemaining: newRemaining,
    endsOn: chosen.endsOn,
  }
}
