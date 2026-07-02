export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 600

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob, putJob } from "@/lib/studio/jobs"
import { runPipeline } from "@/lib/studio/pipeline"
import {
  MOSAIC_CLIPS,
  serializeJob,
  type ClipState,
  type Job,
  type StudioConfig,
} from "@/lib/studio/types"

const pad2 = (n: number) => String(n).padStart(2, "0")
const FFMPEG = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
  : "ffmpeg"
const FFPROBE = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffprobe")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
  : "ffprobe"

/** Resolve a local source path (supports ~), restricted to the home tree. */
function resolveLocal(input: string): string | null {
  const home = homedir()
  let p = (input || "").trim()
  if (!p) return null
  if (p === "~" || p.startsWith("~/")) p = path.join(home, p.slice(1))
  p = path.resolve(p)
  if (p !== home && !p.startsWith(home + path.sep)) return null
  return existsSync(p) ? p : null
}

/** Promisified ffmpeg/ffprobe call; rejects with stderr so failures stay legible. */
function exec(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, (err, stdout, stderr) =>
      err ? reject(new Error(stderr || err.message)) : resolve(stdout),
    )
  })
}

/** One ffprobe field for the first video/audio stream ("" on failure). */
async function probe(src: string, stream: string, entries: string): Promise<string> {
  try {
    const out = await exec(FFPROBE, [
      "-v", "error", "-select_streams", stream,
      "-show_entries", entries, "-of", "default=nw=1:nk=1", src,
    ])
    return out.trim()
  } catch {
    return ""
  }
}

/**
 * Cut one segment with an ACCURATE seek so the clip opens ON the exact frame you
 * marked — no black head. A lossless stream-copy can only start on the nearest
 * keyframe, which leaves the video stream starting later than the audio (a
 * ~0.1s black gap at the top of every clip); the only way to fill that gap is to
 * decode from the preceding keyframe and re-encode. So we do a precise re-encode
 * and reset both streams' timestamps to 0, keeping color EXACTLY as the source —
 * HDR (HLG/PQ, BT.2020, 10-bit) is detected and tagged through end-to-end, so
 * nothing shifts. (The pipeline re-encodes clips downstream anyway; this just
 * moves that one encode to the cut so the head is clean.)
 */
/** Build the ffmpeg args for a cut using either the Mac hardware HEVC encoder
 *  (fast) or software x265 (portable fallback). Both reset timestamps to 0 and
 *  carry the source's color through unchanged. */
function cutArgs(
  src: string,
  start: number,
  dur: number,
  out: string,
  o: { hdr: boolean; trc: string; hasAudio: boolean; hw: boolean },
): string[] {
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-ss", String(start), "-i", src, "-t", String(dur),
    "-map", "0:v:0", "-map", "0:a:0?",
    // Reset the video to start at 0 so it opens together with the audio.
    "-vf", "setpts=PTS-STARTPTS",
  ]
  if (o.hasAudio) args.push("-af", "aresample=async=1,asetpts=PTS-STARTPTS")

  if (o.hw) {
    // Apple hardware HEVC: GPU-fast, keeps 10-bit HDR when the color flags below
    // are set. q:v is a 0–100 quality (higher = better); 60 ≈ visually lossless.
    args.push("-c:v", "hevc_videotoolbox", "-q:v", "60", "-tag:v", "hvc1")
  } else {
    args.push("-c:v", "libx265", "-preset", "veryfast", "-crf", "18", "-tag:v", "hvc1")
    if (o.hdr) {
      args.push(
        "-x265-params",
        `colorprim=bt2020:transfer=${o.trc}:colormatrix=bt2020nc:range=limited`,
      )
    }
  }

  if (o.hdr) {
    args.push(
      "-color_primaries", "bt2020", "-colorspace", "bt2020nc",
      "-color_trc", o.trc, "-color_range", "tv",
    )
  } else {
    args.push("-pix_fmt", "yuv420p")
  }
  if (o.hasAudio) args.push("-c:a", "aac", "-b:a", "128k")
  else args.push("-an")
  args.push("-movflags", "+faststart", out)
  return args
}

