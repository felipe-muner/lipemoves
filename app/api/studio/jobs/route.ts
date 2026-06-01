export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getJob, putJob } from "@/lib/studio/jobs"
import { runPipeline } from "@/lib/studio/pipeline"
import {
  serializeJob,
  type Job,
  type StepState,
  type StudioConfig,
} from "@/lib/studio/types"

const STEP_LABELS: { id: StepState["id"]; label: string }[] = [
  { id: "kenburns", label: "Ken Burns zoom" },
  { id: "caption", label: "Caption (fog fade)" },
  { id: "framepicker", label: "Frame contact sheet" },
  { id: "cover", label: "Cover / thumbnail" },
]

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get("file")
  const configRaw = form.get("config")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video uploaded" }, { status: 400 })
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

  const ext = (path.extname(file.name) || ".mp4").toLowerCase()
  const inputName = `input${ext}`
  const id = crypto.randomUUID()
  const dir = path.join(process.cwd(), "private", "studio", id)
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, inputName),
    Buffer.from(await file.arrayBuffer()),
  )

  const steps: StepState[] = STEP_LABELS.map((s) => ({
    id: s.id,
    label: s.label,
    status: "pending",
  }))

  const job: Job = {
    id,
    createdAt: new Date().toISOString(),
    inputName,
    status: "queued",
    steps,
    artifacts: [],
    coverRequested: false,
    frameCount: 0,
    dir,
  }
  putJob(job)

  // Fire-and-forget: rendering continues in this Node process while the client
  // polls GET /api/studio/jobs/[id]. (Local-first; a prod worker would dequeue.)
  void runPipeline(job, config)

  const stored = getJob(id)
  return NextResponse.json(stored ? serializeJob(stored) : { id }, {
    status: 202,
  })
}
