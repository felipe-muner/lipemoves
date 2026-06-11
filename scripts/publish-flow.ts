/**
 * One-line publish: convert (iPhone HDR → web SDR), upload to Bunny, tag,
 * and register locally. In production the Bunny webhook publishes it.
 *
 *   pnpm flow:publish <video file> "<title>" --tags hip,shoulder,kettlebell
 *
 * Skips conversion when the file is already SDR.
 */
import { execFileSync } from "node:child_process"
import { existsSync, statSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { getBunnyVideo, type BunnyVideo } from "@/lib/bunny/api"
import { upsertVideoFromBunny } from "@/lib/bunny/sync"

const FFMPEG = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
  : "ffmpeg"
const FFPROBE = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffprobe")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
  : "ffprobe"

const API_BASE = "https://video.bunnycdn.com"

function parseArgs() {
  const args = process.argv.slice(2)
  const tagsIdx = args.indexOf("--tags")
  let tags: string[] = []
  if (tagsIdx !== -1) {
    tags = (args[tagsIdx + 1] ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    args.splice(tagsIdx, 2)
  }
  const [file, title] = args
  if (!file || !title) {
    console.error('Usage: pnpm flow:publish <file> "<title>" --tags a,b,c')
    process.exit(1)
  }
  return { file: path.resolve(file), title, tags }
}

function isHdr(file: string): boolean {
  const out = execFileSync(FFPROBE, [
    "-v", "quiet",
    "-select_streams", "v:0",
    "-show_entries", "stream=color_transfer",
    "-of", "csv=p=0",
    file,
  ]).toString().trim()
  return out === "arib-std-b67" || out === "smpte2084"
}

function convert(file: string): string {
  const out = path.join(tmpdir(), `flow-upload-${Date.now()}.mp4`)
  const hdr = isHdr(file)
  console.log(hdr ? "→ converting HDR → SDR…" : "→ re-encoding for web…")
  const vf = hdr
    ? "zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:r=tv,format=yuv420p"
    : "format=yuv420p"
  execFileSync(
    FFMPEG,
    [
      "-y", "-v", "error",
      "-i", file,
      "-vf", vf,
      "-r", "30",
      "-c:v", "libx264", "-preset", "slow", "-crf", "20",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      out,
    ],
    { stdio: "inherit" },
  )
  return out
}

async function bunny<T>(pathname: string, init?: RequestInit): Promise<T> {
  const res = await fetch(
    `${API_BASE}/library/${process.env.BUNNY_LIBRARY_ID}${pathname}`,
    {
      ...init,
      headers: {
        AccessKey: process.env.BUNNY_API_KEY!,
        ...init?.headers,
      },
    },
  )
  if (!res.ok) throw new Error(`Bunny ${pathname}: ${res.status}`)
  return (await res.json()) as T
}

async function main() {
  const { file, title, tags } = parseArgs()
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`)
    process.exit(1)
  }

  const converted = convert(file)
  const sizeMb = (statSync(converted).size / 1024 / 1024).toFixed(1)

  console.log(`→ creating "${title}" on Bunny…`)
  const created = await bunny<{ guid: string }>("/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })

  console.log(`→ uploading ${sizeMb} MB…`)
  await bunny(`/videos/${created.guid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: readFileSync(converted),
  })

  if (tags.length > 0) {
    console.log(`→ tagging: ${tags.join(", ")}`)
    await bunny(`/videos/${created.guid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaTags: [{ property: "tags", value: tags.join(",") }],
      }),
    })
  }

  console.log("→ waiting for encoding…")
  let video: BunnyVideo | null = null
  for (let i = 0; i < 60; i++) {
    video = await getBunnyVideo(created.guid)
    if (video.status >= 4) break
    await new Promise((r) => setTimeout(r, 10000))
  }

  if (!video || video.status !== 4) {
    console.log(
      "⚠ encoding still running — it will publish via webhook, or run Sync in the dashboard.",
    )
  }

  if (video) {
    await upsertVideoFromBunny(video)
    console.log(
      video.status === 4
        ? `✓ LIVE for members: "${title}" (${created.guid})`
        : `✓ registered (unpublished until encoding finishes): ${created.guid}`,
    )
  }
}

main().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