async function cutSegment(
  src: string,
  start: number,
  dur: number,
  out: string,
): Promise<void> {
  const trc = await probe(src, "v:0", "stream=color_transfer")
  const hdr = trc === "arib-std-b67" || trc === "smpte2084"
  const hasAudio = !!(await probe(src, "a:0", "stream=index"))
  const opts = { hdr, trc, hasAudio }
  // Prefer the Mac hardware encoder (≈3× faster); fall back to software x265 if
  // it isn't available (e.g. a Linux worker) or the hardware encode fails.
  try {
    await exec(FFMPEG, cutArgs(src, start, dur, out, { ...opts, hw: true }))
  } catch {
    await exec(FFMPEG, cutArgs(src, start, dur, out, { ...opts, hw: false }))
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await request.formData()
  const files = form.getAll("files").filter((f): f is File => f instanceof File)
  const configRaw = form.get("config")

  if (typeof configRaw !== "string") {
    return NextResponse.json({ error: "Missing config" }, { status: 400 })
  }

  let config: StudioConfig
  try {
    config = JSON.parse(configRaw) as StudioConfig
  } catch {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 })
  }
  if (!Array.isArray(config.clips) || config.clips.length === 0) {
    return NextResponse.json({ error: "No clips configured" }, { status: 400 })
  }
  // Mosaic tiles a fixed number of clips per layout — reject a mismatch up front
  // so ffmpeg never sees the wrong count.
  if (config.mosaic) {
    const need = MOSAIC_CLIPS[config.mosaic.layout]
    if (!need) {
      return NextResponse.json({ error: "Unknown mosaic layout" }, { status: 400 })
    }
    if (config.clips.length !== need) {
      return NextResponse.json(
        { error: `That mosaic layout needs ${need} clips` },
        { status: 400 },
      )
    }
  }
  // A clip's source is either a LOCAL path (read off disk, no upload) or an
  // uploaded file (default: its own index).
  const srcIndexOf = (i: number) => config.clips[i].sourceIndex ?? i
  for (let i = 0; i < config.clips.length; i++) {
    if (config.clips[i].sourcePath) continue // local source — validated below
    const s = srcIndexOf(i)
    if (s < 0 || s >= files.length) {
      return NextResponse.json(
        { error: "A clip references a missing source" },
        { status: 400 },
      )
    }
  }
  if (files.length === 0 && !config.clips.some((c) => c.sourcePath)) {
    return NextResponse.json({ error: "No video source" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const dir = path.join(process.cwd(), "private", "studio", id)
  await mkdir(dir, { recursive: true })

  // Save each uploaded source once.
  const srcPaths: string[] = []
  for (let j = 0; j < files.length; j++) {
    const ext = (path.extname(files[j].name) || ".mp4").toLowerCase()
    const p = path.join(dir, `src${pad2(j)}${ext}`)
    await writeFile(p, Buffer.from(await files[j].arrayBuffer()))
    srcPaths.push(p)
  }

  // Build each clip's input: cut its segment (if any) from its source, else
  // copy the whole source. First validate + prepare every clip (order matters),
  // then run the cuts CONCURRENTLY — each cut is now a re-encode (to drop the
  // black head), so doing them one-by-one made a multi-clip job crawl.
  const inputNames: string[] = []
  const clips: ClipState[] = []
  const cutTasks: Array<() => Promise<void>> = []
  for (let i = 0; i < config.clips.length; i++) {
    const ci = config.clips[i]
    // Local path (read in place) or an uploaded source.
    const local = ci.sourcePath ? resolveLocal(ci.sourcePath) : null
    if (ci.sourcePath && !local) {
      return NextResponse.json(
        { error: "A clip's local source path is invalid" },
        { status: 400 },
      )
    }
    const src = local ?? srcPaths[srcIndexOf(i)]
    const ext = path.extname(src) || ".mp4"
    const inputName = `input${ext}`
    const cdir = path.join(dir, `clip${pad2(i)}`)
    await mkdir(cdir, { recursive: true })
    const out = path.join(cdir, inputName)
    const hasSegment =
      typeof ci.start === "number" &&
      typeof ci.end === "number" &&
      ci.end > ci.start
    cutTasks.push(
      hasSegment
        ? () => cutSegment(src, ci.start!, ci.end! - ci.start!, out)
        : () => copyFile(src, out),
    )
    inputNames.push(inputName)
    clips.push({
      index: i,
      label: local ? path.basename(local) : files[srcIndexOf(i)].name,
      status: "pending",
      videoName: null,
      contactName: null,
      framesPrefix: null,
      frameCount: 0,
      coverName: null,
    })
  }

  // Cut all clips concurrently, bounded so we don't oversubscribe the CPU (each
  // x265 encode is already multi-threaded). Fail the whole request if any cut
  // errors, so a broken clip surfaces instead of silently missing.
  const CUT_CONCURRENCY = 3
  let nextCut = 0
  await Promise.all(
    Array.from({ length: Math.min(CUT_CONCURRENCY, cutTasks.length) }, async () => {
      while (nextCut < cutTasks.length) {
        const t = cutTasks[nextCut++]
        await t()
      }
    }),
  )

  const job: Job = {
    id,
    createdAt: new Date().toISOString(),
    status: "queued",
    compose: !config.framepicker && !config.mosaic,
    clips,
    joinedName: null,
    mosaicName: null,
    dir,
  }
  putJob(job)

  // Fire-and-forget: rendering continues in this Node process while the client
  // polls GET /api/studio/jobs/[id]. (Local-first; a prod worker would dequeue.)
  void runPipeline(job, config, inputNames)

  const stored = getJob(id)
  return NextResponse.json(stored ? serializeJob(stored) : { id }, {
    status: 202,
  })
}
