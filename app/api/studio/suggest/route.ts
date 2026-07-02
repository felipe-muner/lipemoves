export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { readFile, rm } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import path from "node:path"

import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"

const bin = (n: string) =>
  existsSync(`/opt/homebrew/opt/ffmpeg-full/bin/${n}`)
    ? `/opt/homebrew/opt/ffmpeg-full/bin/${n}`
    : n
const FFMPEG = bin("ffmpeg")
const FFPROBE = bin("ffprobe")

const API = "https://generativelanguage.googleapis.com"
// Cheap, video-capable, free-tier eligible. Swap here to upgrade.
const MODEL = "gemini-2.5-flash"

/** Resolve a user path (supports ~), restricted to the home tree. */
function resolveLocal(input: string): string | null {
  const home = homedir()
  let p = (input || "").trim()
  if (!p) return null
  if (p === "~" || p.startsWith("~/")) p = path.join(home, p.slice(1))
  p = path.resolve(p)
  if (p !== home && !p.startsWith(home + path.sep)) return null
  return existsSync(p) ? p : null
}

function exec(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 1024 * 1024 * 8 }, (err, stdout, stderr) =>
      err ? reject(new Error(stderr || err.message)) : resolve(stdout),
    )
  })
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

interface Suggestion {
  start: number
  end: number
  why: string
}

/** Upload a video to Gemini's File API (resumable) and wait until it's ACTIVE.
 *  Returns the file uri (for generateContent) + name (for cleanup). */
async function geminiUpload(
  bytes: Buffer,
  key: string,
): Promise<{ uri: string; name: string }> {
  const start = await fetch(`${API}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": "video/mp4",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "studio-proxy" } }),
  })
  const uploadUrl = start.headers.get("x-goog-upload-url")
  if (!uploadUrl) throw new Error("Gemini upload could not start (check the API key/tier)")

  const up = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
    },
    body: new Uint8Array(bytes),
  })
  const upJson = (await up.json()) as { file?: { uri?: string; name?: string; state?: string } }
  let file = upJson.file
  if (!file?.uri || !file?.name) throw new Error("Gemini upload failed")

  // Video files are PROCESSING until Gemini has read them; poll until ACTIVE.
  for (let i = 0; i < 45 && file.state === "PROCESSING"; i++) {
    await sleep(2000)
    const f = (await fetch(`${API}/v1beta/${file.name}`, {
      headers: { "x-goog-api-key": key },
    }).then((r) => r.json())) as { uri?: string; name?: string; state?: string }
    file = { ...file, ...f }
  }
  if (file.state !== "ACTIVE") {
    throw new Error(`Gemini could not process the video (state: ${file.state})`)
  }
  if (!file.uri || !file.name) throw new Error("Gemini file is missing its uri")
  return { uri: file.uri, name: file.name }
}

/** Ask Gemini for the strongest ~2s Reel moments in the uploaded video. */
async function geminiSuggest(
  uri: string,
  key: string,
  count: number,
): Promise<Suggestion[]> {
  const prompt = `You are an expert short-form video editor growing a YOGA + foreigner-lifestyle Instagram/Reels account. This is a movement/yoga practice video.

Pick the ${count} STRONGEST ~2-second moments to use as standalone Reel clips. Prefer: the peak of a pose, a powerful or graceful shape, a clean dynamic transition, visually striking framing, expressive movement. AVOID: setup/fidgeting, adjusting clothing, looking at the phone, repetitive static holds, dead time.

Return a JSON array of objects with "start" and "end" (SECONDS from the start of THIS video, each clip 1.5 to 3 seconds long) and a short "why". Order them chronologically. Only return moments that are genuinely scroll-stopping.`

  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        start: { type: "NUMBER" },
        end: { type: "NUMBER" },
        why: { type: "STRING" },
      },
      required: ["start", "end", "why"],
    },
  }

  const res = await fetch(`${API}/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { file_data: { mime_type: "video/mp4", file_uri: uri } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    }),
  })
  const j = (await res.json()) as {
    error?: { message?: string }
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  if (!res.ok) throw new Error(j.error?.message || `Gemini error ${res.status}`)
  const text =
    j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  let parsed: Suggestion[]
  try {
    parsed = JSON.parse(text) as Suggestion[]
  } catch {
    throw new Error("Gemini returned an unparseable result")
  }
  return Array.isArray(parsed) ? parsed : []
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    path?: string
    start?: number
    end?: number
    count?: number
  }
  const src = resolveLocal(body.path ?? "")
  if (!src) return NextResponse.json({ error: "Bad path" }, { status: 400 })

  const offset = Math.max(0, Number(body.start) || 0)
  const end = Number(body.end) || 0
  const count = clamp(Math.round(Number(body.count) || 10), 3, 20)

  // Low-res, no-audio proxy — analysis only; the real cut uses the original.
  const proxy = path.join(tmpdir(), `suggest-${crypto.randomUUID()}.mp4`)
  try {
    const trc = await exec(FFPROBE, [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=color_transfer", "-of", "default=nk=1:nw=1", src,
    ]).catch(() => "")
    const hdr = trc.trim() === "arib-std-b67" || trc.trim() === "smpte2084"
    const vf =
      (hdr
        ? "zscale=t=linear:npl=100,tonemap=hable,zscale=p=bt709:t=bt709:m=bt709,format=yuv420p,"
        : "") + "scale=-2:360"

    const args = ["-y", "-loglevel", "error"]
    if (offset > 0) args.push("-ss", String(offset))
    args.push("-i", src)
    if (end > offset) args.push("-t", String(end - offset))
    args.push(
      "-vf", vf,
      "-an", "-r", "10",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
      "-movflags", "+faststart", proxy,
    )
    await exec(FFMPEG, args)

    const bytes = await readFile(proxy)
    const { uri, name } = await geminiUpload(bytes, key)
    let clips: Suggestion[]
    try {
      clips = await geminiSuggest(uri, key, count)
    } finally {
      // Best-effort cleanup of the uploaded file (free-tier storage is capped).
      await fetch(`${API}/v1beta/${name}`, {
        method: "DELETE",
        headers: { "x-goog-api-key": key },
      }).catch(() => {})
    }

    // Map timestamps back to the ORIGINAL (add the analyzed span's offset),
    // normalize each to a sane 1.5–3s window, drop anything degenerate.
    const out = clips
      .map((c) => {
        const s = offset + Math.max(0, Number(c.start) || 0)
        let e = offset + Math.max(0, Number(c.end) || 0)
        if (e <= s) e = s + 2
        const len = clamp(e - s, 1.5, 3)
        e = s + len
        return { start: Number(s.toFixed(2)), end: Number(e.toFixed(2)), why: String(c.why ?? "") }
      })
      .filter((c) => c.end > c.start)

    return NextResponse.json({ clips: out })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Suggest failed" },
      { status: 500 },
    )
  } finally {
    await rm(proxy, { force: true })
  }
}
