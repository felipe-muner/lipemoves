"use server"

import { db } from "@/lib/db"
import { expenses, expenseCategories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { formatISO, parseISO } from "date-fns"

const ALLOWED_METHODS = ["cash", "card", "transfer", "other"] as const
type PaymentMethod = (typeof ALLOWED_METHODS)[number]

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

async function readFields(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "").trim()
  if (!categoryId) throw new Error("Category is required")

  const [cat] = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.id, categoryId))
    .limit(1)
  if (!cat) throw new Error("Selected category no longer exists")

  const amountThb = Math.max(
    0,
    Math.round(Number(formData.get("amountThb") ?? 0)),
  )

  const incurredOnRaw = String(formData.get("incurredOn") ?? "").trim()
  const incurredOn = incurredOnRaw
    ? formatISO(parseISO(incurredOnRaw))
    : formatISO(new Date())

  const vendor = String(formData.get("vendor") ?? "").trim() || null
  const description = String(formData.get("description") ?? "").trim() || null
  const employeeId = String(formData.get("employeeId") ?? "").trim() || null

  const rawMethod = String(formData.get("paymentMethod") ?? "").trim()
  const paymentMethod: PaymentMethod | null = ALLOWED_METHODS.includes(
    rawMethod as PaymentMethod,
  )
    ? (rawMethod as PaymentMethod)
    : null

  const paidAtRaw = String(formData.get("paidAt") ?? "").trim()
  const paidAt = paidAtRaw ? formatISO(parseISO(paidAtRaw)) : null

  const receiptUrl = String(formData.get("receiptUrl") ?? "").trim() || null

  return {
    categoryId,
    amountThb,
    incurredOn,
    vendor,
    description,
    employeeId,
    paymentMethod,
    paidAt,
    receiptUrl,
  }
}

export async function createExpense(formData: FormData) {
  const session = await requireManageScope()
  const fields = await readFields(formData)

  if (fields.amountThb <= 0) throw new Error("Amount must be greater than 0")

  await db.insert(expenses).values({
    ...fields,
    createdByUserId: session.userId,
  })

  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/expenses")
}

export async function updateExpense(id: string, formData: FormData) {
  await requireManageScope()
  const fields = await readFields(formData)

  if (fields.amountThb <= 0) throw new Error("Amount must be greater than 0")

  await db
    .update(expenses)
    .set({
      ...fields,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(expenses.id, id))

  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/expenses")
}

export async function deleteExpense(id: string) {
  await requireManageScope()
  await db.delete(expenses).where(eq(expenses.id, id))
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/expenses")
}
