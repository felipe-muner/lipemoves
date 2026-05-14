"use server"

import { db } from "@/lib/db"
import {
  sales,
  saleItems,
  products,
  stockMovements,
  restaurantTables,
} from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

type PaymentMethod = "cash" | "card" | "transfer" | "other"

async function requireScope() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") throw new Error("No permission")
  return session
}

function recompute(items: { quantity: number; unitPriceThb: number }[]) {
  const subtotal = items.reduce((acc, i) => acc + i.unitPriceThb * i.quantity, 0)
  return { subtotal }
}

/** Returns the open sale for a table, creating it if none exists. */
export async function openOrCreateTab(tableId: string, employeeId: string | null) {
  await requireScope()
  const [existing] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tableId, tableId), eq(sales.status, "open")))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(sales)
    .values({ tableId, employeeId, status: "open" })
    .returning()
  // Mark the table as occupied
  await db
    .update(restaurantTables)
    .set({ status: "occupied", updatedAt: new Date().toISOString() })
    .where(eq(restaurantTables.id, tableId))
  revalidatePath("/dashboard/restaurant")
  return created
}

export async function addItemToSale(
  saleId: string,
  productId: string,
  quantity: number = 1,
  notes?: string,
) {
  await requireScope()
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!p) throw new Error("Product not found")
  if (!p.isActive) throw new Error("Product is inactive")
  if (quantity <= 0) throw new Error("Quantity must be positive")

  // If an identical line already exists (same product, same price, no notes
  // conflict), bump its quantity instead of inserting a new row.
  const [existing] = await db
    .select()
    .from(saleItems)
    .where(and(eq(saleItems.saleId, saleId), eq(saleItems.productId, productId)))
    .limit(1)

  if (existing && !notes && !existing.notes) {
    const nextQty = existing.quantity + quantity
    await db
      .update(saleItems)
      .set({
        quantity: nextQty,
        totalThb: existing.unitPriceThb * nextQty,
      })
      .where(eq(saleItems.id, existing.id))
  } else {
    await db.insert(saleItems).values({
      saleId,
      productId,
      productName: p.name,
      quantity,
      unitPriceThb: p.priceThb,
      totalThb: p.priceThb * quantity,
      notes: notes ?? null,
    })
  }

  await rollupSale(saleId)
  revalidatePath("/dashboard/restaurant")
}

export async function removeSaleItem(saleItemId: string) {
  await requireScope()
  const [item] = await db.select().from(saleItems).where(eq(saleItems.id, saleItemId)).limit(1)
  if (!item) return
  await db.delete(saleItems).where(eq(saleItems.id, saleItemId))
  await rollupSale(item.saleId)
  revalidatePath("/dashboard/restaurant")
}

export async function updateSaleItemQuantity(saleItemId: string, quantity: number) {
  await requireScope()
  if (quantity <= 0) {
    await removeSaleItem(saleItemId)
    return
  }
  const [item] = await db.select().from(saleItems).where(eq(saleItems.id, saleItemId)).limit(1)
  if (!item) return
  await db
    .update(saleItems)
    .set({
      quantity,
      totalThb: item.unitPriceThb * quantity,
    })
    .where(eq(saleItems.id, saleItemId))
  await rollupSale(item.saleId)
  revalidatePath("/dashboard/restaurant")
}

async function rollupSale(saleId: string) {
  const items = await db
    .select({ quantity: saleItems.quantity, unitPriceThb: saleItems.unitPriceThb })
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId))
  const { subtotal } = recompute(items)
  const [s] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1)
  if (!s) return
  const total = Math.max(0, subtotal - s.discountThb + s.tipThb)
  await db
    .update(sales)
    .set({
      subtotalThb: subtotal,
      totalThb: total,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sales.id, saleId))
}

export async function updateSaleAdjustments(
  saleId: string,
  formData: FormData,
) {
  await requireScope()
  const discount = Math.max(0, Number(formData.get("discountThb") ?? 0))
  const tip = Math.max(0, Number(formData.get("tipThb") ?? 0))
  const note = String(formData.get("customerNote") ?? "").trim() || null
  await db
    .update(sales)
    .set({
      discountThb: discount,
      tipThb: tip,
      customerNote: note,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sales.id, saleId))
  await rollupSale(saleId)
  revalidatePath("/dashboard/restaurant")
}

export async function paySale(saleId: string, formData: FormData) {
  await requireScope()
  const method = String(formData.get("paymentMethod") ?? "cash") as PaymentMethod
  const note = String(formData.get("paymentNote") ?? "").trim() || null
  const tip = Math.max(0, Number(formData.get("tipThb") ?? 0))
  const discount = Math.max(0, Number(formData.get("discountThb") ?? 0))

  const [s] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1)
  if (!s) throw new Error("Sale not found")
  if (s.status !== "open") throw new Error("Sale is not open")

  // Update adjustments + rollup before paying
  await db
    .update(sales)
    .set({
      discountThb: discount,
      tipThb: tip,
    })
    .where(eq(sales.id, saleId))
  await rollupSale(saleId)

  // Pull final items + decrement stock per item × servingSize
  const items = await db
    .select({
      productId: saleItems.productId,
      productName: saleItems.productName,
      quantity: saleItems.quantity,
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId))

  for (const it of items) {
    if (!it.productId) continue
    const [p] = await db.select().from(products).where(eq(products.id, it.productId)).limit(1)
    if (!p) continue
    const consumed = p.servingSize * it.quantity
    const nextStock = Math.max(0, p.stockQty - consumed)
    await db
      .update(products)
      .set({ stockQty: nextStock, updatedAt: new Date().toISOString() })
      .where(eq(products.id, it.productId))
    await db.insert(stockMovements).values({
      productId: it.productId,
      change: -consumed,
      reason: "sale",
      refType: "sale",
      refId: saleId,
      note: `${it.quantity}× ${it.productName}`,
    })
  }

  await db
    .update(sales)
    .set({
      status: "paid",
      paymentMethod: method,
      paymentNote: note,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sales.id, saleId))

  // Free the table
  if (s.tableId) {
    await db
      .update(restaurantTables)
      .set({ status: "open", updatedAt: new Date().toISOString() })
      .where(eq(restaurantTables.id, s.tableId))
  }

  revalidatePath("/dashboard/restaurant")
}

export async function cancelSale(saleId: string) {
  await requireScope()
  const [s] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1)
  if (!s) return
  await db
    .update(sales)
    .set({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sales.id, saleId))
  if (s.tableId) {
    await db
      .update(restaurantTables)
      .set({ status: "open", updatedAt: new Date().toISOString() })
      .where(eq(restaurantTables.id, s.tableId))
  }
  revalidatePath("/dashboard/restaurant")
}
