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
  ClipState,
  CoverPosition,
  SerializedJob,
  StudioConfig,
} from "@/lib/studio/types"

const pad2 = (n: number) => String(n).padStart(2, "0")
const pad3 = (n: number) => String(n).padStart(3, "0")

/** Default vertical center (fraction of frame) for each position preset. */
const presetY = (p: CoverPosition) => (p === "top" ? 0.12 : p === "center" ? 0.5 : 0.86)

interface ClipCfg {
  captionOn: boolean
  main: string
  sub: string
}

function statusIcon(status: ClipState["status"]) {
  if (status === "done") return <CheckCircle2 className="size-4 text-emerald-500" />
  if (status === "running") return <Loader2 className="size-4 animate-spin text-sky-500" />
  if (status === "error") return <XCircle className="size-4 text-red-500" />
  return <span className="size-4 rounded-full border border-muted-foreground/30" />
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
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
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

/** Draggable + resizable cover-text overlay. Free X/Y drag with a live center
 *  guide that snaps to horizontal center, plus a bottom-right handle to scale
 *  the font. It measures the rendered width and reports it (as a fraction of the
 *  frame) so the burned cover (cover.sh) matches the preview exactly. */
function CoverText({
  text,
  cx,
  cy,
  size,
  onMove,
  onResize,
  onMeasure,
}: {
  text: string
  cx: number
  cy: number
  size: number
  onMove: (x: number, y: number) => void
  onResize: (size: number) => void
  onMeasure: (widthFrac: number) => void
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState(false)
  const [snapped, setSnapped] = React.useState(false)
  const [hot, setHot] = React.useState(false) // show the bounding box
  const rz = React.useRef<{ startDist: number; startSize: number } | null>(null)

  // Report the widest line's width (fraction of the frame) so the burn matches.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const box = boxRef.current
    if (!root || !box) return
    const measure = () => {
      const cw = root.clientWidth
      if (cw) onMeasure(box.offsetWidth / cw)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    ro.observe(box)
    return () => ro.disconnect()
  }, [text, size, onMeasure])

  // Screen-space center of the text block (for the resize math).
  function blockCenter() {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: r.left + cx * r.width, y: r.top + cy * r.height }
  }

  function moveTo(e: React.PointerEvent) {
    const r = rootRef.current!.getBoundingClientRect()
    let x = (e.clientX - r.left) / r.width
    let y = (e.clientY - r.top) / r.height
    const snap = Math.abs(x - 0.5) < 0.025 // magnet zone around dead-center
    if (snap) x = 0.5
    x = Math.min(0.95, Math.max(0.05, x))
    y = Math.min(0.95, Math.max(0.05, y))
    setSnapped(snap)
    onMove(x, y)
  }

  return (
    <div ref={rootRef} className="absolute inset-0">
      {/* center guide: only while dragging; turns lime + glows when snapped */}
      {drag ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{
            background: snapped ? "#00EF00" : "rgba(255,255,255,.55)",
            boxShadow: snapped ? "0 0 6px #00EF00" : "none",
          }}
        />
      ) : null}

      <div
        ref={boxRef}
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => {
          if (!drag) setHot(false)
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(true)
          moveTo(e)
        }}
        onPointerMove={(e) => {
          if (drag) moveTo(e)
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId)
          setDrag(false)
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-pre text-center uppercase"
        style={{
          left: `${cx * 100}%`,
          top: `${cy * 100}%`,
          cursor: drag ? "grabbing" : "grab",
          touchAction: "none",
          outline: hot || drag ? "1px dashed rgba(255,255,255,.85)" : "none",
          outlineOffset: "4px",
          fontFamily: '"Archivo Black", system-ui, sans-serif',
          color: "#00EF00",
          fontSize: `${size}cqw`,
          lineHeight: 1.02,
          // Match cover.sh's burned outline: a Disk:21 dilation at 220pt font is
          // an OUTWARD-only black ring of 21/220 ≈ 0.0955 of the font size. With
          // paint-order:stroke the green fill paints over the stroke's inner
          // half, so the visible outward outline is strokeWidth/2 — hence 2×.
          paintOrder: "stroke",
          WebkitTextStroke: `${(size * 0.191).toFixed(3)}cqw #000`,
        }}
      >
        {text.replace(/\\n/g, "\n")}

        {/* resize handle — drag out to enlarge, in to shrink */}
        <span
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.setPointerCapture(e.pointerId)
            const c = blockCenter()
            rz.current = {
              startDist: Math.hypot(e.clientX - c.x, e.clientY - c.y),
              startSize: size,
            }
          }}
          onPointerMove={(e) => {
            if (!rz.current) return
            e.stopPropagation()
            const c = blockCenter()
            const dist = Math.hypot(e.clientX - c.x, e.clientY - c.y)
            const { startDist, startSize } = rz.current
            onResize(Math.min(34, Math.max(5, (startSize * dist) / startDist)))
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId)
            rz.current = null
          }}
          className="absolute -bottom-2.5 -right-2.5 block size-4 cursor-nwse-resize rounded-full border-2 border-white bg-emerald-500 shadow"
          style={{ touchAction: "none", WebkitTextStroke: "0", textShadow: "none" }}
        />
      </div>
    </div>
  )
}

