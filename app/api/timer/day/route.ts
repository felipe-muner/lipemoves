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

// A day can have several variants (same date, different focus). Files are named
// <date>-<category>.json; a legacy un-categorised <date>.json still works.
const CATEGORIES = ["kettlebell", "mobility"] as const

async function loadDayFile(origin: string, file: string): Promise<RawDay | null> {
  try {
    const res = await fetch(`${origin}/timer-days/${file}.json`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as RawDay
  } catch {
    return null
  }
}

/**
 * Returns a dated /timer workout with its demo clips signed into short-lived
 * Bunny HLS URLs. `?category=` picks a variant (kettlebell / mobility); the
 * response also lists which categories exist for the date so the UI can show a
 * picker. Free for now — when monetised, gate older dates here before signing.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 })
  }
  const origin = req.nextUrl.origin
  const reqCat = req.nextUrl.searchParams.get("category")

  // Discover which category variants exist for this date.
  const found: Partial<Record<string, RawDay>> = {}
  await Promise.all(
    CATEGORIES.map(async (c) => {
      const d = await loadDayFile(origin, `${date}-${c}`)
      if (d) found[c] = d
    }),
  )
  const available = CATEGORIES.filter((c) => found[c])

  // Use the requested category if it exists, else the first available one.
  const category = reqCat && found[reqCat] ? reqCat : available[0] ?? null

  // Chosen variant, or fall back to a legacy un-categorised <date>.json.
  let raw = category ? found[category] ?? null : null
  if (!raw) raw = await loadDayFile(origin, date)
  if (!raw || !Array.isArray(raw.blocks) || raw.blocks.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
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
    { date: raw.date, title: raw.title, rounds: raw.rounds, blocks, category, available },
    { headers: { "Cache-Control": "no-store" } },
  )
}
