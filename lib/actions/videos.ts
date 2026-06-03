"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { videos, categories } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden")
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Name is required")
  const slug = slugify(name)
  await db
    .insert(categories)
    .values({ name, slug })
    .onConflictDoNothing({ target: categories.slug })
  revalidatePath("/dashboard/videos")
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath("/dashboard/videos")
}

export async function createVideo(formData: FormData) {
  await requireAdmin()
  const title = String(formData.get("title") ?? "").trim()
  const bunnyVideoId = String(formData.get("bunnyVideoId") ?? "").trim()
  if (!title) throw new Error("Title is required")
  if (!bunnyVideoId) throw new Error("Bunny video ID is required")

  const categoryRaw = String(formData.get("categoryId") ?? "")
  const categoryId = categoryRaw && categoryRaw !== "none" ? categoryRaw : ""
  const description = String(formData.get("description") ?? "").trim()
  const durationRaw = String(formData.get("durationSeconds") ?? "").trim()

  await db.insert(videos).values({
    title,
    slug: slugify(title),
    description: description || null,
    categoryId: categoryId || null,
    bunnyVideoId,
    durationSeconds: durationRaw ? Number(durationRaw) : null,
    isFree: formData.get("isFree") === "on",
    isPublished: formData.get("isPublished") === "on",
  })
  revalidatePath("/dashboard/videos")
}

export async function togglePublish(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const next = formData.get("next") === "true"
  if (!id) return
  await db.update(videos).set({ isPublished: next }).where(eq(videos.id, id))
  revalidatePath("/dashboard/videos")
}

export async function deleteVideo(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await db.delete(videos).where(eq(videos.id, id))
  revalidatePath("/dashboard/videos")
}
