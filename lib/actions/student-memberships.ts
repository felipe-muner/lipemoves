"use server"

import { db } from "@/lib/db"
import { membershipPlans, studentMemberships } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { addDays, formatISO, parseISO } from "date-fns"

const ALLOWED_TYPES = [
  "drop_in",
  "monthly",
  "class_pack",
  "free_pass",
  "custom",
] as const
type MembershipType = (typeof ALLOWED_TYPES)[number]

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

async function readFields(formData: FormData) {
  const studentEmail = String(formData.get("studentEmail") ?? "").trim()
  if (!studentEmail) throw new Error("Student email required")

  const planIdRaw = String(formData.get("planId") ?? "").trim()
  const planId = planIdRaw || null

  let plan = null
  if (planId) {
    const [p] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .limit(1)
    plan = p ?? null
  }

  const rawType = String(formData.get("type") ?? plan?.type ?? "custom")
  const type: MembershipType = (
    ALLOWED_TYPES.includes(rawType as MembershipType) ? rawType : "custom"
  ) as MembershipType

  const startsOnRaw = String(formData.get("startsOn") ?? "").trim()
  const startsOn = startsOnRaw
    ? formatISO(parseISO(startsOnRaw))
    : formatISO(new Date())

  const endsOnRaw = String(formData.get("endsOn") ?? "").trim()
  let endsOn: string | null = endsOnRaw ? formatISO(parseISO(endsOnRaw)) : null

  // If no explicit endsOn but a plan with duration, derive it from startsOn.
  if (!endsOn && plan?.durationDays != null && plan.durationDays > 0) {
    endsOn = formatISO(addDays(parseISO(startsOn), plan.durationDays))
  }

  const classesRaw = String(formData.get("classesRemaining") ?? "").trim()
  const classesRemaining =
    classesRaw !== ""
      ? Math.max(0, Math.round(Number(classesRaw)))
      : (plan?.classesIncluded ?? null)

  const priceRaw = String(formData.get("pricePaidThb") ?? "").trim()
  const pricePaidThb =
    priceRaw !== ""
      ? Math.max(0, Math.round(Number(priceRaw)))
      : (plan?.priceThb ?? 0)

  const notes = String(formData.get("notes") ?? "").trim() || null

  return {
    studentEmail,
    planId,
    type,
    startsOn,
    endsOn,
    classesRemaining,
    pricePaidThb,
    notes,
  }
}

export async function recordStudentMembership(formData: FormData) {
  await requireManageScope()
  const fields = await readFields(formData)

  await db.insert(studentMemberships).values(fields)

  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/income")
}

export async function updateStudentMembership(id: string, formData: FormData) {
  await requireManageScope()
  const fields = await readFields(formData)

  await db
    .update(studentMemberships)
    .set(fields)
    .where(eq(studentMemberships.id, id))

  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/income")
}

export async function deleteStudentMembership(id: string) {
  await requireManageScope()
  await db.delete(studentMemberships).where(eq(studentMemberships.id, id))
  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/income")
}
