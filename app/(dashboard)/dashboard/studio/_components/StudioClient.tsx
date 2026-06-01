"use client"

import * as React from "react"
import Image from "next/image"
import {
  CheckCircle2,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import type {
  CoverConfig,
  SerializedJob,
  StepState,
  StudioConfig,
} from "@/lib/studio/types"

function StepRow({ step }: { step: StepState }) {
  const icon =
    step.status === "done" ? (
      <CheckCircle2 className="size-4 text-emerald-500" />
    ) : step.status === "running" ? (
      <Loader2 className="size-4 animate-spin text-sky-500" />
    ) : step.status === "error" ? (
      <XCircle className="size-4 text-red-500" />
    ) : (
      <span className="size-4 rounded-full border border-muted-foreground/30" />
    )
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span
        className={
          step.status === "skipped"
            ? "text-muted-foreground/50 line-through"
            : step.status === "pending"
              ? "text-muted-foreground"
              : ""
        }
      >
        {step.label}
      </span>
      {step.message && (step.status === "error" || step.status === "pending") ? (
        <span
          className={`truncate text-xs ${
            step.status === "error" ? "text-red-500" : "text-muted-foreground"
          }`}
        >
          — {step.message}
        </span>
      ) : null}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
        checked
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      <span
        className={`size-3.5 rounded-sm border ${
          checked ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
        }`}
      />
      {label}
    </button>
  )
}

