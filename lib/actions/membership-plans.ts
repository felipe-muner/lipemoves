"use server"

import { db } from "@/lib/db"
import { membershipPlans, studentMemberships } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

const ALLOWED_TYPES = [
  "drop_in",
  "monthly",
  "class_pack",
  "free_pass",
  "custom",
] as const
type PlanType = (typeof ALLOWED_TYPES)[number]

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100)
}

const DEFAULTS: Array<{
  name: string
  slug: string
  type: PlanType
  durationDays: number | null
  classesIncluded: number | null
  priceThb: number
  color: string
  description: string
  sortOrder: number
}> = [
  {
    name: "Drop-in",
    slug: "drop_in",
    type: "drop_in",
    durationDays: 1,
    classesIncluded: 1,
    priceThb: 350,
    color: "#a855f7",
    description: "Single class",
    sortOrder: 10,
  },
  {
    name: "10 Class Pack",
    slug: "class_pack_10",
    type: "class_pack",
    durationDays: 90,
    classesIncluded: 10,
    priceThb: 3000,
    color: "#0ea5e9",
    description: "10 classes, valid 90 days",
    sortOrder: 20,
  },
  {
    name: "1 Month Unlimited",
    slug: "monthly_unlimited",
    type: "monthly",
    durationDays: 30,
    classesIncluded: null,
    priceThb: 3500,
    color: "#10b981",
    description: "Unlimited classes for 30 days",
    sortOrder: 30,
  },
  {
    name: "Free Pass",
    slug: "free_pass",
    type: "free_pass",
    durationDays: 7,
    classesIncluded: 1,
    priceThb: 0,
    color: "#64748b",
    description: "1 free intro class, valid 7 days",
    sortOrder: 40,
  },
]

export async function ensureDefaultMembershipPlans() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(membershipPlans)
  if (count > 0) return

  await db.insert(membershipPlans).values(DEFAULTS)
}

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")

  const rawType = String(formData.get("type") ?? "custom")
  const type: PlanType = (
    ALLOWED_TYPES.includes(rawType as PlanType) ? rawType : "custom"
  ) as PlanType

  const durationRaw = String(formData.get("durationDays") ?? "").trim()
  const durationDays =
    durationRaw === "" ? null : Math.max(0, Math.round(Number(durationRaw)))

  const classesRaw = String(formData.get("classesIncluded") ?? "").trim()
  const classesIncluded =
    classesRaw === "" ? null : Math.max(0, Math.round(Number(classesRaw)))

  const priceThb = Math.max(
    0,
    Math.round(Number(formData.get("priceThb") ?? 0)),
  )
  const color = String(formData.get("color") ?? "#0ea5e9").trim() || "#0ea5e9"
  const description = String(formData.get("description") ?? "").trim() || null
  const sortOrder = Math.max(
    0,
    Math.round(Number(formData.get("sortOrder") ?? 0)),
  )
  const isActive = formData.get("isActive") === "on"

  return {
    name,
    type,
    durationDays,
    classesIncluded,
    priceThb,
    color,
    description,
    sortOrder,
    isActive,
  }
}

export async function createMembershipPlan(formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)
  const slug = slugify(fields.name)
  if (!slug) throw new Error("Name must contain a letter or number")

  await db.insert(membershipPlans).values({
    ...fields,
    slug,
  })

  revalidatePath("/dashboard/memberships")
  revalidatePath("/dashboard/students")
}

export async function updateMembershipPlan(id: string, formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)

  await db
    .update(membershipPlans)
    .set({
      ...fields,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(membershipPlans.id, id))

  revalidatePath("/dashboard/memberships")
  revalidatePath("/dashboard/students")
}

export async function deleteMembershipPlan(id: string) {
  await requireManageScope()
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentMemberships)
    .where(eq(studentMemberships.planId, id))
  if (count > 0) {
    throw new Error(
      `Can't delete: ${count} membership record(s) reference this plan. Deactivate instead.`,
    )
  }

  await db.delete(membershipPlans).where(eq(membershipPlans.id, id))

  revalidatePath("/dashboard/memberships")
}
