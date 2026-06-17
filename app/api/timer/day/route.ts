import { NextResponse, type NextRequest } from "next/server"
import { getSignedVideoUrl, getThumbnailUrl } from "@/lib/bunny"

export const dynamic = "force-dynamic"

interface RawBlock {
  name: string
  video: string // Bunny video GUID
  work: number
}
interface RawDay {
  date: string
  title?: string
  rounds?: number
  blocks: RawBlock[]
}

/**
 * Returns a dated /timer workout with its demo clips signed into short-lived
 * Bunny HLS URLs. Free for now (no auth) — when the archive is monetised, gate
 * older dates here (auth + hasActiveSubscription) before signing.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 })
  }

  // Read the day-file from the statically-served /public path (works in dev and
  // on Vercel, where the lambda can't fs-read public files).
  let raw: RawDay
  try {
    const res = await fetch(`${req.nextUrl.origin}/timer-days/${date}.json`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error("missing")
    raw = (await res.json()) as RawDay
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  if (!Array.isArray(raw.blocks) || raw.blocks.length === 0) {
    return NextResponse.json({ error: "empty" }, { status: 404 })
  }

  // `video` is a Bunny GUID (→ sign to an HLS URL) OR already a path/URL
  // (local /public file or CDN) → pass through untouched. Lets us fall back to
  // local clips while Bunny encoding is unavailable.
  const isUrl = (v: string) => /^(https?:)?\//.test(v)
  const blocks = raw.blocks.map((b) => ({
    name: b.name,
    work: b.work,
    video: isUrl(b.video) ? b.video : getSignedVideoUrl({ videoId: b.video }),
    poster: isUrl(b.video) ? undefined : getThumbnailUrl(b.video),
  }))

  return NextResponse.json(
    { date: raw.date, title: raw.title, rounds: raw.rounds, blocks },
    { headers: { "Cache-Control": "no-store" } },
  )
}
