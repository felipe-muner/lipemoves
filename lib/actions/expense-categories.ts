"use server"

import { db } from "@/lib/db"
import { expenseCategories, expenses } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

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
  color: string
  description: string
  sortOrder: number
}> = [
  { name: "Rent", slug: "rent", color: "#0ea5e9", description: "Studio rent", sortOrder: 10 },
  { name: "Utilities", slug: "utilities", color: "#22c55e", description: "Electricity, water, internet", sortOrder: 20 },
  { name: "Salaries (non-teacher)", slug: "salary", color: "#a855f7", description: "Managers, cleaners, waiters", sortOrder: 30 },
  { name: "Marketing", slug: "marketing", color: "#ec4899", description: "Ads, promotions, social media", sortOrder: 40 },
  { name: "Supplies", slug: "supplies", color: "#f59e0b", description: "Inventory, mats, restaurant ingredients", sortOrder: 50 },
  { name: "Maintenance", slug: "maintenance", color: "#ef4444", description: "Repairs, plumber, equipment", sortOrder: 60 },
  { name: "Taxes & fees", slug: "taxes_fees", color: "#64748b", description: "Government, banking, transaction fees", sortOrder: 70 },
  { name: "Other", slug: "other", color: "#475569", description: "Catch-all", sortOrder: 99 },
]

/**
 * Idempotent: seeds default categories on first use. Safe to call from any
 * finance page — it does nothing once defaults exist.
 */
export async function ensureDefaultExpenseCategories() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(expenseCategories)

  if (count > 0) return

  await db.insert(expenseCategories).values(
    DEFAULTS.map((d) => ({ ...d, isSystem: true })),
  )
}

export async function createExpenseCategory(formData: FormData) {
  await requireManageScope()

  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")

  const color = String(formData.get("color") ?? "").trim() || "#64748b"
  const description = String(formData.get("description") ?? "").trim() || null
  const sortOrder = Math.max(
    0,
    Math.round(Number(formData.get("sortOrder") ?? 0)),
  )

  const slug = slugify(name)
  if (!slug) throw new Error("Name must contain at least one letter or number")

  await db.insert(expenseCategories).values({
    name,
    slug,
    color,
    description,
    sortOrder,
  })

  revalidatePath("/dashboard/finance/categories")
  revalidatePath("/dashboard/finance/expenses")
}

export async function updateExpenseCategory(id: string, formData: FormData) {
  await requireManageScope()

  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")

  const color = String(formData.get("color") ?? "").trim() || "#64748b"
  const description = String(formData.get("description") ?? "").trim() || null
  const isActive = formData.get("isActive") === "on"
  const sortOrder = Math.max(
    0,
    Math.round(Number(formData.get("sortOrder") ?? 0)),
  )

  await db
    .update(expenseCategories)
    .set({
      name,
      color,
      description,
      isActive,
      sortOrder,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(expenseCategories.id, id))

  revalidatePath("/dashboard/finance/categories")
  revalidatePath("/dashboard/finance/expenses")
}

export async function deleteExpenseCategory(id: string) {
  await requireManageScope()

  const [cat] = await db
    .select({ isSystem: expenseCategories.isSystem })
    .from(expenseCategories)
    .where(eq(expenseCategories.id, id))
    .limit(1)
  if (!cat) throw new Error("Category not found")
  if (cat.isSystem) {
    throw new Error("System categories can't be deleted — deactivate instead")
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(expenses)
    .where(eq(expenses.categoryId, id))
  if (count > 0) {
    throw new Error(
      `Can't delete: ${count} expense(s) use this category. Reassign or delete them first.`,
    )
  }

  await db.delete(expenseCategories).where(eq(expenseCategories.id, id))

  revalidatePath("/dashboard/finance/categories")
  revalidatePath("/dashboard/finance/expenses")
}
