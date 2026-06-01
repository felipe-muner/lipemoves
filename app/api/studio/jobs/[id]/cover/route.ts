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
    !Number.isFinite(body.frame) ||
    body.frame < 1 ||
    !body.text?.trim()
  ) {
    return NextResponse.json(
      { error: "Pick a frame number and enter cover text" },
      { status: 400 },
    )
  }

  try {
    await applyCover(job, {
      frame: Math.round(body.frame),
      text: body.text,
      position: body.position,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cover failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(serializeJob(job))
}
