"use server"

import { db } from "@/lib/db"
import {
  personalExpenseCategories,
  personalExpenses,
} from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { formatISO, parseISO } from "date-fns"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100)
}

const DEFAULT_PERSONAL_EXPENSE_CATEGORIES: Array<{
  name: string
  slug: string
  color: string
  sortOrder: number
}> = [
  { name: "Food", slug: "food", color: "#f59e0b", sortOrder: 10 },
  { name: "Transport", slug: "transport", color: "#0ea5e9", sortOrder: 20 },
  { name: "Rent", slug: "rent", color: "#a855f7", sortOrder: 30 },
  { name: "Health", slug: "health", color: "#22c55e", sortOrder: 40 },
  { name: "Fun", slug: "fun", color: "#ec4899", sortOrder: 50 },
  { name: "Other", slug: "other", color: "#64748b", sortOrder: 99 },
]

export async function ensureDefaultPersonalExpenseCategories(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalExpenseCategories)
    .where(eq(personalExpenseCategories.userId, userId))

  if (count > 0) return

  await db
    .insert(personalExpenseCategories)
    .values(
      DEFAULT_PERSONAL_EXPENSE_CATEGORIES.map((d) => ({ ...d, userId })),
    )
}

export async function listPersonalExpenseCategories(userId: string) {
  return db
    .select()
    .from(personalExpenseCategories)
    .where(eq(personalExpenseCategories.userId, userId))
    .orderBy(personalExpenseCategories.sortOrder, personalExpenseCategories.name)
}

export async function createPersonalExpenseCategory(formData: FormData) {
  const session = await requireDashboardSession()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")

  const color = String(formData.get("color") ?? "").trim() || "#64748b"
  const slug = slugify(name)
  if (!slug) throw new Error("Name must contain letters or numbers")

  const [row] = await db
    .insert(personalExpenseCategories)
    .values({ userId: session.userId, name, slug, color })
    .returning()

  revalidatePath("/dashboard/personal/expenses")
  return { id: row.id, name: row.name, color: row.color }
}

export async function updatePersonalExpenseCategory(
  id: string,
  formData: FormData,
) {
  const session = await requireDashboardSession()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")
  const color = String(formData.get("color") ?? "").trim() || "#64748b"
  const isActive = formData.get("isActive") === "on"

  await db
    .update(personalExpenseCategories)
    .set({ name, slug: slugify(name), color, isActive })
    .where(
      and(
        eq(personalExpenseCategories.id, id),
        eq(personalExpenseCategories.userId, session.userId),
      ),
    )

  revalidatePath("/dashboard/personal/expenses")
}

export async function deletePersonalExpenseCategory(id: string) {
  const session = await requireDashboardSession()
  const [used] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalExpenses)
    .where(
      and(
        eq(personalExpenses.categoryId, id),
        eq(personalExpenses.userId, session.userId),
      ),
    )
  if (used.count > 0) {
    throw new Error(
      `Can't delete: ${used.count} expense${used.count === 1 ? "" : "s"} still use this category. Reassign or delete those first.`,
    )
  }

  await db
    .delete(personalExpenseCategories)
    .where(
      and(
        eq(personalExpenseCategories.id, id),
        eq(personalExpenseCategories.userId, session.userId),
      ),
    )

  revalidatePath("/dashboard/personal/expenses")
}

async function readExpenseFields(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "").trim()
  if (!categoryId) throw new Error("Category is required")

  const amountThb = Math.max(
    0,
    Math.round(Number(formData.get("amountThb") ?? 0)),
  )
  if (amountThb <= 0) throw new Error("Amount must be greater than 0")

  const spentOnRaw = String(formData.get("spentOn") ?? "").trim()
  const spentOn = spentOnRaw
    ? formatISO(parseISO(spentOnRaw))
    : formatISO(new Date())

  const notes = String(formData.get("notes") ?? "").trim() || null

  return { categoryId, amountThb, spentOn, notes }
}

export async function createPersonalExpense(formData: FormData) {
  const session = await requireDashboardSession()
  const fields = await readExpenseFields(formData)

  await db.insert(personalExpenses).values({
    ...fields,
    userId: session.userId,
  })

  revalidatePath("/dashboard/personal/expenses")
}

export async function updatePersonalExpense(id: string, formData: FormData) {
  const session = await requireDashboardSession()
  const fields = await readExpenseFields(formData)

  await db
    .update(personalExpenses)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(personalExpenses.id, id),
        eq(personalExpenses.userId, session.userId),
      ),
    )

  revalidatePath("/dashboard/personal/expenses")
}

export async function deletePersonalExpense(id: string) {
  const session = await requireDashboardSession()
  await db
    .delete(personalExpenses)
    .where(
      and(
        eq(personalExpenses.id, id),
        eq(personalExpenses.userId, session.userId),
      ),
    )
  revalidatePath("/dashboard/personal/expenses")
}
