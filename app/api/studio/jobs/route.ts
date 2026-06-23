export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 600

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, rename, rm, writeFile } from "node:fs/promises"
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

/** Seconds the first video frame sits past t=0. A stream-copy cut anchors its
 *  timestamps on whichever stream rewound furthest — usually the audio — so the
 *  video keyframe can land a few hundredths late, which players show as a brief
 *  BLACK head. Returns 0 when already aligned (or on any probe error). */
async function videoStartOffset(file: string): Promise<number> {
  const out = await exec(FFPROBE, [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=start_time", "-of", "default=nk=1:nw=1", file,
  ]).catch(() => "")
  const v = Number.parseFloat(out.trim())
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** Whether the file carries an audio stream. */
async function hasAudioStream(file: string): Promise<boolean> {
  const out = await exec(FFPROBE, [
    "-v", "error", "-select_streams", "a",
    "-show_entries", "stream=index", "-of", "csv=p=0", file,
  ]).catch(() => "")
  return out.trim().length > 0
}

/**
 * Cut one segment out of a recording — WITHOUT the brief black frame every clip
 * used to start with.
 *
 * 1. Stream-copy the segment (near-zero CPU; lands on the nearest keyframe ≤
 *    start, preserving HDR/rotation for the downstream effects).
 * 2. That copy anchors timestamps on the earliest stream (the audio), leaving
 *    the video keyframe a few hundredths of a second late → a black head on
 *    playback. If so, re-mux ONCE more: rebase the video's timestamps to 0 with
 *    the `setts` bitstream filter (still a copy — pixels/HDR untouched), and drop
 *    the matching audio lead-in so the two stay in sync. The audio re-encode is
 *    cheap and never touches the video. A clip already aligned skips this pass.
 */
async function cutSegment(
  src: string,
  start: number,
  dur: number,
  out: string,
): Promise<void> {
  const tmp = path.join(path.dirname(out), `cut.tmp${path.extname(out)}`)
  await exec(FFMPEG, [
    "-y", "-ss", String(start), "-i", src, "-t", String(dur),
    "-c", "copy", "-avoid_negative_ts", "make_zero", tmp,
  ])

  const gap = await videoStartOffset(tmp)
  if (gap <= 0.002) {
    await rename(tmp, out) // already aligned — keep the raw cut as-is
    return
  }

  const args = [
    "-y", "-i", tmp,
    "-map", "0:v:0", "-c:v", "copy",
    "-bsf:v", "setts=pts=PTS-STARTPTS:dts=DTS-STARTDTS",
  ]
  if (await hasAudioStream(tmp)) {
    args.push(
      "-map", "0:a:0",
      "-af", `atrim=start=${gap},asetpts=PTS-STARTPTS`,
      "-c:a", "aac", "-b:a", "256k",
    )
  }
  args.push("-movflags", "+faststart", out)

  try {
    await exec(FFMPEG, args)
    await rm(tmp, { force: true })
  } catch {
    // Never fail a render over this cosmetic fix — fall back to the raw cut.
    await rename(tmp, out)
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
  // copy the whole source.
  const inputNames: string[] = []
  const clips: ClipState[] = []
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
    if (hasSegment) {
      await cutSegment(src, ci.start!, ci.end! - ci.start!, out)
    } else {
      await copyFile(src, out)
    }
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
