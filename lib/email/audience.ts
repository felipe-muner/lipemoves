import { db } from "@/lib/db"
import { employees, students, studentMemberships, classAttendance, yogaClasses } from "@/lib/db/schema"
import { and, eq, gte, inArray, isNotNull } from "drizzle-orm"
import { formatISO } from "date-fns"

/** Source flags — recipients are the union of every selected source. */
export interface AudienceFilter {
  employees?: boolean
  allStudents?: boolean
  activeMembershipsOnly?: boolean
  /** UUIDs of classes — recipients are the attendees of those classes. */
  classIds?: string[]
}

export interface Recipient {
  email: string
  name: string | null
  source: "teacher" | "student"
}

export interface ResolvedAudience {
  recipients: Recipient[]
  summary: string
}

export async function resolveAudience(
  filter: AudienceFilter,
): Promise<ResolvedAudience> {
  const map = new Map<string, Recipient>()
  const parts: string[] = []

  if (filter.employees) {
    const rows = await db
      .select({ email: employees.email, name: employees.name })
      .from(employees)
      .where(eq(employees.isActive, true))
    rows.forEach((r) => map.set(r.email.toLowerCase(), { ...r, source: "teacher" }))
    parts.push(`Teachers (${rows.length})`)
  }

  // Students - either all, or only those with an active monthly membership
  if (filter.allStudents || filter.activeMembershipsOnly) {
    if (filter.activeMembershipsOnly) {
      const today = formatISO(new Date())
      const rows = await db
        .selectDistinct({
          email: students.email,
          name: students.name,
        })
        .from(studentMemberships)
        .innerJoin(students, eq(students.email, studentMemberships.studentEmail))
        .where(
          and(
            eq(studentMemberships.type, "monthly"),
            isNotNull(studentMemberships.endsOn),
            gte(studentMemberships.endsOn, today),
          ),
        )
      rows.forEach((r) => map.set(r.email.toLowerCase(), { ...r, source: "student" }))
      parts.push(`Active members (${rows.length})`)
    } else {
      const rows = await db
        .select({ email: students.email, name: students.name })
        .from(students)
      rows.forEach((r) => map.set(r.email.toLowerCase(), { ...r, source: "student" }))
      parts.push(`All students (${rows.length})`)
    }
  }

  if (filter.classIds && filter.classIds.length > 0) {
    const rows = await db
      .selectDistinct({
        email: students.email,
        name: students.name,
      })
      .from(classAttendance)
      .innerJoin(students, eq(students.email, classAttendance.studentEmail))
      .where(inArray(classAttendance.classId, filter.classIds))
    rows.forEach((r) => map.set(r.email.toLowerCase(), { ...r, source: "student" }))

    // Also get the class names for the summary
    const classNames = await db
      .select({ name: yogaClasses.name })
      .from(yogaClasses)
      .where(inArray(yogaClasses.id, filter.classIds))
    parts.push(
      `${classNames.length} ${classNames.length === 1 ? "class" : "classes"} attendees`,
    )
  }

  const recipients = Array.from(map.values())
  const summary = parts.length ? parts.join(" + ") : "No audience selected"

  return { recipients, summary }
}

/** Count without expanding the full list — used in the live recipient count badge. */
export async function countAudience(filter: AudienceFilter): Promise<{ count: number; summary: string }> {
  const r = await resolveAudience(filter)
  return { count: r.recipients.length, summary: r.summary }
}
