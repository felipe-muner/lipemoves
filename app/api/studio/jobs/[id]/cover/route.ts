export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob } from "@/lib/studio/jobs"
import { applyCover } from "@/lib/studio/pipeline"
import { serializeJob, type CoverRequest } from "@/lib/studio/types"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const job = getJob(id)
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  let body: CoverRequest
  try {
    body = (await request.json()) as CoverRequest
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (
    !Number.isInteger(body.clip) ||
    body.clip < 0 ||
    body.clip >= job.clips.length ||
    !Number.isFinite(body.frame) ||
    body.frame < 1 ||
    !body.text?.trim()
  ) {
    return NextResponse.json(
      { error: "Pick a clip, a frame number and enter cover text" },
      { status: 400 },
    )
  }

  // Clamp the optional free-drag center to the frame so the text can't be
  // placed entirely off-canvas.
  const clamp01 = (n: number) => Math.min(0.98, Math.max(0.02, n))
  const x = Number.isFinite(body.x) ? clamp01(body.x as number) : undefined
  const y = Number.isFinite(body.y) ? clamp01(body.y as number) : undefined
  // Width fraction of the widest line; clamp to a sane range (can exceed 1 when
  // the user deliberately overflows the frame).
  const width = Number.isFinite(body.width)
    ? Math.min(2, Math.max(0.1, body.width as number))
    : undefined

  try {
    await applyCover(job, {
      clip: body.clip,
      frame: Math.round(body.frame),
      text: body.text,
      position: body.position,
      x,
      y,
      width,
      // Only accept a well-formed #hex colour; otherwise fall back to brand green.
      color:
        typeof body.color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.color)
          ? body.color
          : "#00EF00",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cover failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(serializeJob(job))
}
