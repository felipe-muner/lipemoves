"use client"

import * as React from "react"
import Image from "next/image"
import {
  CheckCircle2,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Plus,
  Upload,
  X,
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
import { Slider } from "@/components/ui/slider"

import type {
  ClipState,
  CoverPosition,
  SerializedJob,
  StudioConfig,
} from "@/lib/studio/types"
import {
  DEFAULT_FONT,
  FONTS,
  fontCss,
  fontWeight,
  type FontKey,
} from "@/lib/studio/fonts"

/** Grab a poster frame from an uploaded video, client-side, so the drill-label
 *  editor has a real backdrop to drag the text onto without a server round-trip. */
function extractPoster(
  file: File,
): Promise<{ url: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "auto"
    video.muted = true
    video.playsInline = true
    const src = URL.createObjectURL(file)
    video.src = src
    const cleanup = () => URL.revokeObjectURL(src)
    video.onloadeddata = () => {
      // Seek a touch in so we don't grab a black first frame.
      video.currentTime = Math.min(0.15, (video.duration || 1) / 2)
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("no canvas context")
        ctx.drawImage(video, 0, 0)
        const url = canvas.toDataURL("image/jpeg", 0.82)
        cleanup()
        resolve({ url, aspect: video.videoWidth / video.videoHeight })
      } catch (e) {
        cleanup()
        reject(e instanceof Error ? e : new Error("poster failed"))
      }
    }
    video.onerror = () => {
      cleanup()
      reject(new Error("Could not read this video for a preview frame"))
    }
  })
}

const pad2 = (n: number) => String(n).padStart(2, "0")
const pad3 = (n: number) => String(n).padStart(3, "0")

/** Default vertical center (fraction of frame) for each position preset. */
const presetY = (p: CoverPosition) => (p === "top" ? 0.12 : p === "center" ? 0.5 : 0.86)

/** Quick cover-colour swatches (brand green first as the default). */
const COVER_SWATCHES = [
  { label: "Brand green", value: "#00EF00" },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
] as const

type ZoomMode = "off" | "in" | "out"

/** One free-drag text box on a clip (its own font + placement). */
interface TextBox {
  id: string
  text: string
  /** Free-drag center (fractions of the frame). */
  x: number
  y: number
  /** Font size in cqw (% of preview width); set via the resize handle. */
  size: number
  /** Measured widest-line width as a fraction of the frame (preview → burn). */
  width: number
  font: FontKey
}

/** Per-clip Compose settings: a Ken Burns zoom and/or one or more text boxes,
 *  edited on the clip's own poster frame. */
interface ComposeCfg {
  /** Ken Burns zoom direction (or off). */
  zoom: ZoomMode
  /** Text boxes to burn (in paint order). */
  texts: TextBox[]
  /** Client-extracted poster frame (data URL), or null while extracting. */
  poster: string | null
  /** Poster aspect ratio (w/h) for the preview box. */
  aspect: number
}

