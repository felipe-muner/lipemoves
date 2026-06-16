"use client"

import * as React from "react"
import Image from "next/image"
import {
  CheckCircle2,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Play,
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

import {
  BADGE_DEFAULT_SIZE,
  BADGE_DEFAULT_X,
  BADGE_DEFAULT_Y,
  FLYER_DEFAULT_POS,
  type ClipState,
  type CoverPosition,
  type FlyerFragment,
  type FlyerPoint,
  type SerializedJob,
  type StudioConfig,
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
  /** Free-drag center of the enumerate badge (fractions of the frame). */
  badgeX: number
  badgeY: number
  /** Badge font size in cqw (% of preview width); set via the resize handle. */
  badgeSize: number
  /** Badge content; null = the "✅ n/total" default. Clear it to skip the
   *  badge on this clip. */
  badgeText: string | null
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
          ...(outline
            ? {
                paintOrder: "stroke",
                WebkitTextStroke: `${(size * 0.191).toFixed(3)}cqw #000`,
              }
            : {
                WebkitTextStroke: "0",
                textShadow: "0 0.3cqw 1.2cqw rgba(0,0,0,.5)",
              }),
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

/** Free-drag wrapper for a flyer fragment: positions the child by its CENTER
 *  (fractions of the preview box) and reports drags in the same units — the
 *  burn places fragments by the identical center fractions. A corner handle
 *  resizes the piece (scale factor around the center, also honored by the
 *  burn). */
function DragPiece({
  cx,
  cy,
  scale,
  onMove,
  onScale,
  children,
}: {
  cx: number
  cy: number
  scale: number
  onMove: (x: number, y: number) => void
  onScale: (s: number) => void
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className="group absolute cursor-move touch-none select-none rounded transition hover:ring-1 hover:ring-white/60"
      style={{ left: `${cx * 100}%`, top: `${cy * 100}%`, transform: "translate(-50%, -50%)" }}
      onPointerDown={(e) => {
        e.preventDefault()
        const parent = ref.current?.parentElement
        if (!parent) return
        const rect = parent.getBoundingClientRect()
        // Keep the grab offset so the piece doesn't jump to the cursor.
        const dx = cx - (e.clientX - rect.left) / rect.width
        const dy = cy - (e.clientY - rect.top) / rect.height
        const clamp = (n: number) => Math.min(0.98, Math.max(0.02, n))
        const move = (ev: PointerEvent) => {
          onMove(
            clamp((ev.clientX - rect.left) / rect.width + dx),
            clamp((ev.clientY - rect.top) / rect.height + dy),
          )
        }
        const up = () => {
          window.removeEventListener("pointermove", move)
          window.removeEventListener("pointerup", up)
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
      }}
    >
      {children}
      <span
        role="presentation"
        className="absolute -bottom-1.5 -right-1.5 hidden size-3 cursor-nwse-resize rounded-full border border-black/50 bg-white shadow group-hover:block"
        onPointerDown={(e) => {
          // Resize: scale follows the cursor's distance from the piece center.
          e.preventDefault()
          e.stopPropagation()
          const parent = ref.current?.parentElement
          if (!parent) return
          const rect = parent.getBoundingClientRect()
          const cxPx = rect.left + cx * rect.width
          const cyPx = rect.top + cy * rect.height
          const d0 = Math.hypot(e.clientX - cxPx, e.clientY - cyPx) || 1
          const s0 = scale
          const move = (ev: PointerEvent) => {
            const d = Math.hypot(ev.clientX - cxPx, ev.clientY - cyPx)
            onScale(Math.min(3, Math.max(0.2, s0 * (d / d0))))
          }
          const up = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
          }
          window.addEventListener("pointermove", move)
          window.addEventListener("pointerup", up)
        }}
      />
    </div>
  )
}

/** Approximate CSS mock of cover-flyer.sh for the flyer-covers live preview.
 *  The burn is canonical — ImageMagick font metrics won't match CSS to the
 *  pixel — but layout, colors and proportions mirror the script (cqw units
 *  against the same 1280/1080 design widths). Every fragment is draggable;
 *  its center fraction is what the burn uses. */
function FlyerPreview({
  format,
  src,
  aspect,
  bw,
  kicker,
  headline,
  headline2,
  sub,
  pill,
  pos,
  onMove,
  onScale,
}: {
  format: "yt" | "ig"
  src: string
  /** Natural aspect of the source frame (w/h) — sizes the YT subject column. */
  aspect: number
  bw: boolean
  kicker: string
  headline: string
  headline2: string
  sub: string
  pill: string
  pos: Record<FlyerFragment, FlyerPoint>
  onMove: (frag: FlyerFragment, x: number, y: number) => void
  onScale: (frag: FlyerFragment, s: number) => void
}) {
  const sc = (frag: FlyerFragment) => pos[frag].s ?? 1
  const yt = format === "yt"
  const outfit = "var(--font-outfit), system-ui, sans-serif"
  const archivo = '"Archivo Black", system-ui, sans-serif'
  const outline = (em: number) =>
    `${-em}em ${-em}em 0 #000, ${em}em ${-em}em 0 #000, ${-em}em ${em}em 0 #000, ${em}em ${em}em 0 #000`
  // cover-flyer.sh fits the headline to a fixed pixel width; approximate the
  // resulting size from the character count (Archivo Black ≈ 0.62em/char),
  // then apply the fragment's resize factor.
  const headSize = (widthCqw: number, text: string) =>
    `${Math.min(widthCqw / (0.62 * Math.max(text.length, 1)), 28) * sc("head")}cqw`
  const gradLine = (text: string, widthCqw: number) => (
    <span
      className="relative block leading-[1.08]"
      style={{ fontFamily: archivo, fontSize: headSize(widthCqw, text) }}
    >
      <span
        aria-hidden
        className="absolute inset-0 text-black"
        style={{ WebkitTextStroke: "0.14em #000" }}
      >
        {text}
      </span>
      <span
        className="relative"
        style={{
          backgroundImage: "linear-gradient(135deg, #9BFF1A, #4FE000)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {text}
      </span>
    </span>
  )
  const pillEl = pill ? (
    <span
      className="inline-block whitespace-nowrap rounded-full bg-[#5BF11A] font-semibold text-black"
      style={{
        fontFamily: outfit,
        fontSize: `${(yt ? 2.7 : 3.9) * sc("pill")}cqw`,
        padding: "0.45em 1em",
      }}
    >
      {pill}
    </span>
  ) : null
  const brand = (
    <span
      className="font-semibold"
      style={{
        fontFamily: outfit,
        fontSize: `${(yt ? 3.1 : 4.4) * sc("brand")}cqw`,
        letterSpacing: "0.12em",
      }}
    >
      <span className="text-white">LIPE</span>
      <span className="text-[#5BF11A]">MOVES</span>
    </span>
  )
  const kickerEl = kicker ? (
    <span
      className="block whitespace-nowrap text-white"
      style={{
        fontFamily: outfit,
        fontSize: `${(yt ? 3.6 : 5) * sc("kicker")}cqw`,
        letterSpacing: "0.28em",
        textShadow: outline(0.06),
      }}
    >
      {kicker}
    </span>
  ) : null
  const headEl = (
    <span className="block whitespace-nowrap">
      {gradLine(headline, yt ? 59 : 89)}
      {headline2 ? gradLine(headline2, yt ? 47 : 70) : null}
    </span>
  )
  const subEl = sub ? (
    <span
      className="block whitespace-nowrap text-white"
      style={{
        fontFamily: archivo,
        fontSize: `${(yt ? 3 : 3.9) * sc("sub")}cqw`,
        textShadow: outline(0.1),
      }}
    >
      {sub}
    </span>
  ) : null

  const piece = (frag: FlyerFragment, node: React.ReactNode) =>
    node ? (
      <DragPiece
        cx={pos[frag].x}
        cy={pos[frag].y}
        scale={sc(frag)}
        onMove={(x, y) => onMove(frag, x, y)}
        onScale={(s) => onScale(frag, s)}
      >
        {node}
      </DragPiece>
    ) : null

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ containerType: "inline-size" }}>
      {yt ? (
        <>
          <Image
            src={src}
            alt=""
            fill
            unoptimized
            className="object-cover"
            style={{ filter: `blur(4px) brightness(0.6)${bw ? " grayscale(1)" : ""}` }}
          />
          <div className="absolute inset-y-0 right-0" style={{ aspectRatio: String(aspect) }}>
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              className="object-cover"
              style={{ filter: bw ? "grayscale(1) contrast(1.2)" : undefined }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(8,10,8,0.94), rgba(8,10,8,0))" }}
          />
        </>
      ) : (
        <>
          <Image
            src={src}
            alt=""
            fill
            unoptimized
            className="object-cover"
            style={{ filter: bw ? "grayscale(1) contrast(1.2)" : undefined }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[47%]"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.92))" }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[29%]"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))" }}
          />
        </>
      )}
      {piece("brand", brand)}
      {piece("kicker", kickerEl)}
      {piece("head", headEl)}
      {piece("sub", subEl)}
      {piece("pill", pillEl)}
    </div>
  )
}

