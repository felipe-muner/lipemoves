export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createReadStream, existsSync, statSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"

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

const TYPES: Record<string, string> = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
}

/**
 * Stream a LOCAL recording off disk with HTTP Range support, so a browser
 * `<video>` can seek/scrub the ORIGINAL file without downloading the whole
 * (multi-GB) thing or transcoding it. On a Mac with native HEVC decode this is
 * the best possible preview — smooth, instant, frame-accurate. Browsers that
 * can't decode the codec just error, and the cutter falls back to still frames.
 */
/**
 * A web ReadableStream over a file slice that SURVIVES the client aborting
 * mid-download — which a <video> does constantly (seeking, looping, closing the
 * inline clip previews). It honors backpressure (pause/resume) and guards every
 * controller call, so writing to an already-closed/cancelled stream can never
 * throw the uncaught "Controller is already closed" that was crashing dev.
 */
function fileToWeb(
  src: string,
  opts: { start?: number; end?: number },
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const node = createReadStream(src, opts)
  const onAbort = () => node.destroy()
  signal.addEventListener("abort", onAbort)
  node.once("close", () => signal.removeEventListener("abort", onAbort))
  return new ReadableStream<Uint8Array>({
    start(controller) {
      node.on("data", (chunk: string | Buffer) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk
        try {
          controller.enqueue(new Uint8Array(buf))
        } catch {
          node.destroy() // consumer gone — stop reading
          return
        }
        if ((controller.desiredSize ?? 0) <= 0) node.pause()
      })
      node.once("end", () => {
        try {
          controller.close()
        } catch {
          /* already closed by a cancel */
        }
      })
      node.once("error", (err) => {
        try {
          controller.error(err)
        } catch {
          /* consumer already gone */
        }
      })
    },
    pull() {
      node.resume()
    },
    cancel() {
      node.destroy()
    },
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const src = resolveLocal(req.nextUrl.searchParams.get("path") ?? "")
  if (!src) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 })
  }

  const size = statSync(src).size
  const type = TYPES[path.extname(src).toLowerCase()] ?? "video/mp4"
  const range = req.headers.get("range")

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range)
    const start = m && m[1] ? parseInt(m[1], 10) : 0
    let end = m && m[2] ? parseInt(m[2], 10) : size - 1
    if (!isFinite(start) || start >= size || start < 0) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      })
    }
    end = Math.min(isFinite(end) ? end : size - 1, size - 1)
    return new NextResponse(fileToWeb(src, { start, end }, req.signal), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
        "Content-Type": type,
        "Cache-Control": "no-store",
      },
    })
  }

  return new NextResponse(fileToWeb(src, {}, req.signal), {
    headers: {
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Content-Type": type,
      "Cache-Control": "no-store",
    },
  })
}