let textBoxSeq = 0
function newTextBox(): TextBox {
  textBoxSeq += 1
  return {
    id: `t${textBoxSeq}`,
    text: "",
    x: 0.5,
    y: 0.85,
    size: 7,
    width: 0.6,
    font: DEFAULT_FONT,
  }
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
  color = "#00EF00",
  opacity = 1,
  outline = true,
  grunge = false,
  grungeThickness = 0,
  fontFamily = '"Archivo Black", system-ui, sans-serif',
  fontWeight,
  uppercase = true,
  onMove,
  onResize,
  onMeasure,
}: {
  text: string
  cx: number
  cy: number
  size: number
  /** Fill color (defaults to the cover's pure green). */
  color?: string
  /** Text opacity 0..1 (labels default to a ghosted 0.5). */
  opacity?: number
  /** Thick black stroke (cover) vs. a soft drop shadow (labels). */
  outline?: boolean
  /** Distressed "stamp" preview: keyline + diagonal scratches + drop shadow,
   *  approximating the burned grunge look. */
  grunge?: boolean
  /** Extra glyph thickness for the grunge preview (heavier keyline). */
  grungeThickness?: number
  /** CSS font-family; must match the burn font for an accurate preview. */
  fontFamily?: string
  /** CSS font-weight (for variable/multi-weight families). */
  fontWeight?: number
  /** Force uppercase (cover look). Labels keep the text as typed. */
  uppercase?: boolean
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

  // Call onMeasure through a ref so the effect below doesn't re-run (and rebuild
  // its ResizeObserver) just because the parent passed a new inline callback —
  // important when many editors are mounted at once.
  const onMeasureRef = React.useRef(onMeasure)
  React.useLayoutEffect(() => {
    onMeasureRef.current = onMeasure
  })

  // Report the widest line's width (fraction of the frame) so the burn matches.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const box = boxRef.current
    if (!root || !box) return
    const measure = () => {
      const cw = root.clientWidth
      if (cw) onMeasureRef.current(box.offsetWidth / cw)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    ro.observe(box)
    return () => ro.disconnect()
  }, [text, size])

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
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
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
        className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-pre text-center ${
          uppercase ? "uppercase" : ""
        }`}
        style={{
          left: `${cx * 100}%`,
          top: `${cy * 100}%`,
          cursor: drag ? "grabbing" : "grab",
          touchAction: "none",
          outline: hot || drag ? "1px dashed rgba(255,255,255,.85)" : "none",
          outlineOffset: "4px",
          fontFamily,
          fontWeight,
          color,
          opacity,
          fontSize: `${size}cqw`,
          lineHeight: 1.02,
          // Cover: match cover.sh's burned outline — a Disk:21 dilation at 220pt
          // font is an OUTWARD-only black ring of 21/220 ≈ 0.0955 of the font
          // size. With paint-order:stroke the fill paints over the stroke's
          // inner half, so the visible outward outline is strokeWidth/2 — hence
          // 2×. Drill labels: no stroke, just a soft shadow (matches
          // label-video.sh's drop shadow).
          ...(outline && !grunge
            ? {
                paintOrder: "stroke",
                WebkitTextStroke: `${(size * 0.191).toFixed(3)}cqw #000`,
              }
            : {
                WebkitTextStroke: "0",
                textShadow: "0 0.3cqw 1.2cqw rgba(0,0,0,.5)",
              }),
          // Grunge preview: solid fill colour + a thin dark keyline (text-stroke
          // painted under the fill) + a soft drop shadow. The speckled edges and
          // light grain are burn-only details, approximated here by the keyline.
          ...(grunge
            ? {
                paintOrder: "stroke",
                WebkitTextStroke: `${(size * 0.022 + grungeThickness * 0.015).toFixed(3)}cqw rgba(0,0,0,.92)`,
                textShadow: "0 0.3cqw 1.2cqw rgba(0,0,0,.5)",
              }
            : null),
        }}
      >
        {text.replace(/\\n/g, "\n")}

        {/* Grunge scratches: a duplicate of the text clipped to a fine diagonal
            hatch, overlaid as light dark marks so the preview hints at the
            burned scratches (the keyline stays on the base element). */}
        {grunge ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 whitespace-pre text-center"
            style={{
              backgroundImage:
                "repeating-linear-gradient(122deg, transparent 0 0.03em, rgba(0,0,0,.5) 0.03em 0.045em)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {text.replace(/\\n/g, "\n")}
          </span>
        ) : null}

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

  const [mode, setMode] = React.useState<"compose" | "frames">("compose")
  const [join, setJoin] = React.useState(true)
  const [fpStep, setFpStep] = React.useState("0.5")

  // Compose mode: per-clip zoom + text/placement, with a shared text style.
  const [composeCfgs, setComposeCfgs] = React.useState<ComposeCfg[]>([])
  const [textColor, setTextColor] = React.useState("#FFFFFF")
  const [textOpacity, setTextOpacity] = React.useState(1)
  const [textFade, setTextFade] = React.useState(true)
  const [textGrunge, setTextGrunge] = React.useState(false)
  const [textGrungeThickness, setTextGrungeThickness] = React.useState(0)
  // Latest measured widest-line width per text box (preview → burn), keyed by
  // text-box id. Kept in a ref (like the cover) so measuring never triggers a
  // re-render loop.
  const labelWidths = React.useRef<Record<string, number>>({})
  const setLabelWidth = React.useCallback((id: string, frac: number) => {
    labelWidths.current[id] = frac
  }, [])

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
  const [coverGrunge, setCoverGrunge] = React.useState(false)
  const [coverGrungeThickness, setCoverGrungeThickness] = React.useState(0)
  // Cover fill colour — defaults to the brand green (quick swatch below).
  const [coverColor, setCoverColor] = React.useState("#00EF00")
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
    labelWidths.current = {}
    // Seed per-clip configs: zoom alternates in/out (the classic Ken Burns
    // look, editable per clip), no text boxes yet (add via "Add text").
    // Posters load async below.
    setComposeCfgs(
      arr.map((_, i) => ({
        zoom: i % 2 === 0 ? "in" : "out",
        texts: [],
        poster: null,
        aspect: 9 / 16,
      })),
    )
    arr.forEach((file, i) => {
      extractPoster(file)
        .then(({ url, aspect }) =>
          setComposeCfgs((prev) =>
            prev.map((c, idx) =>
              idx === i ? { ...c, poster: url, aspect } : c,
            ),
          ),
        )
        .catch(() => {
          /* leave poster null — the editor shows a placeholder */
        })
    })
  }

  function setCompose(i: number, patch: Partial<ComposeCfg>) {
    setComposeCfgs((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    )
  }

  function addText(i: number) {
    setComposeCfgs((prev) =>
      prev.map((c, idx) =>
        idx === i ? { ...c, texts: [...c.texts, newTextBox()] } : c,
      ),
    )
  }

  function setText(i: number, id: string, patch: Partial<TextBox>) {
    setComposeCfgs((prev) =>
      prev.map((c, idx) =>
        idx === i
          ? {
              ...c,
              texts: c.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
            }
          : c,
      ),
    )
  }

  function removeText(i: number, id: string) {
    delete labelWidths.current[id]
    setComposeCfgs((prev) =>
      prev.map((c, idx) =>
        idx === i ? { ...c, texts: c.texts.filter((t) => t.id !== id) } : c,
      ),
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
  }, [
    selClip,
    selFrame,
    coverText,
    coverPos,
    coverX,
    coverY,
    coverGrunge,
    coverGrungeThickness,
    coverColor,
  ])

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
      join,
      framepicker: mode === "frames" ? { step: Number(fpStep) || 0.5 } : null,
      text:
        mode === "compose"
          ? {
              color: textColor,
              opacity: textOpacity,
              fade: textFade,
              grunge: textGrunge,
              grungeThickness: textGrungeThickness,
            }
          : null,
      clips: files.map((_, i) => {
        const c = composeCfgs[i]
        return {
          zoom: mode === "compose" && c && c.zoom !== "off" ? c.zoom : null,
          labels:
            mode === "compose" && c
              ? c.texts
                  .filter((t) => t.text.trim())
                  .map((t) => ({
                    text: t.text,
                    x: t.x,
                    y: t.y,
                    width: labelWidths.current[t.id] ?? t.width,
                    font: t.font,
                  }))
              : [],
        }
      }),
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
          grunge: coverGrunge,
          grungeThickness: coverGrungeThickness,
          color: coverColor,
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
      {/* ---- Top: compact builder. Mode radio first, then upload + the
            per-clip editor, kept short so the result sits high. ---- */}
      <Card className="gap-5 p-3">
        {/* Mode — pick this first */}
        <div className="flex flex-wrap items-center gap-2">
          <ModeOption
            active={mode === "compose"}
            onClick={() => setMode("compose")}
            label="Compose"
            desc="Per clip: Ken Burns zoom (in/out) and/or a text label, then stitch them together."
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
          {mode === "compose" && files.length ? (
            <div className="ml-auto flex items-center gap-2">
              {files.length > 1 ? (
                <Toggle checked={join} onChange={setJoin} label="Stitch" />
              ) : null}
              <Toggle checked={textFade} onChange={setTextFade} label="Fade" />
              <Toggle
                checked={textGrunge}
                onChange={setTextGrunge}
                label="Grunge"
              />
            </div>
          ) : null}
        </div>

        {/* Upload */}
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

        {/* Compose: shared text style + per-clip zoom + label, dragged on the
            clip's own poster frame (extracted client-side). */}
        {mode === "compose" && files.length ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Text color</Label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5"
                  aria-label="Text color"
                />
              </div>
              <div className="flex min-w-[200px] flex-1 items-center gap-2">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[Math.round(textOpacity * 100)]}
                  onValueChange={(v) => setTextOpacity((v[0] ?? 100) / 100)}
                  className="max-w-[220px]"
                />
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {Math.round(textOpacity * 100)}%
                </span>
              </div>
              {textGrunge ? (
                <div className="flex min-w-[180px] items-center gap-2">
                  <Label className="text-xs text-muted-foreground">
                    Thickness
                  </Label>
                  <Slider
                    min={0}
                    max={18}
                    step={1}
                    value={[textGrungeThickness]}
                    onValueChange={(v) => setTextGrungeThickness(v[0] ?? 0)}
                    className="max-w-[160px]"
                  />
                  <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                    {textGrungeThickness}
                  </span>
                </div>
              ) : null}
            </div>

            {/* one small editor per clip — scroll horizontally if many */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {composeCfgs.map((c, i) => (
                <div key={i} className="w-[180px] shrink-0 space-y-2">
                  <div
                    className="relative overflow-hidden rounded-lg bg-black"
                    style={{
                      aspectRatio: String(c.aspect),
                      containerType: "inline-size",
                    }}
                  >
                    {c.poster ? (
                      <Image
                        src={c.poster}
                        alt={`Clip ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    )}
                    <span className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-black/70 px-1.5 text-[10px] font-bold text-emerald-400">
                      {i + 1}
                    </span>
                    {c.texts.map((t) =>
                      t.text.trim() ? (
                        <CoverText
                          key={t.id}
                          text={t.text}
                          cx={t.x}
                          cy={t.y}
                          size={t.size}
                          color={textColor}
                          opacity={textOpacity}
                          outline={false}
                          grunge={textGrunge}
                          grungeThickness={textGrungeThickness}
                          uppercase={false}
                          fontFamily={fontCss(t.font)}
                          fontWeight={fontWeight(t.font)}
                          onMove={(x, y) => setText(i, t.id, { x, y })}
                          onResize={(s) => setText(i, t.id, { size: s })}
                          onMeasure={(w) => setLabelWidth(t.id, w)}
                        />
                      ) : null,
                    )}
                  </div>
                  {/* per-clip Ken Burns zoom */}
                  <div className="flex gap-1">
                    {(["off", "in", "out"] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setCompose(i, { zoom: z })}
                        className={`flex-1 rounded-md border py-1 text-[11px] font-medium transition ${
                          c.zoom === z
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {z === "off" ? "Off" : z === "in" ? "In" : "Out"}
                      </button>
                    ))}
                  </div>
                  {/* text boxes — each with its own font */}
                  <div className="space-y-1.5">
                    {c.texts.map((t) => (
                      <div
                        key={t.id}
                        className="space-y-1 rounded-md border p-1.5"
                      >
                        <Input
                          placeholder="Text…"
                          className="h-7 text-xs"
                          value={t.text}
                          onChange={(e) =>
                            setText(i, t.id, { text: e.target.value })
                          }
                        />
                        <div className="flex items-center gap-1">
                          <select
                            value={t.font}
                            onChange={(e) =>
                              setText(i, t.id, {
                                font: e.target.value as FontKey,
                              })
                            }
                            className="h-7 flex-1 rounded-md border border-input bg-background px-1.5 text-xs outline-none"
                          >
                            {FONTS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeText(i, t.id)}
                            title="Remove text"
                            className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addText(i)}
                      className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="size-3.5" /> Add text
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Drag each text to place · corner dot resizes · each text has its own
              font · zoom is per clip · color, opacity &amp; fade apply to all
            </p>
          </div>
        ) : null}

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
            {/* joined final video (Compose mode) */}
            {job.joinedName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
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
                  className="block w-[180px] rounded-lg bg-black"
                />
                <Separator />
              </div>
            ) : null}
            {job.joinError ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Couldn’t join clips ({job.joinError}) — individual clips are below.
              </p>
            ) : null}

            {/* per-clip progress + videos — small players side by side, scroll
                horizontally if many. In frames mode the players are skipped
                (only the cover section below matters). */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {job.clips.map((c) => (
                <div key={c.index} className="w-[180px] shrink-0 space-y-1.5">
                  {c.videoName && !job.joinedName && job.compose ? (
                    <video
                      src={fileUrl(c.videoName)}
                      controls
                      className="w-full rounded-lg bg-black"
                    />
                  ) : null}
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                      {statusIcon(c.status)}
                      <span className="truncate" title={c.label}>
                        {c.label}
                      </span>
                    </span>
                    {c.videoName && job.compose ? (
                      <a
                        href={fileUrl(c.videoName, true)}
                        title="Download"
                        className="shrink-0 text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        <Download className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {c.status === "error" ? (
                    <p className="text-xs text-red-500">{c.message}</p>
                  ) : null}
                </div>
              ))}
            </div>

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
                    <Toggle
                      checked={coverGrunge}
                      onChange={setCoverGrunge}
                      label="Grunge"
                    />
                    <span className="ml-auto text-xs text-muted-foreground">
                      frame {selFrame} / {clipObj.frameCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <input
                      type="color"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5"
                      aria-label="Cover text color"
                    />
                    {COVER_SWATCHES.map((sw) => (
                      <button
                        key={sw.value}
                        type="button"
                        onClick={() => setCoverColor(sw.value)}
                        title={sw.label}
                        aria-label={sw.label}
                        className={`size-6 rounded-full border transition ${
                          coverColor.toLowerCase() === sw.value.toLowerCase()
                            ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background"
                            : "border-border hover:scale-110"
                        }`}
                        style={{ background: sw.value }}
                      />
                    ))}
                  </div>
                  {coverGrunge ? (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Thickness
                      </Label>
                      <Slider
                        min={0}
                        max={18}
                        step={1}
                        value={[coverGrungeThickness]}
                        onValueChange={(v) =>
                          setCoverGrungeThickness(v[0] ?? 0)
                        }
                        className="max-w-[220px]"
                      />
                      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                        {coverGrungeThickness}
                      </span>
                    </div>
                  ) : null}

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
                        color={coverColor}
                        grunge={coverGrunge}
                        grungeThickness={coverGrungeThickness}
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
