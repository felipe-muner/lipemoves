import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, readdir } from "node:fs/promises"
import path from "node:path"

import {
  BADGE_DEFAULT_SIZE,
  BADGE_DEFAULT_X,
  BADGE_DEFAULT_Y,
  type CoverRequest,
  type FlyerRequest,
  type Job,
  type StudioConfig,
} from "./types"
import { withBadgeRenderer } from "./badge"

const SCRIPTS = path.join(process.cwd(), "scripts")
const FFMPEG = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
  : "ffmpeg"
const FFPROBE = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffprobe")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
  : "ffprobe"

const pad2 = (n: number) => String(n).padStart(2, "0")
const pad3 = (n: number) => String(n).padStart(3, "0")

/** Run a command, rejecting with stderr on failure. */
function run(file: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { cwd, maxBuffer: 1024 * 1024 * 64 },
      (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr?.trim() || err.message))
        else resolve()
      },
    )
  })
}

/** Read one ffprobe field, empty string on failure. */
function probe(video: string, entries: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      FFPROBE,
      ["-v", "error", "-select_streams", "v:0", "-show_entries", entries,
        "-of", "default=nw=1:nk=1", video],
      (_e, stdout) => resolve((stdout || "").trim()),
    )
  })
}

function hasAudio(video: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      FFPROBE,
      ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
        "-of", "csv=p=0", video],
      (_e, stdout) => resolve(!!(stdout || "").trim()),
    )
  })
}

/**
 * Overlay a full-frame transparent PNG (the enumerate badge) onto a clip,
 * normalizing to 1080x1920 and preserving HDR — same mechanics as
 * label-video.sh.
 */
async function overlayBadge(
  video: string,
  png: string,
  out: string,
  cwd: string,
): Promise<void> {
  const trc = await probe(video, "stream=color_transfer")
  const hdr = trc === "arib-std-b67" || trc === "smpte2084"
  const audio = await hasAudio(video)

  let filter =
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]overlay=0:0[v]"
  filter += hdr
    ? ";[v]format=yuv420p10le,setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67[vo]"
    : ";[v]format=yuv420p[vo]"

  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", video,
    "-i", png,
    "-filter_complex", filter,
    "-map", "[vo]",
  ]
  if (audio) args.push("-map", "0:a", "-c:a", "copy")
  args.push("-c:v", "libx265", "-preset", "medium", "-crf", "18", "-tag:v", "hvc1")
  if (hdr) {
    args.push(
      "-x265-params",
      "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited",
      "-color_primaries", "bt2020", "-colorspace", "bt2020nc",
      "-color_trc", "arib-std-b67", "-color_range", "tv",
    )
  }
  args.push("-movflags", "+faststart", out)
  await run(FFMPEG, args, cwd)
}

