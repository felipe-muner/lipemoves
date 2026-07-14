"use server"

import { db } from "@/lib/db"
import { movementCategories, movementEntries } from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/user"
import { formatISO, parseISO } from "date-fns"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100)
}

/** Movement lives on both the admin CRM and the customer /me tracker. */
function revalidateMovement() {
  revalidatePath("/me")
  revalidatePath("/dashboard/personal/movement")
}

const DEFAULT_MOVEMENT_CATEGORIES: Array<{
  name: string
  slug: string
  color: string
  sortOrder: number
}> = [
  { name: "Yoga", slug: "yoga", color: "#a855f7", sortOrder: 10 },
  { name: "Kettlebell", slug: "kettlebell", color: "#ef4444", sortOrder: 20 },
  { name: "Gym", slug: "gym", color: "#0ea5e9", sortOrder: 30 },
  { name: "Mobility", slug: "mobility", color: "#22c55e", sortOrder: 40 },
  { name: "Calisthenic", slug: "calisthenic", color: "#f59e0b", sortOrder: 50 },
  { name: "Hike", slug: "hike", color: "#84cc16", sortOrder: 60 },
]

export async function ensureDefaultMovementCategories(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(movementCategories)
    .where(eq(movementCategories.userId, userId))

  if (count > 0) return

  await db
    .insert(movementCategories)
    .values(
      DEFAULT_MOVEMENT_CATEGORIES.map((d) => ({ ...d, userId })),
    )
}

export async function listMovementCategories(userId: string) {
  return db
    .select()
    .from(movementCategories)
    .where(eq(movementCategories.userId, userId))
    .orderBy(movementCategories.sortOrder, movementCategories.name)
}

export async function createMovementCategory(formData: FormData) {
  const session = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")

  const color = String(formData.get("color") ?? "").trim() || "#22c55e"
  const slug = slugify(name)
  if (!slug) throw new Error("Name must contain letters or numbers")

  const [row] = await db
    .insert(movementCategories)
    .values({ userId: session.userId, name, slug, color })
    .returning()

  revalidateMovement()
  return { id: row.id, name: row.name, color: row.color }
}

export async function updateMovementCategory(
  id: string,
  formData: FormData,
) {
  const session = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")
  const color = String(formData.get("color") ?? "").trim() || "#22c55e"
  const isActive = formData.get("isActive") === "on"

  await db
    .update(movementCategories)
    .set({ name, slug: slugify(name), color, isActive })
    .where(
      and(
        eq(movementCategories.id, id),
        eq(movementCategories.userId, session.userId),
      ),
    )

  revalidateMovement()
}

export async function deleteMovementCategory(id: string) {
  const session = await requireUser()
  const [used] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(movementEntries)
    .where(
      and(
        eq(movementEntries.categoryId, id),
        eq(movementEntries.userId, session.userId),
      ),
    )
  if (used.count > 0) {
    throw new Error(
      `Can't delete: ${used.count} session${used.count === 1 ? "" : "s"} still use this category. Reassign or delete those first.`,
    )
  }

  await db
    .delete(movementCategories)
    .where(
      and(
        eq(movementCategories.id, id),
        eq(movementCategories.userId, session.userId),
      ),
    )

  revalidateMovement()
}

async function readMovementFields(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "").trim()
  if (!categoryId) throw new Error("Category is required")

  const performedOnRaw = String(formData.get("performedOn") ?? "").trim()
  const performedOn = performedOnRaw
    ? formatISO(parseISO(performedOnRaw))
    : formatISO(new Date())

  const durationRaw = String(formData.get("durationMin") ?? "").trim()
  const durationMin = durationRaw
    ? Math.max(0, Math.round(Number(durationRaw)))
    : null

  const notes = String(formData.get("notes") ?? "").trim() || null

  return { categoryId, performedOn, durationMin, notes }
}

export async function createMovementEntry(formData: FormData) {
  const session = await requireUser()
  const fields = await readMovementFields(formData)

  await db
    .insert(movementEntries)
    .values({ ...fields, userId: session.userId })

  revalidateMovement()
}

export async function updateMovementEntry(id: string, formData: FormData) {
  const session = await requireUser()
  const fields = await readMovementFields(formData)

  await db
    .update(movementEntries)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(movementEntries.id, id),
        eq(movementEntries.userId, session.userId),
      ),
    )

  revalidateMovement()
}

export async function deleteMovementEntry(id: string) {
  const session = await requireUser()
  await db
    .delete(movementEntries)
    .where(
      and(
        eq(movementEntries.id, id),
        eq(movementEntries.userId, session.userId),
      ),
    )
  revalidateMovement()
}