/** Draggable + resizable enumerate-badge overlay ("✅ 1/5"). Mirrors the
 *  burned badge's look (lib/studio/badge.ts — pill metrics in em so they scale
 *  with the font) so where you drop it in the preview is where it burns. */
function EnumBadge({
  text,
  cx,
  cy,
  size,
  onMove,
  onResize,
}: {
  text: string
  cx: number
  cy: number
  /** Font size in cqw (% of preview width). */
  size: number
  onMove: (x: number, y: number) => void
  onResize: (size: number) => void
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState(false)
  const [hot, setHot] = React.useState(false)
  const rz = React.useRef<{ startDist: number; startSize: number } | null>(null)

  function moveTo(e: React.PointerEvent) {
    const r = rootRef.current!.getBoundingClientRect()
    const x = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width))
    const y = Math.min(0.95, Math.max(0.05, (e.clientY - r.top) / r.height))
    onMove(x, y)
  }

  // Screen-space center of the badge (for the resize math).
  function blockCenter() {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: r.left + cx * r.width, y: r.top + cy * r.height }
  }

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
      <div
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
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-extrabold"
        style={{
          left: `${cx * 100}%`,
          top: `${cy * 100}%`,
          cursor: drag ? "grabbing" : "grab",
          touchAction: "none",
          outline: hot || drag ? "1px dashed rgba(255,255,255,.85)" : "none",
          outlineOffset: "3px",
          padding: "0.306em 0.556em",
          borderRadius: "0.389em",
          background: "rgba(232,232,232,0.62)",
          color: "#161616",
          fontSize: `${size}cqw`,
          lineHeight: 1,
          letterSpacing: "0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {text}

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
            onResize(Math.min(20, Math.max(3, (startSize * dist) / startDist)))
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId)
            rz.current = null
          }}
          className="absolute -bottom-2.5 -right-2.5 block size-4 cursor-nwse-resize rounded-full border-2 border-white bg-emerald-500 shadow"
          style={{ touchAction: "none" }}
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
  // Playable object URLs for the picked clips, so each cell can preview the
  // real video (with its text/badge overlays) before rendering. Revoked when
  // the selection changes or on unmount.
  const [clipUrls, setClipUrls] = React.useState<string[]>([])
  React.useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setClipUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])
  // Which Compose cell is currently showing its video player (null = none).
  const [playClip, setPlayClip] = React.useState<number | null>(null)

  const [mode, setMode] = React.useState<"compose" | "frames">("compose")
  const [join, setJoin] = React.useState(true)
  const [fpStep, setFpStep] = React.useState("0.5")

  // Compose mode: per-clip zoom + text/placement, with a shared text style.
  const [composeCfgs, setComposeCfgs] = React.useState<ComposeCfg[]>([])
  const [textColor, setTextColor] = React.useState("#FFFFFF")
  const [textOpacity, setTextOpacity] = React.useState(1)
  const [textFade, setTextFade] = React.useState(true)
  const [enumerate, setEnumerate] = React.useState(false)
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

  // Flyer covers (separate feature): branded YT+IG pair from the selected
  // frame, rendered by cover-flyer.sh — no free drag, fixed flyer layout.
  const [flyKicker, setFlyKicker] = React.useState("")
  const [flyHeadline, setFlyHeadline] = React.useState("")
  const [flyHeadline2, setFlyHeadline2] = React.useState("")
  const [flySub, setFlySub] = React.useState("")
  const [flyPill, setFlyPill] = React.useState("")
  const [flyBw, setFlyBw] = React.useState(true)
  const [flyBusy, setFlyBusy] = React.useState(false)
  const [flyErr, setFlyErr] = React.useState<string | null>(null)
  /** Job-dir-relative output names + a cache-bust stamp, once generated. */
  const [flyOut, setFlyOut] = React.useState<{ yt: string; ig: string; t: number } | null>(null)
  /** Free-drag fragment centers per format; the burn uses these fractions. */
  const [flyPos, setFlyPos] = React.useState<
    Record<"yt" | "ig", Record<FlyerFragment, FlyerPoint>>
  >(() => structuredClone(FLYER_DEFAULT_POS))
  const moveFly = React.useCallback(
    (fmt: "yt" | "ig") => (frag: FlyerFragment, x: number, y: number) =>
      setFlyPos((prev) => ({
        ...prev,
        [fmt]: { ...prev[fmt], [frag]: { ...prev[fmt][frag], x, y } },
      })),
    [],
  )
  const scaleFly = React.useCallback(
    (fmt: "yt" | "ig") => (frag: FlyerFragment, s: number) =>
      setFlyPos((prev) => ({
        ...prev,
        [fmt]: { ...prev[fmt], [frag]: { ...prev[fmt][frag], s } },
      })),
    [],
  )

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
        badgeX: BADGE_DEFAULT_X,
        badgeY: BADGE_DEFAULT_Y,
        badgeSize: BADGE_DEFAULT_SIZE * 100,
        badgeText: null,
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
    coverColor,
  ])

  // Flyer input changes invalidate the last generated pair.
  React.useEffect(() => {
    setFlyOut(null)
  }, [selClip, selFrame, flyKicker, flyHeadline, flyHeadline2, flySub, flyPill, flyBw, flyPos])

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
      enumerate: mode === "compose" && enumerate,
      framepicker: mode === "frames" ? { step: Number(fpStep) || 0.5 } : null,
      text:
        mode === "compose"
          ? {
              color: textColor,
              opacity: textOpacity,
              fade: textFade,
            }
          : null,
      clips: files.map((_, i) => {
        const c = composeCfgs[i]
        const badgeText = (
          c?.badgeText ?? `✅ ${i + 1}/${files.length}`
        ).trim()
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
          badge:
            mode === "compose" && enumerate && c && badgeText
              ? {
                  text: badgeText,
                  x: c.badgeX,
                  y: c.badgeY,
                  size: c.badgeSize / 100,
                }
              : null,
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

  async function generateFlyer() {
    if (!job || !clipObj || !flyHeadline.trim()) return
    setFlyBusy(true)
    setFlyErr(null)
    try {
      const res = await fetch(`/api/studio/jobs/${job.id}/flyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip: selClip,
          frame: selFrame,
          headline: flyHeadline,
          kicker: flyKicker,
          headline2: flyHeadline2,
          sub: flySub,
          pill: flyPill,
          bw: flyBw,
          pos: flyPos,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Flyer failed")
      const updated = data as SerializedJob
      setJob(updated)
      const c = updated.clips.find((cl) => cl.index === selClip)
      if (!c?.flyerYtName || !c?.flyerIgName) throw new Error("Flyer outputs missing")
      setFlyOut({ yt: c.flyerYtName, ig: c.flyerIgName, t: Date.now() })
    } catch (e) {
      setFlyErr(e instanceof Error ? e.message : "Flyer failed")
    } finally {
      setFlyBusy(false)
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
                checked={enumerate}
                onChange={setEnumerate}
                label={`Enumerate \u2705 1/${files.length || 1}`}
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
            </div>

            {/* one small editor per clip — scroll horizontally if many */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {composeCfgs.map((c, i) => {
                // null = untouched default; cleared text skips this clip's badge.
                const badgeText =
                  c.badgeText ?? `✅ ${i + 1}/${composeCfgs.length}`
                return (
                <div key={i} className="w-[180px] shrink-0 space-y-2">
                  <div
                    className="relative overflow-hidden rounded-lg bg-black"
                    style={{
                      aspectRatio: String(c.aspect),
                      containerType: "inline-size",
                    }}
                  >
                    {playClip === i && clipUrls[i] ? (
                      <video
                        src={clipUrls[i]}
                        autoPlay
                        loop
                        playsInline
                        controls
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : c.poster ? (
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
                    {/* play / stop the real clip in-cell (overlays stay on top
                        so you preview the text & badge over the moving video) */}
                    {clipUrls[i] ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPlayClip((p) => (p === i ? null : i))
                        }
                        title={playClip === i ? "Show frame" : "Play clip"}
                        className="absolute right-1 top-1 z-20 grid size-6 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black/90"
                      >
                        {playClip === i ? (
                          <ImageIcon className="size-3.5" />
                        ) : (
                          <Play className="size-3.5 fill-current" />
                        )}
                      </button>
                    ) : null}
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
                          uppercase={false}
                          fontFamily={fontCss(t.font)}
                          fontWeight={fontWeight(t.font)}
                          onMove={(x, y) => setText(i, t.id, { x, y })}
                          onResize={(s) => setText(i, t.id, { size: s })}
                          onMeasure={(w) => setLabelWidth(t.id, w)}
                        />
                      ) : null,
                    )}
                    {enumerate && badgeText.trim() ? (
                      <EnumBadge
                        text={badgeText}
                        cx={c.badgeX}
                        cy={c.badgeY}
                        size={c.badgeSize}
                        onMove={(x, y) =>
                          setCompose(i, { badgeX: x, badgeY: y })
                        }
                        onResize={(s) => setCompose(i, { badgeSize: s })}
                      />
                    ) : null}
                  </div>
                  {/* rendered output preview for this clip (after Render) */}
                  {(() => {
                    const rendered = job?.clips.find((cl) => cl.index === i)
                    if (rendered?.videoName && job?.compose) {
                      return (
                        <div className="space-y-1">
                          <video
                            src={fileUrl(rendered.videoName)}
                            controls
                            className="w-full rounded-lg bg-black"
                          />
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium">
                              {statusIcon(rendered.status)}
                              <span className="truncate">Rendered preview</span>
                            </span>
                            <a
                              href={fileUrl(rendered.videoName, true)}
                              title="Download clip"
                              className="shrink-0 text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              <Download className="size-3.5" />
                            </a>
                          </div>
                        </div>
                      )
                    }
                    if (rendered?.status === "error") {
                      return (
                        <p className="text-[11px] text-red-500">
                          {rendered.message}
                        </p>
                      )
                    }
                    return null
                  })()}
                  {/* badge content — edit freely (drop the ✅, renumber…);
                      clear it to skip the badge on this clip */}
                  {enumerate ? (
                    <Input
                      placeholder="No badge on this clip"
                      className="h-7 text-xs"
                      value={badgeText}
                      onChange={(e) =>
                        setCompose(i, { badgeText: e.target.value })
                      }
                    />
                  ) : null}
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
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Drag each text to place · corner dot resizes · each text has its own
              font · zoom is per clip · color, opacity &amp; fade apply to all
              {enumerate ? (
                <>
                  {" "}
                  · drag the ✅ badge to place it, corner dot resizes, edit its
                  text below each clip (clear it to skip that clip)
                </>
              ) : null}
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
                (only the cover section below matters). Once a joined final video
                exists, this row is hidden: the Result shows only that final
                version (per-clip previews live in the Compose section above). */}
            {job.compose && job.joinedName ? null : (
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
            )}

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

                {/* ---- Flyer covers (YouTube + Instagram pair) ---- */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="block">Flyer covers — YouTube + Instagram</Label>
                    <button
                      type="button"
                      onClick={() => setFlyPos(structuredClone(FLYER_DEFAULT_POS))}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Reset layout
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Branded flyer layout (B&amp;W photo, lime headline, pill badge)
                    burned onto frame {selFrame} above. YouTube is 1280×720;
                    Instagram is a 1080×1920 Reel cover with all text inside the
                    profile-grid safe area.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Headline — big lime text (required)
                      </Label>
                      <Input
                        placeholder="2 MOVES"
                        value={flyHeadline}
                        onChange={(e) => setFlyHeadline(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Kicker — small line above the headline
                      </Label>
                      <Input
                        placeholder="ONLY"
                        value={flyKicker}
                        onChange={(e) => setFlyKicker(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Headline 2 — optional second lime line
                      </Label>
                      <Input
                        placeholder="30s OFF"
                        value={flyHeadline2}
                        onChange={(e) => setFlyHeadline2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Sub line — white text under the headline
                      </Label>
                      <Input
                        placeholder="SWING SQUAT • FIGURE 8"
                        value={flySub}
                        onChange={(e) => setFlySub(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Pill badge — green rounded tag
                      </Label>
                      <Input
                        placeholder="20 MIN • 30s ON / 30s REST"
                        value={flyPill}
                        onChange={(e) => setFlyPill(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <Toggle checked={flyBw} onChange={setFlyBw} label="B&W photo" />
                    </div>
                  </div>
                  <Button
                    onClick={generateFlyer}
                    disabled={flyBusy || !flyHeadline.trim()}
                    className="w-full"
                  >
                    {flyBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Rendering flyer
                        covers…
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-4" /> Generate YouTube + Instagram
                        covers
                      </>
                    )}
                  </Button>
                  {flyErr ? <p className="text-sm text-red-500">{flyErr}</p> : null}
                  {flyHeadline.trim() || flyOut ? (
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="space-y-1.5">
                        <div
                          className="relative w-[320px] overflow-hidden rounded-lg bg-black"
                          style={{ aspectRatio: "16 / 9" }}
                        >
                          {flyOut ? (
                            <Image
                              src={`${fileUrl(flyOut.yt)}&t=${flyOut.t}`}
                              alt="YouTube flyer cover"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          ) : (
                            <FlyerPreview
                              format="yt"
                              src={fileUrl(`${clipObj.framesPrefix}/frames/${pad3(selFrame)}.png`)}
                              aspect={aspect}
                              bw={flyBw}
                              kicker={flyKicker}
                              headline={flyHeadline}
                              headline2={flyHeadline2}
                              sub={flySub}
                              pill={flyPill}
                              pos={flyPos.yt}
                              onMove={moveFly("yt")}
                              onScale={scaleFly("yt")}
                            />
                          )}
                        </div>
                        {flyOut ? (
                          <a
                            href={`${fileUrl(flyOut.yt, true)}&t=${flyOut.t}`}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            <Download className="size-3.5" /> YouTube (1280×720)
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            YouTube preview — drag the pieces
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div
                          className="relative w-[180px] overflow-hidden rounded-lg bg-black"
                          style={{ aspectRatio: "9 / 16" }}
                        >
                          {flyOut ? (
                            <Image
                              src={`${fileUrl(flyOut.ig)}&t=${flyOut.t}`}
                              alt="Instagram flyer cover"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          ) : (
                            <FlyerPreview
                              format="ig"
                              src={fileUrl(`${clipObj.framesPrefix}/frames/${pad3(selFrame)}.png`)}
                              aspect={aspect}
                              bw={flyBw}
                              kicker={flyKicker}
                              headline={flyHeadline}
                              headline2={flyHeadline2}
                              sub={flySub}
                              pill={flyPill}
                              pos={flyPos.ig}
                              onMove={moveFly("ig")}
                              onScale={scaleFly("ig")}
                            />
                          )}
                          {/* profile-grid safe area (center 3:4) guides */}
                          <div className="pointer-events-none absolute inset-x-0 top-[12.5%] border-t border-dashed border-white/40" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-[12.5%] border-b border-dashed border-white/40" />
                        </div>
                        {flyOut ? (
                          <a
                            href={`${fileUrl(flyOut.ig, true)}&t=${flyOut.t}`}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            <Download className="size-3.5" /> Instagram (1080×1920)
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Instagram preview — drag the pieces (dashes = grid crop)
                          </p>
                        )}
                      </div>
                    </div>
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
