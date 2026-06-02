export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 600

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob, putJob } from "@/lib/studio/jobs"
import { runPipeline } from "@/lib/studio/pipeline"
import {
  serializeJob,
  type ClipState,
  type Job,
  type StudioConfig,
} from "@/lib/studio/types"

const pad2 = (n: number) => String(n).padStart(2, "0")

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await request.formData()
  const files = form.getAll("files").filter((f): f is File => f instanceof File)
  const configRaw = form.get("config")

  if (files.length === 0) {
    return NextResponse.json({ error: "No videos uploaded" }, { status: 400 })
  }
  if (typeof configRaw !== "string") {
    return NextResponse.json({ error: "Missing config" }, { status: 400 })
  }

  let config: StudioConfig
  try {
    config = JSON.parse(configRaw) as StudioConfig
  } catch {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 })
  }
  if (!Array.isArray(config.clips) || config.clips.length !== files.length) {
    return NextResponse.json(
      { error: "Config does not match uploaded files" },
      { status: 400 },
    )
  }

  const id = crypto.randomUUID()
  const dir = path.join(process.cwd(), "private", "studio", id)
  await mkdir(dir, { recursive: true })

  const inputNames: string[] = []
  const clips: ClipState[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = (path.extname(file.name) || ".mp4").toLowerCase()
    const inputName = `input${ext}`
    const cdir = path.join(dir, `clip${pad2(i)}`)
    await mkdir(cdir, { recursive: true })
    await writeFile(
      path.join(cdir, inputName),
      Buffer.from(await file.arrayBuffer()),
    )
    inputNames.push(inputName)
    clips.push({
      index: i,
      label: file.name,
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
    kenburns: config.kenburns,
    clips,
    joinedName: null,
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
