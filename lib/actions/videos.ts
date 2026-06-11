"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { syncAllFromBunny } from "@/lib/bunny/sync"
import { deleteBunnyVideo, setBunnyVideoTags } from "@/lib/bunny/api"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden")
  }
}

/** Pull the whole Bunny library: upsert videos + tags, unpublish deleted. */
export async function syncVideosFromBunny() {
  await requireAdmin()
  await syncAllFromBunny()
  revalidatePath("/dashboard/videos")
  revalidatePath("/videos")
}

export async function togglePublish(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const next = formData.get("next") === "true"
  if (!id) return
  await db.update(videos).set({ isPublished: next }).where(eq(videos.id, id))
  revalidatePath("/dashboard/videos")
}

/** Update tags in the DB and on Bunny (kept in sync both ways). */
export async function updateVideoTags(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const tags = [
    ...new Set(
      String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]

  const [video] = await db
    .select({ bunnyVideoId: videos.bunnyVideoId })
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1)
  if (!video) return

  await db.update(videos).set({ tags }).where(eq(videos.id, id))
  try {
    await setBunnyVideoTags(video.bunnyVideoId, tags)
  } catch (error) {
    console.error("bunny tags update error:", error)
  }

  revalidatePath("/dashboard/videos")
  revalidatePath("/videos")
}

export async function toggleFree(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const next = formData.get("next") === "true"
  if (!id) return
  await db.update(videos).set({ isFree: next }).where(eq(videos.id, id))
  revalidatePath("/dashboard/videos")
  revalidatePath("/videos")
}

/** Deletes on Bunny too — otherwise the next sync would resurrect the row. */
export async function deleteVideo(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const [video] = await db
    .select({ bunnyVideoId: videos.bunnyVideoId })
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1)

  if (video?.bunnyVideoId) {
    try {
      await deleteBunnyVideo(video.bunnyVideoId)
    } catch (error) {
      console.error("bunny delete error:", error)
    }
  }

  await db.delete(videos).where(eq(videos.id, id))
  revalidatePath("/dashboard/videos")
  revalidatePath("/videos")
}
