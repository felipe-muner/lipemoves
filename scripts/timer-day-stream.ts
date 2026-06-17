/**
 * Build a dated /timer workout on Bunny STREAM (free for now).
 *
 *   pnpm timer:day 2026-06-17 ~/Downloads/2026-06-17 50
 *   (= tsx --env-file=.env.local scripts/timer-day-stream.ts <date> <dir> [work])
 *
 * For each clip (NAME order = one per minute) it:
 *   1. uploads the ORIGINAL file to the Stream library — Bunny does the
 *      HDR(HLG/PQ)→SDR transcode itself, which keeps the true colors (a local
 *      pre-conversion desaturated/shifted them — see feedback-hdr-sdr-colors),
 *   2. tags it `timer` (so syncAllFromBunny keeps it OUT of the members list),
 *   3. writes public/timer-days/<date>.json with the Bunny video GUIDs,
 *      preserving any existing names / title / rounds / per-block work.
 *
 * The /api/timer/day route signs these GUIDs into HLS URLs at request time.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import {
  createBunnyVideo,
  uploadBunnyVideo,
  setBunnyVideoTags,
} from "@/lib/bunny/api"

interface Block {
  name: string
  video: string // Bunny video GUID
  work: number
}

async function main() {
  const [date, srcDir, workArg] = process.argv.slice(2)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("usage: timer:day <YYYY-MM-DD> <clips-dir> [work]")
  }
  if (!srcDir || !existsSync(srcDir)) throw new Error(`no dir: ${srcDir}`)
  const work = Number(workArg) || 50

  const clips = readdirSync(srcDir)
    .filter((f) => /\.(mov|mp4|m4v)$/i.test(f))
    .sort()
  if (clips.length === 0) throw new Error(`no clips in ${srcDir}`)

  // Preserve existing names / title / rounds if the day-file already exists.
  const dayPath = path.join(process.cwd(), "public/timer-days", `${date}.json`)
  const prev = existsSync(dayPath)
    ? (JSON.parse(readFileSync(dayPath, "utf8")) as {
        title?: string
        rounds?: number
        blocks?: { name?: string; work?: number }[]
      })
    : {}

  const blocks: Block[] = []
  for (let i = 0; i < clips.length; i++) {
    const src = path.join(srcDir, clips[i])
    const name = prev.blocks?.[i]?.name || `Exercise ${i + 1}`
    console.log(`[${i + 1}/${clips.length}] ${clips[i]} → "${name}"`)
    const guid = await createBunnyVideo(`Timer ${date} · ${name}`)
    await uploadBunnyVideo(guid, new Uint8Array(readFileSync(src)))
    await setBunnyVideoTags(guid, ["timer"])
    console.log(`   uploaded ${guid}`)
    blocks.push({ name, video: guid, work: prev.blocks?.[i]?.work ?? work })
  }

  const dayFile = {
    date,
    title: prev.title ?? "Mobility",
    rounds: prev.rounds ?? 1,
    blocks,
  }
  writeFileSync(dayPath, JSON.stringify(dayFile, null, 2) + "\n")
  console.log(`\n✓ wrote ${dayPath}`)
  console.log(`→ /timer?date=${date} (clips encode on Bunny in ~1-2 min)`)
  process.exit(0)
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e)
  process.exit(1)
})