export function StudioClient() {
  const [file, setFile] = React.useState<File | null>(null)
  const [kenburns, setKenburns] = React.useState(true)

  const [capOn, setCapOn] = React.useState(true)
  const [capMain, setCapMain] = React.useState("")
  const [capSub, setCapSub] = React.useState("")
  const [capFog, setCapFog] = React.useState(true)

  const [fpOn, setFpOn] = React.useState(false)
  const [fpStep, setFpStep] = React.useState("0.5")

  const [coverOn, setCoverOn] = React.useState(false)
  const [coverText, setCoverText] = React.useState("")
  const [coverPos, setCoverPos] =
    React.useState<CoverConfig["position"]>("bottom")

  // Phase 2 — finishing the cover from a chosen contact-sheet frame.
  const [coverFrame, setCoverFrame] = React.useState("1")
  const [coverText2, setCoverText2] = React.useState("")
  const [coverPos2, setCoverPos2] =
    React.useState<CoverConfig["position"]>("bottom")
  const [coverBusy, setCoverBusy] = React.useState(false)
  const [coverErr, setCoverErr] = React.useState<string | null>(null)

  const [job, setJob] = React.useState<SerializedJob | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Poll the job until it finishes.
  React.useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") return
    const t = setInterval(async () => {
      const res = await fetch(`/api/studio/jobs/${job.id}`, {
        cache: "no-store",
      })
      if (res.ok) setJob((await res.json()) as SerializedJob)
    }, 1200)
    return () => clearInterval(t)
  }, [job])

  const running = job?.status === "running" || job?.status === "queued"

  // Prefill the phase-2 cover form from the defaults captured at render time.
  const defaultsText = job?.coverDefaults?.text
  const defaultsPos = job?.coverDefaults?.position
  React.useEffect(() => {
    if (defaultsText !== undefined) setCoverText2((p) => p || defaultsText)
    if (defaultsPos !== undefined) setCoverPos2(defaultsPos)
  }, [defaultsText, defaultsPos])

  async function submit() {
    if (!file) return
    setError(null)
    setBusy(true)
    setJob(null)
    const config: StudioConfig = {
      kenburns,
      caption: capOn ? { main: capMain, sub: capSub, fog: capFog } : null,
      framepicker: fpOn ? { step: Number(fpStep) || 0.5 } : null,
      cover: coverOn ? { text: coverText, position: coverPos } : null,
    }
    const fd = new FormData()
    fd.append("file", file)
    fd.append("config", JSON.stringify(config))
    try {
      const res = await fetch("/api/studio/jobs", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setJob(data as SerializedJob)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  const fileUrl = (name: string, download = false) =>
    `/api/studio/files/${job?.id}?name=${encodeURIComponent(name)}${
      download ? "&download=1" : ""
    }`

  async function generateCover() {
    if (!job) return
    setCoverBusy(true)
    setCoverErr(null)
    try {
      const res = await fetch(`/api/studio/jobs/${job.id}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame: Number(coverFrame),
          text: coverText2,
          position: coverPos2,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Cover failed")
      setJob(data as SerializedJob)
    } catch (e) {
      setCoverErr(e instanceof Error ? e.message : "Cover failed")
    } finally {
      setCoverBusy(false)
    }
  }

  const coverStep = job?.steps.find((s) => s.id === "cover")
  const showCoverForm =
    job?.status === "done" &&
    !!job.coverDefaults &&
    coverStep?.status === "pending"

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---- Left: build the pipeline ---- */}
      <Card className="space-y-5 p-5">
        {/* Upload */}
        <div>
          <Label className="mb-2 block">1 · Upload a clip</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition hover:bg-muted/50">
            <Upload className="size-5" />
            {file ? (
              <span className="font-medium text-foreground">{file.name}</span>
            ) : (
              <span>Tap to choose a .mov / .mp4</span>
            )}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <Separator />

        {/* Steps */}
        <div className="space-y-4">
          <Label className="block">2 · Pick the steps</Label>

          <Toggle checked={kenburns} onChange={setKenburns} label="Ken Burns zoom" />

          <div className="space-y-2">
            <Toggle checked={capOn} onChange={setCapOn} label="Caption (fog fade-in)" />
            {capOn ? (
              <div className="space-y-2 pl-1">
                <Input
                  placeholder="MAIN LINE (e.g. FULL BODY KETTLEBELL FLOW)"
                  value={capMain}
                  onChange={(e) => setCapMain(e.target.value)}
                />
                <Input
                  placeholder="Subtitle (e.g. 3 ROUNDS | 30 SEC) — optional"
                  value={capSub}
                  onChange={(e) => setCapSub(e.target.value)}
                />
                <Toggle
                  checked={capFog}
                  onChange={setCapFog}
                  label="Fog fade-in animation"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Toggle checked={fpOn} onChange={setFpOn} label="Frame contact sheet" />
            {fpOn ? (
              <div className="flex items-center gap-2 pl-1">
                <Label className="text-xs text-muted-foreground">
                  Every
                </Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.1"
                  value={fpStep}
                  onChange={(e) => setFpStep(e.target.value)}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">seconds</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Toggle checked={coverOn} onChange={setCoverOn} label="Cover / thumbnail" />
            {coverOn ? (
              <div className="space-y-2 pl-1">
                <Input
                  placeholder="Cover text (use \n for a line break)"
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">
                    Position
                  </Label>
                  <Select
                    value={coverPos}
                    onValueChange={(v) =>
                      setCoverPos(v as CoverConfig["position"])
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Renders a contact sheet first — you pick the frame after.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <Separator />

        <Button
          onClick={submit}
          disabled={!file || busy || running}
          className="w-full"
        >
          {busy || running ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Rendering…
            </>
          ) : (
            <>
              <Film className="size-4" /> Render
            </>
          )}
        </Button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </Card>

      {/* ---- Right: progress + results ---- */}
      <Card className="space-y-5 p-5">
        <Label className="block">3 · Result</Label>

        {!job ? (
          <p className="text-sm text-muted-foreground">
            Your rendered clip, contact sheet and cover will appear here.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              {job.steps.map((s) => (
                <StepRow key={s.id} step={s} />
              ))}
            </div>

            {job.status === "error" ? (
              <p className="text-sm text-red-500">{job.error}</p>
            ) : null}

            {job.artifacts.length > 0 ? (
              <>
                <Separator />
                <div className="space-y-4">
                  {job.artifacts.map((a) => (
                    <div key={a.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {a.kind === "video" ? (
                            <Film className="size-4" />
                          ) : (
                            <ImageIcon className="size-4" />
                          )}
                          {a.label}
                        </span>
                        <a
                          href={fileUrl(a.name, true)}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          <Download className="size-3.5" /> Download
                        </a>
                      </div>
                      {a.kind === "video" ? (
                        <video
                          src={fileUrl(a.name)}
                          controls
                          className="max-h-[60vh] w-full rounded-lg bg-black"
                        />
                      ) : (
                        <div className="relative h-[50vh] w-full overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={fileUrl(a.name)}
                            alt={a.label}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {showCoverForm ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="block">Finish the cover</Label>
                  <p className="text-xs text-muted-foreground">
                    Find the best frame number in the contact sheet above, then
                    generate.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Frame #
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={job.frameCount || undefined}
                      value={coverFrame}
                      onChange={(e) => setCoverFrame(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">
                      of {job.frameCount}
                    </span>
                    <Select
                      value={coverPos2}
                      onValueChange={(v) =>
                        setCoverPos2(v as CoverConfig["position"])
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Cover text (use \n for a line break)"
                    value={coverText2}
                    onChange={(e) => setCoverText2(e.target.value)}
                  />
                  <Button
                    onClick={generateCover}
                    disabled={coverBusy || !coverText2.trim()}
                    className="w-full"
                  >
                    {coverBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-4" /> Generate cover
                      </>
                    )}
                  </Button>
                  {coverErr ? (
                    <p className="text-sm text-red-500">{coverErr}</p>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        )}
      </Card>
    </div>
  )
}
