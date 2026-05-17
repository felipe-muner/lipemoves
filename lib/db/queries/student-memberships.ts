import { db } from "@/lib/db"
import {
  membershipCheckins,
  membershipPlans,
  studentMemberships,
} from "@/lib/db/schema"
import { desc, eq, inArray, sql } from "drizzle-orm"

export type MembershipRow = Awaited<
  ReturnType<typeof loadStudentMembershipsData>
>["membershipsByStudent"] extends Map<string, infer V>
  ? V extends Array<infer Item>
    ? Item
    : never
  : never

export type CheckinDay = {
  day: string
  entries: number
  decremented: boolean
}

import type { PlanOption } from "@/components/crm/student-memberships-dialog"
export type { PlanOption }

/**
 * Loads everything needed to render the StudentMembershipsDialog for a set
 * of students: active plan options, each student's memberships, and per-day
 * check-in stats per membership. Pass `emails = null` to load for all students.
 */
export async function loadStudentMembershipsData(emails: string[] | null) {
  const plans = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.isActive, true))
    .orderBy(membershipPlans.sortOrder, membershipPlans.name)

  const planOptions: PlanOption[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    priceThb: p.priceThb,
    durationDays: p.durationDays,
    classesIncluded: p.classesIncluded,
    color: p.color ?? "#64748b",
  }))

  const baseSelect = db
    .select({
      id: studentMemberships.id,
      studentEmail: studentMemberships.studentEmail,
      planId: studentMemberships.planId,
      planName: membershipPlans.name,
      planColor: membershipPlans.color,
      type: studentMemberships.type,
      startsOn: studentMemberships.startsOn,
      endsOn: studentMemberships.endsOn,
      classesRemaining: studentMemberships.classesRemaining,
      pricePaidThb: studentMemberships.pricePaidThb,
      notes: studentMemberships.notes,
      createdAt: studentMemberships.createdAt,
    })
    .from(studentMemberships)
    .leftJoin(
      membershipPlans,
      eq(membershipPlans.id, studentMemberships.planId),
    )
    .orderBy(desc(studentMemberships.createdAt))

  const memberships =
    emails === null
      ? await baseSelect
      : emails.length === 0
        ? []
        : await db
            .select({
              id: studentMemberships.id,
              studentEmail: studentMemberships.studentEmail,
              planId: studentMemberships.planId,
              planName: membershipPlans.name,
              planColor: membershipPlans.color,
              type: studentMemberships.type,
              startsOn: studentMemberships.startsOn,
              endsOn: studentMemberships.endsOn,
              classesRemaining: studentMemberships.classesRemaining,
              pricePaidThb: studentMemberships.pricePaidThb,
              notes: studentMemberships.notes,
              createdAt: studentMemberships.createdAt,
            })
            .from(studentMemberships)
            .leftJoin(
              membershipPlans,
              eq(membershipPlans.id, studentMemberships.planId),
            )
            .where(inArray(studentMemberships.studentEmail, emails))
            .orderBy(desc(studentMemberships.createdAt))

  const membershipsByStudent = new Map<string, typeof memberships>()
  for (const m of memberships) {
    const list = membershipsByStudent.get(m.studentEmail) ?? []
    list.push(m)
    membershipsByStudent.set(m.studentEmail, list)
  }

  const membershipIds = memberships.map((m) => m.id)
  const checkinDayRows =
    membershipIds.length === 0
      ? []
      : await db
          .select({
            membershipId: membershipCheckins.membershipId,
            day: sql<string>`to_char(${membershipCheckins.checkedInAt}, 'YYYY-MM-DD')`.as(
              "day",
            ),
            entries: sql<number>`count(*)::int`,
            decrementedAny: sql<boolean>`bool_or(${membershipCheckins.decremented})`,
          })
          .from(membershipCheckins)
          .where(inArray(membershipCheckins.membershipId, membershipIds))
          .groupBy(
            membershipCheckins.membershipId,
            sql`to_char(${membershipCheckins.checkedInAt}, 'YYYY-MM-DD')`,
          )
          .orderBy(
            desc(sql`to_char(${membershipCheckins.checkedInAt}, 'YYYY-MM-DD')`),
          )

  const checkinsByMembership = new Map<string, CheckinDay[]>()
  for (const c of checkinDayRows) {
    if (!c.membershipId) continue
    const list = checkinsByMembership.get(c.membershipId) ?? []
    list.push({ day: c.day, entries: c.entries, decremented: c.decrementedAny })
    checkinsByMembership.set(c.membershipId, list)
  }

  return { planOptions, membershipsByStudent, checkinsByMembership }
}
