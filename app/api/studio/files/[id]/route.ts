export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob } from "@/lib/studio/jobs"

interface RouteContext {
  params: Promise<{ id: string }>
}

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const job = getJob(id)
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  const url = new URL(request.url)
  const name = url.searchParams.get("name") ?? ""
  // Resolve within the job dir and reject any traversal outside it.
  const target = path.resolve(job.dir, name)
  if (target !== job.dir && !target.startsWith(job.dir + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  let data: Buffer
  try {
    data = await readFile(target)
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const type = TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream"
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "no-store",
  })
  if (url.searchParams.get("download")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${path.basename(target)}"`,
    )
  }

  return new NextResponse(new Uint8Array(data), { headers })
}
