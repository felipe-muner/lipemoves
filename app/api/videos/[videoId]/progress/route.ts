export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { watchProgress } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { formatISO } from "date-fns"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [progress] = await db
    .select()
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.userId, session.user.id),
        eq(watchProgress.videoId, videoId)
      )
    )
    .limit(1)

  return NextResponse.json({
    progressSeconds: progress?.progressSeconds ?? 0,
    completed: progress?.completed ?? false,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { progressSeconds, completed } = await request.json()

  const [existing] = await db
    .select()
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.userId, session.user.id),
        eq(watchProgress.videoId, videoId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(watchProgress)
      .set({
        progressSeconds: progressSeconds ?? existing.progressSeconds,
        completed: completed ?? existing.completed,
        updatedAt: formatISO(new Date()),
      })
      .where(eq(watchProgress.id, existing.id))
  } else {
    await db.insert(watchProgress).values({
      userId: session.user.id,
      videoId,
      progressSeconds: progressSeconds ?? 0,
      completed: completed ?? false,
    })
  }

  return NextResponse.json({ success: true })
}
