"use server"

import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

type BaseUnit = "g" | "ml" | "piece"
type Category = "drink" | "food" | "supplement" | "retail" | "other"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const sku = String(formData.get("sku") ?? "").trim() || null
  const description = String(formData.get("description") ?? "").trim() || null
  const category = String(formData.get("category") ?? "other") as Category
  const baseUnit = String(formData.get("baseUnit") ?? "piece") as BaseUnit
  const servingSize = Math.max(1, Number(formData.get("servingSize") ?? 1))
  const priceThb = Math.max(0, Number(formData.get("priceThb") ?? 0))
  const stockQty = Math.max(0, Number(formData.get("stockQty") ?? 0))
  const isActive = formData.get("isActive") === "on"
  if (!name) throw new Error("Name is required")
  return {
    name,
    sku,
    description,
    category,
    baseUnit,
    servingSize: Math.round(servingSize),
    priceThb: Math.round(priceThb),
    stockQty: Math.round(stockQty),
    isActive,
  }
}

export async function createProduct(formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)
  const [created] = await db.insert(products).values(fields).returning()
  if (fields.stockQty > 0) {
    await db.insert(stockMovements).values({
      productId: created.id,
      change: fields.stockQty,
      reason: "opening",
      note: "Opening stock",
    })
  }
  revalidatePath("/dashboard/products")
}

export async function updateProduct(id: string, formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)
  // Stock adjustments are explicit (via addStock) — do NOT overwrite stockQty here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stockQty: _stockQty, ...rest } = fields
  await db
    .update(products)
    .set({ ...rest, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id))
  revalidatePath("/dashboard/products")
}

export async function deleteProduct(id: string) {
  await requireManageScope()
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/dashboard/products")
}

/** Add or remove stock and log the movement. `change` is in product baseUnit (signed). */
export async function adjustStock(
  productId: string,
  change: number,
  reason: "purchase" | "adjustment" | "waste",
  note?: string,
) {
  await requireManageScope()
  if (!Number.isFinite(change) || change === 0) {
    throw new Error("Stock change must be a non-zero number")
  }
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!p) throw new Error("Product not found")
  const next = p.stockQty + change
  if (next < 0) throw new Error("Stock can't go below zero")
  await db
    .update(products)
    .set({ stockQty: next, updatedAt: new Date().toISOString() })
    .where(eq(products.id, productId))
  await db.insert(stockMovements).values({
    productId,
    change,
    reason,
    note: note ?? null,
  })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard/restaurant")
}

export async function addStockFromForm(productId: string, formData: FormData) {
  const change = Number(formData.get("change") ?? 0)
  const reason = String(formData.get("reason") ?? "purchase") as
    | "purchase"
    | "adjustment"
    | "waste"
  const note = String(formData.get("note") ?? "").trim() || undefined
  await adjustStock(productId, change, reason, note)
}
