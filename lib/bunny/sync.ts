import { and, eq, notInArray } from "drizzle-orm"
import { formatISO } from "date-fns"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import {
  listBunnyVideos,
  tagsFromMetaTags,
  slugFromTitle,
  BUNNY_STATUS_FINISHED,
  type BunnyVideo,
} from "@/lib/bunny/api"

async function uniqueSlug(title: string, bunnyVideoId: string): Promise<string> {
  const base = slugFromTitle(title)
  let slug = base
  for (let i = 2; i < 50; i++) {
    const [existing] = await db
      .select({ id: videos.id, bunnyVideoId: videos.bunnyVideoId })
      .from(videos)
      .where(eq(videos.slug, slug))
      .limit(1)
    if (!existing || existing.bunnyVideoId === bunnyVideoId) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

/**
 * Upsert one Bunny video into the library.
 * - new + encoding finished → published immediately (the automatic pipeline)
 * - new + still encoding → row created unpublished; published when the
 *   finished webhook arrives
 * - existing → refresh title/duration/tags, but respect a manual unpublish
 *   (we only force isPublished=false when the video isn't playable)
 */
export async function upsertVideoFromBunny(video: BunnyVideo): Promise<void> {
  const finished = video.status === BUNNY_STATUS_FINISHED
  const tags = tagsFromMetaTags(video.metaTags)

  const [existing] = await db
    .select({ id: videos.id, isPublished: videos.isPublished })
    .from(videos)
    .where(eq(videos.bunnyVideoId, video.guid))
    .limit(1)

  if (existing) {
    await db
      .update(videos)
      .set({
        title: video.title,
        durationSeconds: video.length || null,
        tags,
        ...(finished ? {} : { isPublished: false }),
        updatedAt: formatISO(new Date()),
      })
      .where(eq(videos.id, existing.id))
    return
  }

  await db.insert(videos).values({
    title: video.title,
    slug: await uniqueSlug(video.title, video.guid),
    bunnyVideoId: video.guid,
    durationSeconds: video.length || null,
    tags,
    isPublished: finished,
  })
}

export interface SyncResult {
  synced: number
  removed: number
}

/** Full reconciliation: Bunny is the source of truth. */
export async function syncAllFromBunny(): Promise<SyncResult> {
  const bunnyVideos = await listBunnyVideos()

  let synced = 0
  for (const video of bunnyVideos) {
    // `timer`-tagged clips are the free /timer demo loops, not member
    // library content — keep them out of the videos table entirely.
    if (tagsFromMetaTags(video.metaTags).includes("timer")) continue
    await upsertVideoFromBunny(video)
    synced += 1
  }

  // Videos deleted on Bunny can't play — unpublish their rows.
  const guids = bunnyVideos.map((v) => v.guid)
  const removed = await db
    .update(videos)
    .set({ isPublished: false, updatedAt: formatISO(new Date()) })
    .where(
      guids.length > 0
        ? and(notInArray(videos.bunnyVideoId, guids), eq(videos.isPublished, true))
        : eq(videos.isPublished, true),
    )
    .returning({ id: videos.id })

  return { synced, removed: removed.length }
}