function ModeOption({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean
  onClick: () => void
  label: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={desc}
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition ${
        active
          ? "border-emerald-500/60 bg-emerald-500/10"
          : "border-border hover:bg-muted"
      }`}
    >
      <span
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-emerald-500" : "border-muted-foreground/40"
        }`}
      >
        {active ? <span className="size-1.5 rounded-full bg-emerald-500" /> : null}
      </span>
      <span
        className={`truncate text-xs font-medium ${
          active ? "text-emerald-600 dark:text-emerald-400" : ""
        }`}
      >
        {label}
      </span>
    </button>
  )
}

export function StudioClient() {
  const [files, setFiles] = React.useState<File[]>([])
  const [clipCfgs, setClipCfgs] = React.useState<ClipCfg[]>([])

  const [mode, setMode] = React.useState<"kenburns" | "frames">("kenburns")
  const [fog, setFog] = React.useState(true)
  const [join, setJoin] = React.useState(true)
  const [fpStep, setFpStep] = React.useState("0.5")

  // Cover studio (phase 2).
  const [selClip, setSelClip] = React.useState(0)
  const [selFrame, setSelFrame] = React.useState(1)
  const [coverText, setCoverText] = React.useState("")
  const [coverPos, setCoverPos] = React.useState<CoverPosition>("bottom")
  // Free-drag center of the cover text, as fractions of the frame (0..1).
  const [coverX, setCoverX] = React.useState(0.5)
  const [coverY, setCoverY] = React.useState(0.86)
  // Cover font size, in cqw (% of the preview width). Resized via a corner handle.
  const [coverSize, setCoverSize] = React.useState(13)
  // Latest measured widest-line width as a fraction of the frame (preview → burn).
  const coverWidthRef = React.useRef(0.9)
  const reportCoverWidth = React.useCallback((frac: number) => {
    coverWidthRef.current = frac
  }, [])
  const [aspect, setAspect] = React.useState(9 / 16)
  const [burnedUrl, setBurnedUrl] = React.useState<string | null>(null)
  const [coverBusy, setCoverBusy] = React.useState(false)
  const [coverErr, setCoverErr] = React.useState<string | null>(null)

  const [job, setJob] = React.useState<SerializedJob | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function pickFiles(list: FileList | null) {
    const arr = list ? Array.from(list) : []
    setFiles(arr)
    setClipCfgs(arr.map(() => ({ captionOn: false, main: "", sub: "" })))
  }

  function setClip(i: number, patch: Partial<ClipCfg>) {
    setClipCfgs((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    )
  }

  // Poll until the job finishes.
  React.useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") return
    const t = setInterval(async () => {
      const res = await fetch(`/api/studio/jobs/${job.id}`, { cache: "no-store" })
      if (res.ok) setJob((await res.json()) as SerializedJob)
    }, 1200)
    return () => clearInterval(t)
  }, [job])

  // Cover input changes invalidate the last burned image.
  React.useEffect(() => {
    setBurnedUrl(null)
  }, [selClip, selFrame, coverText, coverPos, coverX, coverY])

  const running = job?.status === "running" || job?.status === "queued"
  const clipsWithFrames = job?.clips.filter((c) => c.frameCount > 0) ?? []

  // Default the cover studio to the first clip that has frames.
  React.useEffect(() => {
    if (clipsWithFrames.length && !clipsWithFrames.some((c) => c.index === selClip)) {
      setSelClip(clipsWithFrames[0].index)
      setSelFrame(1)
    }
  }, [clipsWithFrames, selClip])

  async function submit() {
    if (files.length === 0) return
    setError(null)
    setBusy(true)
    setJob(null)
    setBurnedUrl(null)
    const config: StudioConfig = {
      kenburns: mode === "kenburns",
      fog,
      join,
      framepicker: mode === "frames" ? { step: Number(fpStep) || 0.5 } : null,
      clips: clipCfgs.map((c) => ({
        caption: c.captionOn && c.main.trim() ? { main: c.main, sub: c.sub } : null,
      })),
    }
    const fd = new FormData()
    files.forEach((f) => fd.append("files", f))
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

  const clipObj = job?.clips.find((c) => c.index === selClip) ?? null

  async function downloadCover() {
    if (!job || !clipObj || !coverText.trim()) return
    setCoverBusy(true)
    setCoverErr(null)
    try {
      const res = await fetch(`/api/studio/jobs/${job.id}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip: selClip,
          frame: selFrame,
          text: coverText,
          position: coverPos,
          x: coverX,
          y: coverY,
          width: coverWidthRef.current,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Cover failed")
      const updated = data as SerializedJob
      setJob(updated)
      const name =
        updated.clips.find((c) => c.index === selClip)?.coverName ??
        `clip${pad2(selClip)}/cover.jpg`
      const bust = `&t=${Date.now()}`
      setBurnedUrl(fileUrl(name) + bust)
      const a = document.createElement("a")
      a.href = fileUrl(name, true) + bust
      a.download = "cover.jpg"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      setCoverErr(e instanceof Error ? e.message : "Cover failed")
    } finally {
      setCoverBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ---- Top: compact builder. Mode radio first, then upload (+ captions
            on the right for Ken Burns), kept short so the result sits high. ---- */}
      <Card className="gap-5 p-3">
        {/* Mode — pick this first */}
        <div className="flex flex-wrap items-center gap-2">
          <ModeOption
            active={mode === "kenburns"}
            onClick={() => setMode("kenburns")}
            label="Ken Burns zoom"
            desc="Zoom all clips (alternating in/out), with optional captions per clip."
          />
          <ModeOption
            active={mode === "frames"}
            onClick={() => setMode("frames")}
            label="Frame contact sheet"
            desc="Extract frames per clip so you can pick + make a cover."
          />
          {mode === "frames" ? (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Every</Label>
              <Input
                type="number"
                step="0.25"
                min="0.1"
                value={fpStep}
                onChange={(e) => setFpStep(e.target.value)}
                className="h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          ) : null}
          {mode === "kenburns" && files.length ? (
            <div className="ml-auto flex items-center gap-2">
              {files.length > 1 ? (
                <Toggle checked={join} onChange={setJoin} label="Join" />
              ) : null}
              <Toggle checked={fog} onChange={setFog} label="Fog fade-in" />
            </div>
          ) : null}
        </div>

        {/* Upload (left) + captions (right, Ken Burns only) */}
        <div
          className={`grid gap-4 ${
            mode === "kenburns" && files.length ? "md:grid-cols-2" : ""
          }`}
        >
          <div className="space-y-2">
            <label className="flex w-full max-w-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition hover:bg-muted/50">
              <Upload className="size-5" />
              {files.length ? (
                <span className="font-medium text-foreground">
                  {files.length} clip{files.length > 1 ? "s" : ""} selected
                </span>
              ) : (
                <span>Tap to choose one or more .mov / .mp4</span>
              )}
              <input
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => pickFiles(e.target.files)}
              />
            </label>
          </div>

          {mode === "kenburns" && files.length ? (
            <div className="space-y-2">
              <Label className="block text-xs">Captions per clip</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {files.map((f, i) => {
                  const cfg = clipCfgs[i]
                  if (!cfg) return null
                  return (
                    <div key={i} className="rounded-lg border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium" title={f.name}>
                          {i + 1}. {f.name}
                        </span>
                        <Toggle
                          checked={cfg.captionOn}
                          onChange={(v) => setClip(i, { captionOn: v })}
                          label="Caption"
                        />
                      </div>
                      {cfg.captionOn ? (
                        <div className="mt-2 space-y-2">
                          <Input
                            placeholder="MAIN LINE"
                            className="h-8"
                            value={cfg.main}
                            onChange={(e) => setClip(i, { main: e.target.value })}
                          />
                          <Input
                            placeholder="Subtitle (optional)"
                            className="h-8"
                            value={cfg.sub}
                            onChange={(e) => setClip(i, { sub: e.target.value })}
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <Button
          onClick={submit}
          size="sm"
          disabled={files.length === 0 || busy || running}
          className="h-8 w-fit px-3 text-xs"
        >
          {busy || running ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Rendering…
            </>
          ) : (
            <>
              <Film className="size-3.5" /> Render {files.length || ""} clip
              {files.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </Card>

      {/* ---- Bottom: full-width progress + results ---- */}
      <Card className="space-y-5 p-5">
        <Label className="block">4 · Result</Label>

        {!job ? (
          <p className="text-sm text-muted-foreground">
            Your processed clips and covers will appear here.
          </p>
        ) : (
          <>
            {/* joined final video (Ken Burns mode) */}
            {job.joinedName ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Film className="size-4" /> Final video (joined)
                  </span>
                  <a
                    href={fileUrl(job.joinedName, true)}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    <Download className="size-3.5" /> Download
                  </a>
                </div>
                <video
                  src={fileUrl(job.joinedName)}
                  controls
                  className="max-h-[60vh] w-full rounded-lg bg-black"
                />
                <Separator />
              </div>
            ) : null}
            {job.joinError ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Couldn’t join clips ({job.joinError}) — individual clips are below.
              </p>
            ) : null}

            {/* per-clip progress + video */}
            {job.clips.map((c) => (
              <div key={c.index} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    {statusIcon(c.status)}
                    <span className="truncate" title={c.label}>
                      {c.label}
                    </span>
                  </span>
                  {c.videoName && job.kenburns ? (
                    <a
                      href={fileUrl(c.videoName, true)}
                      className="flex shrink-0 items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      <Download className="size-3.5" /> Download
                    </a>
                  ) : null}
                </div>
                {c.status === "error" ? (
                  <p className="text-xs text-red-500">{c.message}</p>
                ) : null}
                {/* In frames/contact-sheet mode skip the video player — only the
                    cover section below matters. */}
                {c.videoName && !job.joinedName && job.kenburns ? (
                  <video
                    src={fileUrl(c.videoName)}
                    controls
                    className="max-h-[50vh] w-full rounded-lg bg-black"
                  />
                ) : null}
              </div>
            ))}

            {/* ---- Cover studio ---- */}
            {clipsWithFrames.length && clipObj ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="block">Cover</Label>
                    {clipsWithFrames.length > 1 ? (
                      <Select
                        value={String(selClip)}
                        onValueChange={(v) => {
                          setSelClip(Number(v))
                          setSelFrame(1)
                        }}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clipsWithFrames.map((c) => (
                            <SelectItem key={c.index} value={String(c.index)}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>

                  {/* frame picker — single horizontal scrollable strip */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {Array.from({ length: clipObj.frameCount }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSelFrame(n)}
                          className={`relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md ring-2 transition ${
                            selFrame === n
                              ? "ring-emerald-500"
                              : "ring-transparent hover:ring-muted-foreground/40"
                          }`}
                        >
                          <Image
                            src={fileUrl(`${clipObj.framesPrefix}/web/${pad3(n)}.jpg`)}
                            alt={`Frame ${n}`}
                            fill
                            unoptimized
                            // eager: the strip scrolls horizontally, so off-screen
                            // frames would never trip lazy-load's viewport check.
                            loading="eager"
                            sizes="96px"
                            className="object-cover"
                          />
                          <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[10px] font-bold text-emerald-400">
                            {n}
                          </span>
                        </button>
                      ),
                    )}
                  </div>

                  {/* text + position controls (below the frame strip) */}
                  <Input
                    placeholder="Cover text (use \n for a line break)"
                    value={coverText}
                    onChange={(e) => setCoverText(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <Select
                      value={coverPos}
                      onValueChange={(v) => {
                        const p = v as CoverPosition
                        setCoverPos(p)
                        // Jumping to a preset re-centers horizontally + snaps to
                        // that vertical anchor (drag from there to fine-tune).
                        setCoverX(0.5)
                        setCoverY(presetY(p))
                      }}
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
                    <span className="ml-auto text-xs text-muted-foreground">
                      frame {selFrame} / {clipObj.frameCount}
                    </span>
                  </div>

                  {/* live preview (result) */}
                  <div
                    className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-lg bg-black"
                    style={{ aspectRatio: String(aspect), containerType: "inline-size" }}
                  >
                    <Image
                      src={
                        burnedUrl ??
                        fileUrl(`${clipObj.framesPrefix}/frames/${pad3(selFrame)}.png`)
                      }
                      alt="Cover preview"
                      fill
                      unoptimized
                      className="object-contain"
                      onLoad={(e) => {
                        const t = e.currentTarget
                        if (t.naturalWidth && t.naturalHeight) {
                          setAspect(t.naturalWidth / t.naturalHeight)
                        }
                      }}
                    />
                    {!burnedUrl && coverText.trim() ? (
                      <CoverText
                        text={coverText}
                        cx={coverX}
                        cy={coverY}
                        size={coverSize}
                        onMove={(x, y) => {
                          setCoverX(x)
                          setCoverY(y)
                        }}
                        onResize={setCoverSize}
                        onMeasure={reportCoverWidth}
                      />
                    ) : null}
                  </div>

                  {/* download button (below the result) */}
                  {burnedUrl ? (
                    <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="size-3.5" /> Cover downloaded — preview
                      above is the real burned image.
                    </p>
                  ) : null}
                  <Button
                    onClick={downloadCover}
                    disabled={coverBusy || !coverText.trim()}
                    className="w-full"
                  >
                    {coverBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Rendering cover…
                      </>
                    ) : (
                      <>
                        <Download className="size-4" /> Download cover
                      </>
                    )}
                  </Button>
                  {coverErr ? <p className="text-sm text-red-500">{coverErr}</p> : null}
                </div>
              </>
            ) : null}
          </>
        )}
      </Card>
    </div>
  )
}
