export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasActiveSubscription } from "@/lib/stripe/subscription"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getSignedVideoUrl } from "@/lib/bunny"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
  }

  // Free videos don't require subscription
  if (!video.isFree) {
    const hasSubscription = await hasActiveSubscription(session.user.id)
    if (!hasSubscription) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 403 }
      )
    }
  }

  const url = getSignedVideoUrl({ videoId: video.bunnyVideoId })

  return NextResponse.json({ url })
}
