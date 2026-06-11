export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getBunnyVideo } from "@/lib/bunny/api"
import { upsertVideoFromBunny } from "@/lib/bunny/sync"

/**
 * Bunny Stream webhook — fires on every encoding status change.
 * Bunny doesn't sign payloads, so the URL carries a shared secret:
 *   https://lipemoves.com/api/bunny/webhook?token=<BUNNY_WEBHOOK_TOKEN>
 *
 * Payload: { VideoLibraryId: number, VideoGuid: string, Status: number }
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  if (!process.env.BUNNY_WEBHOOK_TOKEN || token !== process.env.BUNNY_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    VideoLibraryId?: number
    VideoGuid?: string
    Status?: number
  } | null

  const guid = payload?.VideoGuid
  if (!guid || String(payload?.VideoLibraryId) !== process.env.BUNNY_LIBRARY_ID) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    // Fetch the full video (title, duration, metaTags) and upsert. The
    // helper publishes automatically once encoding is finished.
    const video = await getBunnyVideo(guid)
    await upsertVideoFromBunny(video)
    revalidatePath("/videos")
    revalidatePath("/dashboard/videos")
  } catch (error) {
    console.error("bunny webhook error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
