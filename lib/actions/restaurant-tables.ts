"use server"

import { db } from "@/lib/db"
import { restaurantTables } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

type Status = "open" | "occupied" | "cleaning" | "closed"

async function requireScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

function readFields(formData: FormData) {
  const tableNumber = String(formData.get("tableNumber") ?? "").trim()
  const room = String(formData.get("room") ?? "").trim() || null
  const seatsRaw = String(formData.get("seats") ?? "").trim()
  const seats = seatsRaw ? Number(seatsRaw) : null
  const status = (String(formData.get("status") ?? "open") as Status) || "open"
  const isActive = formData.get("isActive") === "on"
  const notes = String(formData.get("notes") ?? "").trim() || null
  if (!tableNumber) throw new Error("Table number is required")
  return { tableNumber, room, seats, status, isActive, notes }
}

export async function createRestaurantTable(formData: FormData) {
  await requireScope()
  await db.insert(restaurantTables).values(readFields(formData))
  revalidatePath("/dashboard/restaurant-tables")
  revalidatePath("/dashboard/restaurant")
}

export async function updateRestaurantTable(id: string, formData: FormData) {
  await requireScope()
  await db
    .update(restaurantTables)
    .set({ ...readFields(formData), updatedAt: new Date().toISOString() })
    .where(eq(restaurantTables.id, id))
  revalidatePath("/dashboard/restaurant-tables")
  revalidatePath("/dashboard/restaurant")
}

export async function deleteRestaurantTable(id: string) {
  await requireScope()
  await db.delete(restaurantTables).where(eq(restaurantTables.id, id))
  revalidatePath("/dashboard/restaurant-tables")
  revalidatePath("/dashboard/restaurant")
}
