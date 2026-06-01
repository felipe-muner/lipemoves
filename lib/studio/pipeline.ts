import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, readdir, rename } from "node:fs/promises"
import path from "node:path"

import type {
  CoverRequest,
  Job,
  StepId,
  StepState,
  StudioConfig,
} from "./types"

const SCRIPTS = path.join(process.cwd(), "scripts")

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

function setStep(job: Job, id: StepId, patch: Partial<StepState>): void {
  const step = job.steps.find((s) => s.id === id)
  if (step) Object.assign(step, patch)
}

/**
 * Run the selected steps in order, mutating the job in place (the job store
 * holds the same object reference, so progress is visible to pollers).
 *
 * @param job   the job (its `dir` already contains the uploaded `inputName`)
 * @param config which steps to run + their settings
 */
export async function runPipeline(
  job: Job,
  config: StudioConfig,
): Promise<void> {
  job.status = "running"
  const dir = job.dir
  const input = path.join(dir, job.inputName)

  // The clip that carries the video edits forward (ken-burns -> caption).
  let finalVideo = input
  // The clip the cover frame + contact sheet are pulled from: ken-burns output
  // (or the original) but BEFORE the caption, so covers sit on a clean frame.
  let coverSource = input
  let videoEdited = false

  try {
    // 1) Ken Burns (operates on a directory; give it one of its own).
    if (config.kenburns) {
      setStep(job, "kenburns", { status: "running" })
      const kbIn = path.join(dir, "kb")
      await mkdir(kbIn, { recursive: true })
      await copyFile(input, path.join(kbIn, job.inputName))
      await run("bash", [path.join(SCRIPTS, "ken-burns.sh"), kbIn], dir)
      const base = job.inputName.replace(/\.[^.]+$/, "")
      const produced = path.join(kbIn, "edited", `${base}-kb.mp4`)
      const dest = path.join(dir, "kb.mp4")
      await rename(produced, dest)
      finalVideo = dest
      coverSource = dest
      videoEdited = true
      setStep(job, "kenburns", { status: "done" })
    } else {
      setStep(job, "kenburns", { status: "skipped" })
    }

    // 2) Caption (fog fade-in, all white).
    if (config.caption && config.caption.main.trim()) {
      setStep(job, "caption", { status: "running" })
      const out = path.join(dir, "cap.mp4")
      const args = [
        path.join(SCRIPTS, "add-caption.sh"),
        finalVideo,
        config.caption.main,
        config.caption.sub,
        out,
      ]
      if (!config.caption.fog) args.push("--no-anim")
      await run("bash", args, dir)
      finalVideo = out
      videoEdited = true
      setStep(job, "caption", { status: "done" })
    } else {
      setStep(job, "caption", { status: "skipped" })
    }

    // Expose the processed clip as the headline artifact.
    if (videoEdited) {
      const out = path.join(dir, "final.mp4")
      await copyFile(finalVideo, out)
      finalVideo = out
      job.artifacts.push({
        name: "final.mp4",
        kind: "video",
        label: "Processed clip",
      })
    }

    // 3) Frames + numbered contact sheet. Needed if the frame sheet was asked
    //    for, OR if a cover was requested (covers are burned onto a chosen
    //    frame, so we always extract the full-res frames here).
    const wantsCover = config.cover === true
    if (config.framepicker || wantsCover) {
      setStep(job, "framepicker", { status: "running" })
      const framesDir = path.join(dir, "frames")
      const step = String(config.framepicker?.step ?? 0.5)
      await run(
        "bash",
        [path.join(SCRIPTS, "frame-picker.sh"), coverSource, step, framesDir],
        dir,
      )
      const base = path.basename(coverSource).replace(/\.[^.]+$/, "")
      job.artifacts.push({
        name: path.join("frames", `${base}-contact.png`),
        kind: "image",
        label: "Frame contact sheet",
      })
      const fullDir = path.join(framesDir, "frames")
      let frameFiles: string[] = []
      try {
        frameFiles = (await readdir(fullDir))
          .filter((f) => f.endsWith(".png"))
          .sort()
        job.frameCount = frameFiles.length
      } catch {
        job.frameCount = 0
      }
      // Small JPG thumbnails for the clickable picker grid (full-res frames
      // are several MB each; these keep the UI snappy).
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
      setStep(job, "framepicker", { status: "done" })
    } else {
      setStep(job, "framepicker", { status: "skipped" })
    }

    // 4) Cover is a SECOND phase: it waits for you to click a frame and type
    //    the text in the UI, then applyCover() burns it onto that frame.
    if (wantsCover) {
      job.coverRequested = true
      setStep(job, "cover", {
        status: "pending",
        message: "pick a frame & add text",
      })
    } else {
      setStep(job, "cover", { status: "skipped" })
    }

    job.status = "done"
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    job.status = "error"
    job.error = message
    const running = job.steps.find((s) => s.status === "running")
    if (running) setStep(job, running.id, { status: "error", message })
  }
}

/**
 * Phase 2: burn the cover text onto a chosen contact-sheet frame (1-based).
 * The full-res frames were saved by frame-picker at frames/frames/<NNN>.png.
 */
export async function applyCover(
  job: Job,
  req: CoverRequest,
): Promise<void> {
  const num = String(req.frame).padStart(3, "0")
  const frame = path.join(job.dir, "frames", "frames", `${num}.png`)
  if (!existsSync(frame)) {
    throw new Error(`Frame ${req.frame} not found`)
  }

  setStep(job, "cover", { status: "running", message: undefined })
  const out = path.join(job.dir, "cover.jpg")
  try {
    await run(
      "bash",
      [path.join(SCRIPTS, "cover.sh"), frame, req.text, out, req.position],
      job.dir,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    setStep(job, "cover", { status: "error", message })
    throw err
  }

  if (!job.artifacts.some((a) => a.name === "cover.jpg")) {
    job.artifacts.push({
      name: "cover.jpg",
      kind: "image",
      label: "Cover / thumbnail",
    })
  }
  setStep(job, "cover", { status: "done" })
}
