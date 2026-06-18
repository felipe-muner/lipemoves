export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"

const bin = (n: string) =>
  existsSync(`/opt/homebrew/opt/ffmpeg-full/bin/${n}`)
    ? `/opt/homebrew/opt/ffmpeg-full/bin/${n}`
    : n
const FFMPEG = bin("ffmpeg")
const FFPROBE = bin("ffprobe")

/** Resolve a user-supplied local path (supports ~), restricted to the home
 *  tree, and confirm it exists. Returns null otherwise. */
function resolveLocal(input: string): string | null {
  const home = homedir()
  let p = (input || "").trim()
  if (!p) return null
  if (p === "~" || p.startsWith("~/")) p = path.join(home, p.slice(1))
  p = path.resolve(p)
  if (p !== home && !p.startsWith(home + path.sep)) return null
  return existsSync(p) ? p : null
}

function execBuf(cmd: string, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { encoding: "buffer", maxBuffer: 1024 * 1024 * 16 },
      (err, stdout) => (err ? reject(err) : resolve(stdout as Buffer)),
    )
  })
}

/**
 * Read a LOCAL recording on the machine running the studio without ever
 * transcoding the whole thing — the key to scrubbing huge (multi-GB, 40-min)
 * files instantly:
 *   • ?meta=1     → JSON { duration, width, height } (ffprobe, <1s)
 *   • ?t=<secs>   → a single JPEG frame via fast keyframe seek (~0.5s)
 * The cutter lays out its timeline from the meta and pulls frames on demand as
 * you scrub; the final render still cuts the ORIGINAL full-quality file.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const src = resolveLocal(sp.get("path") ?? "")
  if (!src) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 })
  }

  if (sp.get("meta")) {
    try {
      const out = await execBuf(FFPROBE, [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "format=duration:stream=width,height:stream_side_data=rotation",
        "-of", "json",
        src,
      ])
      const j = JSON.parse(out.toString("utf8")) as {
        format?: { duration?: string }
        streams?: {
          width?: number
          height?: number
          side_data_list?: { rotation?: number }[]
        }[]
      }
      const st = j.streams?.[0]
      const w = Number(st?.width) || 0
      const h = Number(st?.height) || 0
      // Phone recordings store landscape pixels + a rotation flag. Report the
      // DISPLAY size so the editor lays clips out portrait (matching the frames,
      // which ffmpeg already auto-rotates).
      const rot = Math.abs(
        st?.side_data_list?.find((d) => d.rotation != null)?.rotation ?? 0,
      )
      const swap = rot === 90 || rot === 270
      return NextResponse.json({
        duration: Number(j.format?.duration) || 0,
        width: swap ? h : w,
        height: swap ? w : h,
      })
    } catch {
      return NextResponse.json({ error: "Probe failed" }, { status: 500 })
    }
  }

  const t = Math.max(0, Number(sp.get("t")) || 0)
  const h = Math.min(720, Math.max(40, Number(sp.get("h")) || 480))
  try {
    // -ss BEFORE -i = fast input seek (jumps to the nearest keyframe, near
    // instant even at minute 40). One frame, scaled, straight to stdout.
    const buf = await execBuf(FFMPEG, [
      "-loglevel", "error",
      "-ss", String(t),
      "-i", src,
      "-frames:v", "1",
      "-vf", `scale=-2:${h}`,
      "-q:v", "4",
      "-f", "mjpeg",
      "pipe:1",
    ])
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        // Same (path,t,h) always yields the same frame — let the browser cache
        // it so re-scrubbing and the filmstrip don't refetch.
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Frame failed" }, { status: 500 })
  }
}