/** Concatenate clips into one video (re-encode), preserving HDR if present. */
async function joinClips(
  paths: string[],
  out: string,
  cwd: string,
): Promise<void> {
  const trc = await probe(paths[0], "stream=color_transfer")
  const hdr = trc === "arib-std-b67" || trc === "smpte2084"
  const audio = (await Promise.all(paths.map(hasAudio))).every(Boolean)
  const n = paths.length

  const inputs = paths.flatMap((p) => ["-i", p])
  // Normalize every input to 1080x1920 (fill + center-crop) so clips of mixed
  // sizes — e.g. an un-zoomed original next to a 1080x1920 zoomed clip — concat
  // cleanly.
  const norm = paths
    .map(
      (_, i) =>
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[n${i}]`,
    )
    .join(";")
  const tag = paths.map((_, i) => (audio ? `[n${i}][${i}:a]` : `[n${i}]`)).join("")
  let filter = `${norm};${tag}concat=n=${n}:v=1:a=${audio ? 1 : 0}[v]${audio ? "[a]" : ""}`
  filter += hdr
    ? ";[v]format=yuv420p10le,setparams=colorspace=bt2020nc:color_primaries=bt2020:color_trc=arib-std-b67[vo]"
    : ";[v]format=yuv420p[vo]"

  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    ...inputs,
    "-filter_complex", filter,
    "-map", "[vo]",
  ]
  if (audio) args.push("-map", "[a]")
  args.push("-c:v", "libx265", "-preset", "medium", "-crf", "18", "-tag:v", "hvc1")
  if (hdr) {
    args.push(
      "-x265-params",
      "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited",
      "-color_primaries", "bt2020", "-colorspace", "bt2020nc",
      "-color_trc", "arib-std-b67", "-color_range", "tv",
    )
  }
  if (audio) args.push("-c:a", "aac", "-b:a", "128k")
  args.push("-movflags", "+faststart", out)
  await run(FFMPEG, args, cwd)
}

/**
 * Run the batch. Ken Burns is applied to all clips in one alternating pass;
 * then each clip is captioned (if requested) and, if a contact sheet was
 * requested, frames + thumbnails are extracted so a cover can be finished.
 *
 * The job is mutated in place — the store holds the same reference, so progress
 * is visible to pollers. `dir` already contains `clip<NN>/<inputName>` per clip.
 */
export async function runPipeline(
  job: Job,
  config: StudioConfig,
  inputNames: string[],
): Promise<void> {
  job.status = "running"
  const dir = job.dir
  const clipDir = (i: number) => path.join(dir, `clip${pad2(i)}`)

  try {
    // Pre-render every enumerate badge ("✅ 1/5" …) in one browser session.
    // A clip whose badge was cleared in the editor has badge: null — skip it.
    const enumerate = config.enumerate && !config.framepicker
    const hasBadge = (i: number) =>
      enumerate && !!config.clips[i]?.badge?.text.trim()
    if (enumerate && job.clips.some((_, i) => hasBadge(i))) {
      await withBadgeRenderer(async (render) => {
        for (let i = 0; i < job.clips.length; i++) {
          if (!hasBadge(i)) continue
          const b = config.clips[i].badge!
          await render(
            b.text,
            path.join(clipDir(i), "badge.png"),
            b.x ?? BADGE_DEFAULT_X,
            b.y ?? BADGE_DEFAULT_Y,
            b.size ?? BADGE_DEFAULT_SIZE,
          )
        }
      })
    }

    // --- Per clip: optional Ken Burns zoom, then optional text label, then
    //     (Frames mode) extract frames for the cover studio. ---
    for (let i = 0; i < job.clips.length; i++) {
      const clip = job.clips[i]
      const cfg = config.clips[i]
      const cdir = clipDir(i)
      clip.status = "running"
      try {
        const input = path.join(cdir, inputNames[i])
        let finalVideo = input
        // Cover/contact frames come from AFTER the zoom (so they match the
        // final framing) but BEFORE the label (so covers sit on a clean frame).
        let coverSource = input
        let edited = false

        // Ken Burns zoom (per-clip direction).
        if (cfg.zoom) {
          const out = path.join(cdir, "kb.mp4")
          await run(
            "bash",
            [path.join(SCRIPTS, "zoom-clip.sh"), finalVideo, out, cfg.zoom],
            dir,
          )
          finalVideo = out
          coverSource = out
          edited = true
        }

        // Text labels: burn each freely-placed line (its own font) onto the
        // whole clip, chaining one pass per label.
        if (config.text) {
          const labels = cfg.labels.filter((l) => l.text.trim())
          for (let li = 0; li < labels.length; li++) {
            const l = labels[li]
            const out = path.join(cdir, `label${li}.mp4`)
            const args = [
              path.join(SCRIPTS, "label-video.sh"),
              finalVideo,
              l.text,
              out,
              config.text.color,
              String(config.text.opacity),
              String(l.x),
              String(l.y),
              String(l.width),
              l.font,
            ]
            if (!config.text.fade) args.push("--no-anim")
            await run("bash", args, dir)
            finalVideo = out
            edited = true
          }
        }

        // Enumerate badge ("✅ 2/5") — last pass, so it sits above labels.
        if (hasBadge(i)) {
          const out = path.join(cdir, "enum.mp4")
          await overlayBadge(finalVideo, path.join(cdir, "badge.png"), out, dir)
          finalVideo = out
          edited = true
        }

        if (edited) {
          const out = path.join(cdir, "final.mp4")
          await copyFile(finalVideo, out)
          clip.videoName = `clip${pad2(i)}/final.mp4`
        } else {
          // No edits — expose the original so it can still be previewed.
          clip.videoName = `clip${pad2(i)}/${inputNames[i]}`
        }

        if (config.framepicker) {
          const framesDir = path.join(cdir, "frames")
          const step = String(config.framepicker.step)
          await run(
            "bash",
            [path.join(SCRIPTS, "frame-picker.sh"), coverSource, step, framesDir],
            dir,
          )
          const base = path.basename(coverSource).replace(/\.[^.]+$/, "")
          clip.contactName = `clip${pad2(i)}/frames/${base}-contact.png`
          clip.framesPrefix = `clip${pad2(i)}/frames`
          const fullDir = path.join(framesDir, "frames")
          let frameFiles: string[] = []
          try {
            frameFiles = (await readdir(fullDir))
              .filter((f) => f.endsWith(".png"))
              .sort()
            clip.frameCount = frameFiles.length
          } catch {
            clip.frameCount = 0
          }
          if (frameFiles.length) {
            const webDir = path.join(framesDir, "web")
            await mkdir(webDir, { recursive: true })
            await run(
              "magick",
              [
                "mogrify",
                "-path",
                webDir,
                "-resize",
                "240x",
                "-quality",
                "82",
                "-format",
                "jpg",
                ...frameFiles.map((f) => path.join(fullDir, f)),
              ],
              dir,
            )
          }
        }

        clip.status = "done"
      } catch (err) {
        clip.status = "error"
        clip.message = err instanceof Error ? err.message : String(err)
      }
    }

    // --- Phase C: optionally join all processed clips into one video. ---
    const finals = job.clips
      .filter((c) => c.status === "done" && c.videoName)
      .map((c) => path.join(dir, c.videoName as string))
    if (!config.framepicker && config.join && finals.length >= 2) {
      try {
        const out = path.join(dir, "joined.mp4")
        await joinClips(finals, out, dir)
        job.joinedName = "joined.mp4"
      } catch (err) {
        job.joinError = err instanceof Error ? err.message : String(err)
      }
    }

    job.status = job.clips.every((c) => c.status === "error") ? "error" : "done"
    if (job.status === "error") job.error = "All clips failed"
  } catch (err) {
    job.status = "error"
    job.error = err instanceof Error ? err.message : String(err)
  }
}

/**
 * Burn the cover text onto a chosen frame of a chosen clip. The full-res frames
 * were saved by frame-picker at <framesPrefix>/frames/<NNN>.png.
 */
export async function applyCover(job: Job, req: CoverRequest): Promise<void> {
  const clip = job.clips[req.clip]
  if (!clip || !clip.framesPrefix) throw new Error("Clip has no frames")

  const frame = path.join(job.dir, clip.framesPrefix, "frames", `${pad3(req.frame)}.png`)
  if (!existsSync(frame)) throw new Error(`Frame ${req.frame} not found`)

  const out = path.join(job.dir, `clip${pad2(req.clip)}`, "cover.jpg")
  // Pass the free-drag center (x,y) and measured width fraction when present;
  // cover.sh falls back to the named position preset + auto-fit when empty.
  const x = req.x === undefined ? "" : String(req.x)
  const y = req.y === undefined ? "" : String(req.y)
  const width = req.width === undefined ? "" : String(req.width)
  const color = req.color ?? "#00EF00"
  // cover.sh's grunge/thicken args are always off — the feature was removed.
  await run(
    "bash",
    [path.join(SCRIPTS, "cover.sh"), frame, req.text, out, req.position, x, y, width, "0", "0", color],
    job.dir,
  )
  clip.coverName = `clip${pad2(req.clip)}/cover.jpg`
}

/**
 * Render the flyer-style cover pair (YouTube 1280x720 + Instagram 1080x1920,
 * grid-safe) from a chosen frame via cover-flyer.sh — same renderer as the
 * covers-YYYY-MM-DD batch scripts.
 */
export async function applyFlyer(job: Job, req: FlyerRequest): Promise<void> {
  const clip = job.clips[req.clip]
  if (!clip || !clip.framesPrefix) throw new Error("Clip has no frames")

  const frame = path.join(job.dir, clip.framesPrefix, "frames", `${pad3(req.frame)}.png`)
  if (!existsSync(frame)) throw new Error(`Frame ${req.frame} not found`)

  const dir = `clip${pad2(req.clip)}`
  const bw = req.bw === false ? "0" : "1"
  for (const fmt of ["yt", "ig"] as const) {
    const layout = req.pos?.[fmt]
    const at = (f: keyof NonNullable<typeof layout>) => {
      const pt = layout?.[f]
      return pt ? `${pt.x},${pt.y}` : ""
    }
    await run(
      "bash",
      [
        path.join(SCRIPTS, "cover-flyer.sh"),
        frame,
        path.join(job.dir, dir, `flyer-${fmt}.jpg`),
        fmt,
        req.headline,
        req.kicker ?? "",
        req.headline2 ?? "",
        req.sub ?? "",
        req.pill ?? "",
        bw,
        at("kicker"),
        at("head"),
        at("sub"),
        at("pill"),
        at("brand"),
      ],
      job.dir,
    )
  }
  clip.flyerYtName = `${dir}/flyer-yt.jpg`
  clip.flyerIgName = `${dir}/flyer-ig.jpg`
}
