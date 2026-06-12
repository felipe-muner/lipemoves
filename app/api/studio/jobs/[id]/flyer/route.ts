export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob } from "@/lib/studio/jobs"
import { applyFlyer } from "@/lib/studio/pipeline"
import {
  serializeJob,
  type FlyerFragment,
  type FlyerLayout,
  type FlyerPoint,
  type FlyerRequest,
} from "@/lib/studio/types"

const FRAGMENTS: FlyerFragment[] = ["kicker", "head", "sub", "pill", "brand"]

/** Sanitize one fragment center: finite numbers, clamped into the canvas. */
function point(v: unknown): FlyerPoint | undefined {
  if (typeof v !== "object" || v === null) return undefined
  const o = v as { x?: unknown; y?: unknown }
  if (
    typeof o.x !== "number" ||
    typeof o.y !== "number" ||
    !Number.isFinite(o.x) ||
    !Number.isFinite(o.y)
  ) {
    return undefined
  }
  const clamp = (n: number) => Math.min(0.98, Math.max(0.02, n))
  return { x: clamp(o.x), y: clamp(o.y) }
}

function layout(v: unknown): FlyerLayout | undefined {
  if (typeof v !== "object" || v === null) return undefined
  const o = v as Record<string, unknown>
  const out: FlyerLayout = {}
  for (const f of FRAGMENTS) {
    const pt = point(o[f])
    if (pt) out[f] = pt
  }
  return Object.keys(out).length ? out : undefined
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/** Optional text field: trimmed, capped, undefined when empty/absent. */
function text(v: unknown, max = 60): string | undefined {
  if (typeof v !== "string") return undefined
  const t = v.trim().slice(0, max)
  return t || undefined
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

  let body: FlyerRequest
  try {
    body = (await request.json()) as FlyerRequest
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const headline = text(body.headline)
  if (
    !Number.isInteger(body.clip) ||
    body.clip < 0 ||
    body.clip >= job.clips.length ||
    !Number.isFinite(body.frame) ||
    body.frame < 1 ||
    !headline
  ) {
    return NextResponse.json(
      { error: "Pick a clip, a frame number and enter a headline" },
      { status: 400 },
    )
  }

  try {
    await applyFlyer(job, {
      clip: body.clip,
      frame: Math.round(body.frame),
      headline,
      kicker: text(body.kicker),
      headline2: text(body.headline2),
      sub: text(body.sub),
      pill: text(body.pill),
      bw: body.bw !== false,
      pos: {
        yt: layout(body.pos?.yt),
        ig: layout(body.pos?.ig),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Flyer failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(serializeJob(job))
}
