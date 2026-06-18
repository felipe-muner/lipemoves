export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { readdir, stat } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"

const VIDEO_EXT = new Set([".mov", ".mp4", ".m4v", ".webm", ".mkv", ".avi"])

/** Resolve a user-typed folder (supports ~) and keep it inside the home dir. */
function resolveDir(input: string): string | null {
  const home = homedir()
  let p = input.trim()
  if (!p) return null
  if (p === "~" || p.startsWith("~/")) p = path.join(home, p.slice(1))
  p = path.resolve(p)
  // Local-first studio = the user's own Mac; only allow their home tree.
  if (p !== home && !p.startsWith(home + path.sep)) return null
  return p
}

/**
 * List the video files in a local folder on the machine running the studio
 * (local-first). Lets you cut/render straight from huge AirDropped recordings
 * without uploading them.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dir = resolveDir(req.nextUrl.searchParams.get("dir") ?? "")
  if (!dir) {
    return NextResponse.json(
      { error: "Folder must be inside your home directory" },
      { status: 400 },
    )
  }

  try {
    const names = await readdir(dir)
    const files = (
      await Promise.all(
        names
          .filter((n) => VIDEO_EXT.has(path.extname(n).toLowerCase()))
          .map(async (n) => {
            const full = path.join(dir, n)
            try {
              const s = await stat(full)
              if (!s.isFile()) return null
              return { name: n, path: full, size: s.size, mtime: s.mtimeMs }
            } catch {
              return null
            }
          }),
      )
    )
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => b.mtime - a.mtime)
    return NextResponse.json({ dir, files })
  } catch {
    return NextResponse.json({ error: "Could not read that folder" }, { status: 404 })
  }
}
