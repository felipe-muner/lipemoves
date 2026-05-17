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
    name: "Day Pass — 1 Day",
    slug: "day_pass_1",
    type: "drop_in",
    durationDays: 1,
    classesIncluded: 1,
    priceThb: 500,
    color: "#f59e0b",
    description: "Single-day access to all activities",
    sortOrder: 10,
  },
  {
    name: "Day Pass — 5 Days",
    slug: "day_pass_5",
    type: "class_pack",
    durationDays: 30,
    classesIncluded: 5,
    priceThb: 2200,
    color: "#f97316",
    description: "5 day passes, use within 30 days",
    sortOrder: 11,
  },
  {
    name: "Day Pass — 10 Days",
    slug: "day_pass_10",
    type: "class_pack",
    durationDays: 90,
    classesIncluded: 10,
    priceThb: 4000,
    color: "#ea580c",
    description: "10 day passes, use within 90 days",
    sortOrder: 12,
  },
  {
    name: "1 Month Unlimited",
    slug: "month_1_unlimited",
    type: "monthly",
    durationDays: 30,
    classesIncluded: null,
    priceThb: 4500,
    color: "#10b981",
    description: "Unlimited access to all activities for 30 days",
    sortOrder: 20,
  },
  {
    name: "3 Months Unlimited",
    slug: "month_3_unlimited",
    type: "monthly",
    durationDays: 90,
    classesIncluded: null,
    priceThb: 12000,
    color: "#0ea5e9",
    description: "Unlimited access to all activities for 90 days",
    sortOrder: 30,
  },
  {
    name: "6 Months Unlimited",
    slug: "month_6_unlimited",
    type: "monthly",
    durationDays: 180,
    classesIncluded: null,
    priceThb: 22000,
    color: "#6366f1",
    description: "Unlimited access to all activities for 180 days",
    sortOrder: 40,
  },
  {
    name: "1 Year Unlimited",
    slug: "year_1_unlimited",
    type: "monthly",
    durationDays: 365,
    classesIncluded: null,
    priceThb: 39000,
    color: "#a855f7",
    description: "Unlimited access to all activities for 365 days",
    sortOrder: 50,
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
