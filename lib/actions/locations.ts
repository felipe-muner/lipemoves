"use server"

import { db } from "@/lib/db"
import { locations, yogaClasses } from "@/lib/db/schema"
import { eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

/** Make sure at least one location exists. Returns the default one. */
export async function ensureDefaultLocation() {
  const [existing] = await db.select().from(locations).limit(1)
  if (existing) {
    // Make sure exactly one row is flagged isDefault
    const hasDefault = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.isDefault, true))
      .limit(1)
    if (hasDefault.length === 0) {
      await db
        .update(locations)
        .set({ isDefault: true })
        .where(eq(locations.id, existing.id))
    }
    return existing
  }
  const [created] = await db
    .insert(locations)
    .values({
      name: "Main Shala",
      color: "#fbbf24",
      isDefault: true,
    })
    .returning()
  return created
}

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const color = String(formData.get("color") ?? "").trim() || "#fbbf24"
  const isDefault = formData.get("isDefault") === "on"
  const isActive = formData.get("isActive") === "on"
  if (!name) throw new Error("Name is required")
  if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) throw new Error("Invalid color")
  return { name, description, color, isDefault, isActive }
}

export async function createLocation(formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)

  const [created] = await db.insert(locations).values(fields).returning()

  if (fields.isDefault) {
    await db
      .update(locations)
      .set({ isDefault: false })
      .where(ne(locations.id, created.id))
  }

  revalidatePath("/dashboard/locations")
  revalidatePath("/dashboard/classes")
}

export async function updateLocation(id: string, formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)

  await db
    .update(locations)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(locations.id, id))

  if (fields.isDefault) {
    await db
      .update(locations)
      .set({ isDefault: false })
      .where(ne(locations.id, id))
  }

  revalidatePath("/dashboard/locations")
  revalidatePath("/dashboard/classes")
}

export async function deleteLocation(id: string) {
  await requireManageScope()
  // Clear from classes (FK already does this via onDelete set null, but be explicit)
  await db
    .update(yogaClasses)
    .set({ locationId: null })
    .where(eq(yogaClasses.locationId, id))
  await db.delete(locations).where(eq(locations.id, id))
  // Maintain invariant: at least one location exists
  await ensureDefaultLocation()
  revalidatePath("/dashboard/locations")
  revalidatePath("/dashboard/classes")
}
