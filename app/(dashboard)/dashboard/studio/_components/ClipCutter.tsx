"use client"

import * as React from "react"
import { Loader2, Minus, Pause, Play, Plus, Scissors, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** One marked segment of the source recording. */
export interface CutSegment {
  start: number
  end: number
}

/** Internal segment with a stable id so selection survives sorting/edits. */
interface Seg extends CutSegment {
  id: string
}

/** What the pointer is currently doing on the timeline. */
type DragState =
  | { kind: "draw"; anchor: number; cur: number }
  | { kind: "edge"; id: string; edge: "start" | "end" }
  | { kind: "move"; id: string; anchor: number; origStart: number; len: number; moved: boolean }
  | { kind: "scrub" } // drag the playhead to preview any moment
  | null

const MIN = 0.3 // shortest allowed clip (s) — also the tap-vs-drag threshold
const STEP = 0.1 // nudge / arrow-key step (s)

const fmt = (s: number) => {
  if (!isFinite(s)) return "0:00.0"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const cs = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, "0")}.${cs}`
}
const fmtClock = (s: number) => {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const uid = () => Math.random().toString(36).slice(2, 9)

/** Parse a typed time back to seconds. Accepts "M:SS.s", "H:MM:SS.s", or a
 *  plain number of seconds. Returns null if it isn't a valid time. */
const parseTime = (input: string): number | null => {
  const s = input.trim().replace(",", ".")
  if (!s) return null
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s)
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(s)
  if (!m) return null
  const min = Number(m[2])
  const sec = Number(m[3])
  if (min >= 60 || sec >= 60) return null
  return (m[1] ? Number(m[1]) : 0) * 3600 + min * 60 + sec
}
const frameUrl = (p: string, t: number, h: number) =>
  `/api/studio/frame?path=${encodeURIComponent(p)}&t=${t.toFixed(2)}&h=${h}`
const streamUrl = (p: string) => `/api/studio/stream?path=${encodeURIComponent(p)}`

/** "video" = the browser can decode the original (smooth playback); "frame" =
 *  fall back to on-demand still frames; "probing" = deciding which. */
type Mode = "probing" | "video" | "frame"

/**
 * Cut several clips out of ONE recording — without ever transcoding it. Frames
 * are pulled on demand from /api/studio/frame (fast keyframe seek), so a 40-min
 * multi-GB file opens instantly. Drag across the timeline to draw a clip in a
 * single gesture (the preview scrubs as you drag); tap a clip to select it and
 * fine-tune its edges with the handles, the ±0.1s nudges, or "= playhead".
 * Keyboard: ← → step (shift = 1s). "Use clips" hands the segments back; the
 * studio cuts them from the ORIGINAL full-quality file at render.
 */
export function ClipCutter({
  path,
  duration,
  title,
  onUse,
  onCancel,
}: {
  path: string
  duration: number
  title?: string
  onUse: (segments: CutSegment[]) => void
  onCancel: () => void
}) {
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [time, setTime] = React.useState(0)
  const [segs, setSegs] = React.useState<Seg[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<CutSegment | null>(null)
  // The Start/End field currently being typed (null = not editing).
  const [editing, setEditing] = React.useState<{
    id: string
    edge: "start" | "end"
    text: string
  } | null>(null)
  // The clip pending a delete confirmation (null = dialog closed).
  const [confirmId, setConfirmId] = React.useState<string | null>(null)
  // Measured timeline width → how many filmstrip thumbnails fit (responsive,
  // so they stay readable on a phone and span the full length on a desktop).
  const [trackW, setTrackW] = React.useState(0)
  const [mode, setMode] = React.useState<Mode>("probing")
  const [playing, setPlaying] = React.useState(false)
  const modeRef = React.useRef<Mode>("probing")
  React.useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // Latest-wins frame scrubbing (frame mode only): while one frame loads, only
  // the most recent requested time is kept; shown when the in-flight settles.
  const [bigT, setBigT] = React.useState(0)
  const [loadingFrame, setLoadingFrame] = React.useState(true)
  const loadingRef = React.useRef(false)
  const pendingRef = React.useRef<number | null>(null)

  const dragRef = React.useRef<DragState>(null)
  const durRef = React.useRef(duration)
  React.useEffect(() => {
    durRef.current = duration
  }, [duration])
  const timeRef = React.useRef(0)

  const showFrame = React.useCallback((t: number) => {
    if (loadingRef.current) {
      pendingRef.current = t
      return
    }
    loadingRef.current = true
    setLoadingFrame(true)
    setBigT(t)
  }, [])
  const onFrameSettled = () => {
    loadingRef.current = false
    setLoadingFrame(false)
    if (pendingRef.current != null) {
      const next = pendingRef.current
      pendingRef.current = null
      showFrame(next)
    }
  }

  // Move the playhead. Video mode seeks the real <video> (smooth, native);
  // frame mode requests a still at that time.
  const seek = React.useCallback(
    (t: number) => {
      const c = clamp(t, 0, durRef.current || 0)
      timeRef.current = c
      setTime(c)
      if (modeRef.current === "video") {
        const v = videoRef.current
        if (v) v.currentTime = c
      } else {
        showFrame(c)
      }
    },
    [showFrame],
  )

  const toggle = React.useCallback(() => {
    const v = videoRef.current
    if (!v || modeRef.current !== "video") return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }, [])

  // Decide video-vs-frame: give the browser a few seconds to prove it can
  // decode the original; otherwise fall back to on-demand still frames.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setMode((m) => {
        if (m === "probing") {
          showFrame(timeRef.current)
          return "frame"
        }
        return m
      })
    }, 6000)
    return () => window.clearTimeout(id)
  }, [showFrame])

  const timeFromX = (clientX: number) => {
    const r = trackRef.current
    if (!r) return 0
    const box = r.getBoundingClientRect()
    return ((clientX - box.left) / box.width) * durRef.current
  }

  // First frame (placeholder while probing; the live preview in frame mode).
  React.useEffect(() => {
    showFrame(0)
  }, [showFrame])

  // --- video probe / sync -------------------------------------------------
  const onVideoReady = () => {
    if (modeRef.current !== "probing") return
    const v = videoRef.current
    if (v) v.currentTime = timeRef.current
    setMode("video")
  }
  const onVideoError = () => {
    setMode("frame")
    showFrame(timeRef.current)
  }
  const onVideoTime = () => {
    const v = videoRef.current
    if (!v || modeRef.current !== "video") return
    timeRef.current = v.currentTime
    setTime(v.currentTime)
  }

  // --- keyboard -----------------------------------------------------------
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        seek(timeRef.current - (e.shiftKey ? 1 : STEP))
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        seek(timeRef.current + (e.shiftKey ? 1 : STEP))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [seek])

  // --- measure the timeline so the filmstrip count tracks its width ---------
  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    setTrackW(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setTrackW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // --- drag: draw a new clip, resize a selected clip's edge, or slide the
  //     whole selected clip (keeping its length) -----------------------------
  function beginDrag(state: DragState) {
    dragRef.current = state
    const move = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const t = clamp(timeFromX(ev.clientX), 0, durRef.current)
      if (d.kind === "draw") {
        d.cur = t
        setDraft({ start: Math.min(d.anchor, t), end: Math.max(d.anchor, t) })
        seek(t)
      } else if (d.kind === "edge") {
        setSegs((prev) =>
          prev.map((s) => {
            if (s.id !== d.id) return s
            return d.edge === "start"
              ? { ...s, start: clamp(t, 0, s.end - MIN) }
              : { ...s, end: clamp(t, s.start + MIN, durRef.current) }
          }),
        )
        seek(t)
      } else if (d.kind === "scrub") {
        seek(t) // move the playhead anywhere to preview that moment
      } else {
        // move the whole window: shift both edges by the drag delta, clamped so
        // it stays inside the recording and keeps its length.
        if (Math.abs(t - d.anchor) > 0.03) d.moved = true
        const ns = clamp(
          d.origStart + (t - d.anchor),
          0,
          Math.max(0, durRef.current - d.len),
        )
        setSegs((prev) =>
          prev.map((s) => (s.id === d.id ? { ...s, start: ns, end: ns + d.len } : s)),
        )
        seek(ns)
      }
    }
    const up = () => {
      const d = dragRef.current
      dragRef.current = null
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      if (d?.kind === "draw") {
        const start = Math.min(d.anchor, d.cur)
        const end = Math.max(d.anchor, d.cur)
        setDraft(null)
        if (end - start < MIN) {
          seek(start) // it was a tap → just move the playhead
          return
        }
        const id = uid()
        setSegs((prev) => [...prev, { id, start, end }].sort((a, b) => a.start - b.start))
        setSelectedId(id)
      } else if (d?.kind === "move" && !d.moved) {
        seek(d.origStart) // a tap on the selected clip → jump to its start
      }
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  // --- fine-tune the selected clip ---------------------------------------
  // Set an edge to an absolute time (typed input, "= playhead").
  const editSelected = (edge: "start" | "end", value: number) =>
    setSegs((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s
        return edge === "start"
          ? { ...s, start: clamp(value, 0, s.end - MIN) }
          : { ...s, end: clamp(value, s.start + MIN, durRef.current) }
      }),
    )
  // Nudge an edge by a delta — reads the CURRENT value in the updater so it's
  // correct even right after a typed commit on the same field.
  const nudge = (edge: "start" | "end", delta: number) =>
    setSegs((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s
        return edge === "start"
          ? { ...s, start: clamp(s.start + delta, 0, s.end - MIN) }
          : { ...s, end: clamp(s.end + delta, s.start + MIN, durRef.current) }
      }),
    )
  const commitEdit = () => {
    if (editing) {
      const secs = parseTime(editing.text)
      if (secs != null) editSelected(editing.edge, secs)
    }
    setEditing(null)
  }
  const deleteClip = (id: string) => {
    setSegs((prev) => prev.filter((s) => s.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
    setEditing((cur) => (cur?.id === id ? null : cur))
    setConfirmId(null)
  }

  // A typeable time field + ±0.1s nudges for one edge of a clip (inline in the
  // list row). Editing/nudging act on the selected clip (the row is selected).
  const edgeControl = (s: Seg, edge: "start" | "end") => {
    const isEditing = editing?.id === s.id && editing.edge === edge
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="text"
          value={isEditing ? editing.text : fmt(s[edge])}
          onFocus={() => setEditing({ id: s.id, edge, text: fmt(s[edge]) })}
          onChange={(e) => setEditing({ id: s.id, edge, text: e.target.value })}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitEdit()
              e.currentTarget.blur()
            } else if (e.key === "Escape") {
              setEditing(null)
              e.currentTarget.blur()
            }
          }}
          aria-label={`${edge} time (m:ss.s)`}
          className="w-[4.25rem] rounded-md border bg-background px-1.5 py-1 text-center text-sm font-medium tabular-nums outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => nudge(edge, -STEP)}
          aria-label={`${edge} -0.1s`}
        >
          <Minus className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => nudge(edge, STEP)}
          aria-label={`${edge} +0.1s`}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    )
  }

  const pct = (t: number) => `${duration ? (t / duration) * 100 : 0}%`
  const ordered = [...segs].sort((a, b) => a.start - b.start)
  // One thumbnail per ~52px of timeline (clamped), so the strip stays readable
  // on a phone yet always spans the full recording on a wide screen.
  const stripCount = Math.max(8, Math.min(72, Math.round((trackW || 1040) / 52)))

  // Ruler ticks: pick a "nice" interval so there are ~8 labels, then always
  // include the exact end so the strip's full length is shown.
  const ticks = React.useMemo(() => {
    if (!duration) return [] as number[]
    const steps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]
    const step = steps.find((s) => duration / s <= 8) ?? 3600
    const out: number[] = []
    for (let t = 0; t < duration - step / 2; t += step) out.push(t)
    out.push(duration)
    return out
  }, [duration])
  // Keep edge labels from overflowing the track.
  const tickAlign = (t: number) => {
    const f = duration ? t / duration : 0
    return f < 0.03 ? "translateX(0)" : f > 0.97 ? "translateX(-100%)" : "translateX(-50%)"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Scissors className="size-4 shrink-0 text-emerald-500" />
          <span className="truncate">Cut clips · {title}</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="grid size-7 shrink-0 place-items-center rounded-md border text-muted-foreground hover:bg-muted"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* big preview — the real <video> if the browser can decode it, else a
          still frame pulled on demand at the playhead */}
      <div
        className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-lg bg-black"
        style={{ maxHeight: "44vh" }}
      >
        <video
          ref={videoRef}
          src={streamUrl(path)}
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-contain"
          onClick={toggle}
          onLoadedData={onVideoReady}
          onError={onVideoError}
          onTimeUpdate={onVideoTime}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {mode !== "video" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frameUrl(path, bigT, 640)}
            alt=""
            className="absolute inset-0 size-full object-contain"
            onLoad={onFrameSettled}
            onError={onFrameSettled}
          />
        ) : null}
        {mode === "probing" || (mode === "frame" && loadingFrame) ? (
          <Loader2 className="absolute right-2 top-2 size-4 animate-spin text-white/70" />
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-3">
        {mode === "video" ? (
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
        ) : null}
        <span className="text-xs tabular-nums text-muted-foreground">
          {fmt(time)} / {fmt(duration)}
        </span>
      </div>

      {/* timeline — drag across to draw a clip; tap a clip band to select it.
          Wrapper is NOT clipped so the playhead knob can sit above the strip. */}
      <div className="relative">
      <div
        ref={trackRef}
        className="relative h-24 w-full touch-none select-none overflow-hidden rounded-lg border bg-muted"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const t = clamp(timeFromX(e.clientX), 0, duration)
          setDraft({ start: t, end: t })
          seek(t)
          beginDrag({ kind: "draw", anchor: t, cur: t })
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          {duration
            ? Array.from({ length: stripCount }, (_, i) => (
                // Tiled by explicit left/width so the strip ALWAYS spans the
                // whole recording (an <img>'s intrinsic min-width otherwise
                // overflows a flex row and clips the end off the timeline).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={frameUrl(path, (duration * (i + 0.5)) / stripCount, 96)}
                  alt=""
                  className="absolute top-0 h-full object-cover opacity-60"
                  style={{
                    left: `${(i * 100) / stripCount}%`,
                    width: `${100 / stripCount}%`,
                  }}
                />
              ))
            : null}
        </div>

        {ordered.map((s, i) => {
          const sel = s.id === selectedId
          return (
            <div
              key={s.id}
              onPointerDown={(e) => {
                e.stopPropagation()
                if (sel) {
                  // already selected → grab the body to slide the whole clip
                  beginDrag({
                    kind: "move",
                    id: s.id,
                    anchor: clamp(timeFromX(e.clientX), 0, duration),
                    origStart: s.start,
                    len: s.end - s.start,
                    moved: false,
                  })
                } else {
                  setSelectedId(s.id)
                  seek(s.start)
                }
              }}
              className={`absolute inset-y-0 flex items-center justify-center border-x-2 ${
                sel
                  ? "z-[5] cursor-grab border-emerald-300 bg-emerald-500/40 ring-2 ring-inset ring-emerald-300 active:cursor-grabbing"
                  : "cursor-pointer border-emerald-400/70 bg-emerald-500/25"
              }`}
              style={{ left: pct(s.start), width: pct(s.end - s.start) }}
            >
              <span className="pointer-events-none rounded bg-black/45 px-1 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {sel
                ? (["start", "end"] as const).map((edge) => (
                    <div
                      key={edge}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setSelectedId(s.id)
                        beginDrag({ kind: "edge", id: s.id, edge })
                      }}
                      className="absolute inset-y-0 z-10 w-5 cursor-ew-resize touch-none"
                      style={edge === "start" ? { left: -10 } : { right: -10 }}
                    >
                      <div className="mx-auto h-full w-1.5 rounded bg-emerald-200" />
                    </div>
                  ))
                : null}
            </div>
          )
        })}

        {draft && draft.end > draft.start ? (
          <div
            className="pointer-events-none absolute inset-y-0 border-x-2 border-dashed border-emerald-300 bg-emerald-400/30"
            style={{ left: pct(draft.start), width: pct(draft.end - draft.start) }}
          />
        ) : null}
        </div>

        {/* playhead — sibling of the (clipped) track so its knob floats on top
            of the clip borders. Grab the knob to scrub anywhere, including
            across a clip, without drawing/moving a clip. */}
        <div
          className="absolute inset-y-0 z-30 w-4 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{ left: pct(time) }}
          onPointerDown={() => beginDrag({ kind: "scrub" })}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow" />
        </div>
      </div>

      {/* time ruler — confirms the strip spans the whole recording, shows where
          the playhead sits, and doubles as a scrub bar (drag to move it) */}
      {duration ? (
        <div
          className="relative h-8 w-full touch-none cursor-ew-resize select-none"
          onPointerDown={(e) => {
            seek(clamp(timeFromX(e.clientX), 0, duration))
            beginDrag({ kind: "scrub" })
          }}
        >
          <span
            className="absolute top-0 z-10 whitespace-nowrap text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
            style={{ left: pct(time), transform: tickAlign(time) }}
          >
            ▾ {fmt(time)}
          </span>
          {ticks.map((t, i) => (
            <React.Fragment key={i}>
              <div
                className="absolute top-4 h-1.5 w-px bg-border"
                style={{ left: pct(t), transform: "translateX(-50%)" }}
              />
              <span
                className="absolute top-[22px] whitespace-nowrap text-[10px] tabular-nums text-muted-foreground"
                style={{ left: pct(t), transform: tickAlign(t) }}
              >
                {fmtClock(t)}
              </span>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Drag across the timeline to mark a clip. Tap a clip to select it; drag a
        selected clip to slide it, or its edges to trim. Drag the playhead (or
        the ruler) to preview any moment.
      </p>

      {/* clip list — tap a row to select it, then edit its start/end inline */}
      {ordered.length ? (
        <div className="w-full space-y-1.5 sm:w-1/2">
          {ordered.map((s, i) => {
            const sel = s.id === selectedId
            return (
              <div
                key={s.id}
                className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-md border px-2 py-1.5 text-sm ${
                  sel ? "border-emerald-400 bg-emerald-500/10" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setConfirmId(s.id)}
                  className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-red-500"
                  aria-label={`Delete clip ${i + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                {sel ? (
                  <>
                    {edgeControl(s, "start")}
                    <span className="text-muted-foreground">–</span>
                    {edgeControl(s, "end")}
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      ({fmt(s.end - s.start)})
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id)
                      seek(s.start)
                    }}
                    className="flex-1 text-left tabular-nums hover:underline"
                  >
                    {fmt(s.start)} – {fmt(s.end)}{" "}
                    <span className="text-muted-foreground">({fmt(s.end - s.start)})</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          No clips yet — drag across the timeline to mark your first move.
        </p>
      )}

      <Button
        className="w-full"
        disabled={ordered.length === 0}
        onClick={() => onUse(ordered.map(({ start, end }) => ({ start, end })))}
      >
        Use {ordered.length || ""} clip{ordered.length === 1 ? "" : "s"} →
      </Button>

      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this clip?</DialogTitle>
            <DialogDescription>
              {confirmId
                ? (() => {
                    const idx = ordered.findIndex((s) => s.id === confirmId)
                    const s = ordered[idx]
                    return s
                      ? `Clip ${idx + 1} · ${fmt(s.start)} – ${fmt(s.end)} (${fmt(s.end - s.start)}) will be removed. This can't be undone.`
                      : "This clip will be removed."
                  })()
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmId && deleteClip(confirmId)}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
