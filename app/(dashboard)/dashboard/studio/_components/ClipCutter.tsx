"use client"

import * as React from "react"
import {
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"

/** A source recording available to cut from. Several can be open at once — each
 *  gets its own filmstrip and they all feed ONE unified clip list. */
export interface CutSource {
  id: string
  path: string
  name: string
  duration: number
  /** Display aspect (w/h) so the preview box + posters match the recording. */
  aspect: number
}

/** One marked segment handed back to the studio: which source + its in/out. */
export interface CutResult {
  sourcePath: string
  start: number
  end: number
  aspect: number
}

/** Internal segment: a stable id + which source it was cut from. */
interface Seg {
  id: string
  sourceId: string
  start: number
  end: number
}

/** What the pointer is doing — always scoped to ONE source's strip. */
type DragState =
  | { kind: "draw"; sourceId: string; anchor: number; cur: number }
  | { kind: "edge"; sourceId: string; id: string; edge: "start" | "end" }
  | {
      kind: "move"
      sourceId: string
      id: string
      anchor: number
      origStart: number
      len: number
      moved: boolean
    }
  | { kind: "scrub"; sourceId: string }
  | null

const MIN = 0.3 // shortest allowed clip (s) — also the tap-vs-drag threshold
const STEP = 0.1 // nudge / arrow-key step (s)
const SCRUB_MAX_SPP = 0.08 // wheel-scrub ceiling (seconds moved per pixel)
const MINBAND = 26 // min px width of a clip band so short clips stay grabbable
const CLIP_DEFAULT = 2 // length (s) of a clip dropped by a single click

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

/** Nice tick interval so a strip shows ~8 labels, always including the end. */
const ticksFor = (duration: number): number[] => {
  if (!duration) return []
  const steps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]
  const step = steps.find((s) => duration / s <= 8) ?? 3600
  const out: number[] = []
  for (let t = 0; t < duration - step / 2; t += step) out.push(t)
  out.push(duration)
  return out
}

/**
 * Cut clips out of ONE OR MORE recordings — without ever transcoding them.
 * Frames are pulled on demand from /api/studio/frame (fast keyframe seek), so
 * even 40-min multi-GB files open instantly. Each source gets its own filmstrip;
 * drag across any strip to draw a clip (the shared preview scrubs as you drag),
 * tap a clip to select + fine-tune its edges. Every cut — from whichever video —
 * lands in ONE clip list, and "Use clips" hands them all back so the studio cuts
 * each from its ORIGINAL full-quality file at render and joins them in sequence.
 */
export function ClipCutter({
  sources,
  onUse,
  onCancel,
}: {
  sources: CutSource[]
  onUse: (clips: CutResult[]) => void
  onCancel: () => void
}) {
  // A ref mirror of `sources` so the stable `seek` callback (and gesture
  // closures) can read the latest list without re-binding. Render code reads the
  // `sources` prop directly via sourceById/orderOf below.
  const sourcesRef = React.useRef(sources)
  React.useEffect(() => {
    sourcesRef.current = sources
  }, [sources])
  const sourceById = (id: string) => sources.find((s) => s.id === id)
  const orderOf = (sid: string) => sources.findIndex((s) => s.id === sid)

  const [segs, setSegs] = React.useState<Seg[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // Which clip band has its edit popover open (tap a band on the strip → popover
  // with the same controls as the clip list row).
  const [popoverId, setPopoverId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<{
    sourceId: string
    start: number
    end: number
  } | null>(null)
  // Playhead position within each source (so every strip remembers its spot).
  const [heads, setHeads] = React.useState<Record<string, number>>({})
  // Which source the big preview currently shows.
  const [activeId, setActiveId] = React.useState<string>(sources[0]?.id ?? "")
  const [editing, setEditing] = React.useState<{
    id: string
    edge: "start" | "end"
    text: string
  } | null>(null)
  const [confirmId, setConfirmId] = React.useState<string | null>(null)
  const [trackW, setTrackW] = React.useState(0)
  // Where the cursor is hovering over a strip → a time tooltip that follows it,
  // so you can line the mouse up to the exact moment you spotted with playback.
  const [hover, setHover] = React.useState<{ sourceId: string; t: number } | null>(null)
  const [suggesting, setSuggesting] = React.useState(false) // AI clip-picking
  const [suggestErr, setSuggestErr] = React.useState<string | null>(null)
  // Live "mark clip" at the playing head: press C (or the Mark button) once to
  // drop the clip's start where it's playing, keep watching, press again to
  // close it. Lets you cut on the fly without dragging the strip precisely.
  const [mark, setMark] = React.useState<{ sourceId: string; start: number } | null>(null)
  const markRef = React.useRef(mark)
  React.useEffect(() => {
    markRef.current = mark
  }, [mark])

  // Keep the active source valid as videos are added/removed.
  React.useEffect(() => {
    if (!sources.some((s) => s.id === activeId) && sources[0]) {
      setActiveId(sources[0].id)
    }
  }, [sources, activeId])

  // Big preview frame — latest-wins so dragging doesn't pile up ffmpeg requests:
  // while one frame loads, only the most recent request is kept.
  const [big, setBig] = React.useState<{ path: string; t: number }>({
    path: sources[0]?.path ?? "",
    t: 0,
  })
  const [loadingFrame, setLoadingFrame] = React.useState(false)
  const loadingRef = React.useRef(false)
  const pendingRef = React.useRef<{ path: string; t: number } | null>(null)
  const showFrame = React.useCallback((path: string, t: number) => {
    if (loadingRef.current) {
      pendingRef.current = { path, t }
      return
    }
    loadingRef.current = true
    setLoadingFrame(true)
    setBig({ path, t })
  }, [])
  const onFrameSettled = () => {
    loadingRef.current = false
    setLoadingFrame(false)
    if (pendingRef.current) {
      const n = pendingRef.current
      pendingRef.current = null
      showFrame(n.path, n.t)
    }
  }

  const dragRef = React.useRef<DragState>(null)
  const tracksRef = React.useRef<Record<string, HTMLDivElement | null>>({})
  const wrapRef = React.useRef<HTMLDivElement | null>(null)

  // Shared <video> for the active source: plays smoothly when the browser can
  // decode it (Mac Safari handles HDR HEVC natively); otherwise we fall back to
  // on-demand still frames (frame mode) and there's nothing to play.
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = React.useState(false) // active source decodes
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false) // preview-only; export keeps audio
  // The clip being loop-played from the list (null = free play). Its live bounds
  // are mirrored in loopRef so the <video> callbacks loop without re-binding.
  const [loopId, setLoopId] = React.useState<string | null>(null)
  const loopRef = React.useRef<{ sourceId: string; start: number; end: number } | null>(null)
  const pendingPlayRef = React.useRef(false) // start playing once the video loads
  const canPlayRef = React.useRef(false)
  const activeIdRef = React.useRef(activeId)
  // Mirror playhead positions so the native wheel listener reads the latest
  // without re-binding on every scrub.
  const headsRef = React.useRef(heads)
  React.useEffect(() => {
    canPlayRef.current = canPlay
  }, [canPlay])
  React.useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])
  React.useEffect(() => {
    headsRef.current = heads
  }, [heads])
  // Preview-only mute, remembered across clips/sessions (export keeps audio).
  React.useEffect(() => {
    setMuted(localStorage.getItem("studioCutMuted") === "1")
  }, [])
  React.useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])
  const toggleMute = () =>
    setMuted((m) => {
      localStorage.setItem("studioCutMuted", m ? "0" : "1")
      return !m
    })
  // Keep loopRef's bounds in sync with the looping clip (so trimming it while it
  // plays updates the loop), and drop the loop if that clip is deleted.
  React.useEffect(() => {
    if (!loopId) {
      loopRef.current = null
      return
    }
    const s = segs.find((x) => x.id === loopId)
    if (s) loopRef.current = { sourceId: s.sourceId, start: s.start, end: s.end }
    else {
      loopRef.current = null
      setLoopId(null)
    }
  }, [loopId, segs])
  // Switching sources reloads the <video>; show frames until it's ready again.
  React.useEffect(() => {
    setCanPlay(false)
    setPlaying(false)
  }, [activeId])

  // Move a source's playhead. If the active video is playable, seek it natively
  // (smooth); otherwise request a still frame at that moment.
  const seek = React.useCallback(
    (sourceId: string, t: number) => {
      const src = sourcesRef.current.find((s) => s.id === sourceId)
      if (!src) return
      // Any manual move breaks a list-clip loop so you can scrub freely.
      if (loopRef.current) {
        loopRef.current = null
        setLoopId(null)
      }
      const c = clamp(t, 0, src.duration || 0)
      const wasActive = sourceId === activeIdRef.current
      setActiveId(sourceId)
      setHeads((h) => ({ ...h, [sourceId]: c }))
      if (wasActive && canPlayRef.current && videoRef.current) {
        videoRef.current.currentTime = c
      } else {
        showFrame(src.path, c)
      }
    },
    [showFrame],
  )

  const toggle = React.useCallback(() => {
    const v = videoRef.current
    if (!v || !canPlayRef.current) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }, [])

  // Drop / close a clip mark at the ACTIVE source's live playhead. The first
  // call sets the clip's start (in point); the next closes it into a clip. Works
  // while the preview is playing, so you can mark a move exactly as you watch it
  // — no precise strip-dragging needed.
  const toggleMark = React.useCallback(() => {
    const sid = activeIdRef.current
    const src = sourcesRef.current.find((s) => s.id === sid)
    if (!src) return
    const t = clamp(headsRef.current[sid] ?? 0, 0, src.duration)
    const m = markRef.current
    if (!m || m.sourceId !== sid) {
      setMark({ sourceId: sid, start: t }) // set the in point here
      return
    }
    const start = Math.min(m.start, t)
    const end = Math.max(m.start, t)
    setMark(null)
    if (end - start < MIN) return // too short to be a clip — just clear the mark
    const id = uid()
    setSegs((prev) => [...prev, { id, sourceId: sid, start, end }])
    setSelectedId(id)
  }, [])
  const cancelMark = React.useCallback(() => setMark(null), [])

  // Play ONE clip from the list, looping within its [start,end] so you can see
  // it repeat (and where it ends). Clicking the one already looping pauses it.
  // Needs a decodable source (video mode); in frame mode it just jumps to start.
  const playClip = (s: Seg) => {
    const v = videoRef.current
    if (loopId === s.id && playing && v) {
      v.pause()
      return
    }
    setSelectedId(s.id)
    loopRef.current = { sourceId: s.sourceId, start: s.start, end: s.end }
    setLoopId(s.id)
    if (s.sourceId === activeIdRef.current && canPlayRef.current && v) {
      v.currentTime = s.start
      void v.play().catch(() => {})
    } else {
      // Switching source: reload the <video>, then onLoadedData starts the loop.
      pendingPlayRef.current = true
      setActiveId(s.sourceId)
      const src = sourceById(s.sourceId)
      if (src) showFrame(src.path, s.start)
    }
  }

  // Ask Gemini for the strongest ~2s moments in the ACTIVE source and drop them
  // into the clip list (you then trim/approve). Analysis runs on a low-res proxy
  // — the real cut still comes from the original full-quality file.
  const suggest = async () => {
    const src = sourceById(activeId) ?? sources[0]
    if (!src || suggesting) return
    setSuggesting(true)
    setSuggestErr(null)
    try {
      const r = await fetch("/api/studio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: src.path, count: 10 }),
      })
      const d = (await r.json()) as { clips?: { start: number; end: number }[]; error?: string }
      if (!r.ok) throw new Error(d.error || "Couldn't suggest clips")
      const fresh = (d.clips ?? [])
        .map((c) => ({
          id: uid(),
          sourceId: src.id,
          start: clamp(c.start, 0, src.duration),
          end: clamp(c.end, 0, src.duration),
        }))
        .filter((c) => c.end - c.start >= MIN)
      if (!fresh.length) {
        setSuggestErr("No strong moments found — try another video.")
        return
      }
      setSegs((prev) => [...prev, ...fresh])
      setSelectedId(fresh[0].id)
    } catch (e) {
      setSuggestErr(e instanceof Error ? e.message : "Couldn't suggest clips")
    } finally {
      setSuggesting(false)
    }
  }

  const timeFromX = (clientX: number, sourceId: string) => {
    const r = tracksRef.current[sourceId]
    const src = sourceById(sourceId)
    if (!r || !src) return 0
    const box = r.getBoundingClientRect()
    return ((clientX - box.left) / box.width) * src.duration
  }

  // Measure the strip width once (all strips share it) → filmstrip thumb count.
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    setTrackW(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setTrackW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Seed the preview for the active source the first time it has no playhead
  // yet — so opening (or first-focusing) a strip shows frame 0, but ADDING
  // another video never yanks the preview off the strip you're working on.
  React.useEffect(() => {
    const src = sources.find((s) => s.id === activeId) ?? sources[0]
    if (src && heads[src.id] == null) showFrame(src.path, 0)
  }, [activeId, sources, heads, showFrame])

  // Guard unsaved cuts against an accidental back-navigation — on a Mac a
  // two-finger trackpad swipe triggers browser Back, which would unmount the
  // cutter and lose every clip. While clips exist, intercept Back with a confirm
  // (re-arming if they stay) and warn on reload/close.
  const hasClips = segs.length > 0
  React.useEffect(() => {
    if (!hasClips) return
    window.history.pushState(null, "", window.location.href)
    const onPop = () => {
      if (
        window.confirm(
          "Leave the cutter? The clips you've marked here will be lost.",
        )
      ) {
        window.removeEventListener("popstate", onPop)
        window.history.back()
      } else {
        window.history.pushState(null, "", window.location.href)
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("popstate", onPop)
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [hasClips])

  // Arrow keys step the ACTIVE source's playhead (shift = 1s).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === " ") {
        e.preventDefault()
        toggle() // play/pause the active source
        return
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault()
        toggleMark() // mark the clip's start, then close it, at the live head
        return
      }
      if (e.key === "Escape" && markRef.current) {
        e.preventDefault()
        cancelMark() // abandon a half-marked clip
        return
      }
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault()
        setConfirmId(selectedId) // same confirm dialog as the trash can
        return
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const cur = heads[activeId] ?? 0
      seek(activeId, cur + (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 1 : STEP))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeId, heads, seek, toggle, toggleMark, cancelMark, selectedId])

  // Wheel / trackpad scrub (QuickTime-style): scrolling over a strip moves its
  // playhead — 1:1 with the strip, so it tracks like dragging. A native,
  // non-passive listener is required so we can preventDefault and stop the
  // horizontal two-finger swipe from triggering browser back/forward.
  React.useEffect(() => {
    const cleanups: Array<() => void> = []
    sources.forEach((source) => {
      const el = tracksRef.current[source.id]
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        const d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (!d) return
        e.preventDefault()
        const box = el.getBoundingClientRect()
        // Cap the rate so a long video (where the strip is ~2s/px) scrubs
        // controllably; short clips stay below the cap and track 1:1.
        const perPx = Math.min(source.duration / (box.width || 1), SCRUB_MAX_SPP)
        seek(source.id, (headsRef.current[source.id] ?? 0) + d * perPx)
      }
      el.addEventListener("wheel", onWheel, { passive: false })
      cleanups.push(() => el.removeEventListener("wheel", onWheel))
    })
    return () => cleanups.forEach((fn) => fn())
  }, [sources, seek])

  // --- drag: draw a new clip, resize an edge, slide a clip, or scrub --------
  function beginDrag(state: DragState) {
    dragRef.current = state
    const move = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const src = sourceById(d.sourceId)
      if (!src) return
      const t = clamp(timeFromX(ev.clientX, d.sourceId), 0, src.duration)
      if (d.kind === "draw") {
        d.cur = t
        setDraft({
          sourceId: d.sourceId,
          start: Math.min(d.anchor, t),
          end: Math.max(d.anchor, t),
        })
        seek(d.sourceId, t)
      } else if (d.kind === "edge") {
        setSegs((prev) =>
          prev.map((s) => {
            if (s.id !== d.id) return s
            return d.edge === "start"
              ? { ...s, start: clamp(t, 0, s.end - MIN) }
              : { ...s, end: clamp(t, s.start + MIN, src.duration) }
          }),
        )
        seek(d.sourceId, t)
      } else if (d.kind === "scrub") {
        seek(d.sourceId, t)
      } else {
        if (Math.abs(t - d.anchor) > 0.03) d.moved = true
        const ns = clamp(
          d.origStart + (t - d.anchor),
          0,
          Math.max(0, src.duration - d.len),
        )
        setSegs((prev) =>
          prev.map((s) => (s.id === d.id ? { ...s, start: ns, end: ns + d.len } : s)),
        )
        seek(d.sourceId, ns)
      }
    }
    const up = () => {
      const d = dragRef.current
      dragRef.current = null
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      if (d?.kind === "draw") {
        let start = Math.min(d.anchor, d.cur)
        let end = Math.max(d.anchor, d.cur)
        setDraft(null)
        if (end - start < MIN) {
          // single click (no drag) → drop a default-length clip starting here,
          // clamped to fit inside the source.
          const dur = sourceById(d.sourceId)?.duration ?? 0
          start = clamp(start, 0, Math.max(0, dur - CLIP_DEFAULT))
          end = Math.min(start + CLIP_DEFAULT, dur)
          if (end - start < MIN) {
            seek(d.sourceId, start) // source too short for a clip → just seek
            return
          }
        }
        const id = uid()
        setSegs((prev) => [...prev, { id, sourceId: d.sourceId, start, end }])
        setSelectedId(id)
        seek(d.sourceId, start)
      } else if (d?.kind === "move" && !d.moved) {
        // a tap on a clip → open its edit popover (same controls as the list)
        setSelectedId(d.id)
        setPopoverId(d.id)
        seek(d.sourceId, segs.find((x) => x.id === d.id)?.start ?? 0)
      }
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  // --- fine-tune the selected clip ---------------------------------------
  const editSelected = (edge: "start" | "end", value: number) =>
    setSegs((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s
        const dur = sourceById(s.sourceId)?.duration ?? s.end
        return edge === "start"
          ? { ...s, start: clamp(value, 0, s.end - MIN) }
          : { ...s, end: clamp(value, s.start + MIN, dur) }
      }),
    )
  const nudge = (edge: "start" | "end", delta: number) =>
    setSegs((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s
        const dur = sourceById(s.sourceId)?.duration ?? s.end
        return edge === "start"
          ? { ...s, start: clamp(s.start + delta, 0, s.end - MIN) }
          : { ...s, end: clamp(s.end + delta, s.start + MIN, dur) }
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

  // A typeable time field + ±0.1s nudges for one edge of the selected clip.
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

  // The controls for ONE clip — shared by the clip list row and the per-band
  // popover so both have identical features (delete · loop-play · name · trim).
  // `forceEdit` always shows the typeable edge fields (the popover wants them);
  // in the list they only appear once the clip is selected.
  const clipControls = (s: Seg, i: number, forceEdit: boolean) => {
    const sel = s.id === selectedId
    const src = sourceById(s.sourceId)
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirmId(s.id)}
          className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-red-500"
          aria-label={`Delete clip ${i + 1}`}
        >
          <Trash2 className="size-3.5" />
        </button>
        {/* the number loop-plays this cut in the main player above */}
        <button
          type="button"
          onClick={() => playClip(s)}
          className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
            loopId === s.id && playing
              ? "bg-emerald-500 text-white"
              : "bg-muted hover:bg-emerald-500/30"
          }`}
          aria-label={`Loop-play clip ${i + 1} in the main player`}
          title="Loop-play this cut in the player above"
        >
          {i + 1}
        </button>
        <span
          className="max-w-[9rem] shrink-0 truncate text-xs text-muted-foreground"
          title={src?.name}
        >
          {src?.name}
        </span>
        {forceEdit || sel ? (
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
              seek(s.sourceId, s.start)
            }}
            className="flex-1 text-left tabular-nums hover:underline"
          >
            {fmt(s.start)} – {fmt(s.end)}{" "}
            <span className="text-muted-foreground">({fmt(s.end - s.start)})</span>
          </button>
        )}
      </>
    )
  }

  const stripCount = Math.max(8, Math.min(72, Math.round((trackW || 1040) / 52)))
  // Clips in render order: by the order their source was added, then by start.
  const ordered = [...segs].sort(
    (a, b) => orderOf(a.sourceId) - orderOf(b.sourceId) || a.start - b.start,
  )
  const activeSource = sourceById(activeId) ?? sources[0]
  const activeHead = heads[activeId] ?? 0

  const pct = (t: number, dur: number) => `${dur ? (t / dur) * 100 : 0}%`
  const tickAlign = (t: number, dur: number) => {
    const f = dur ? t / dur : 0
    return f < 0.03 ? "translateX(0)" : f > 0.97 ? "translateX(-100%)" : "translateX(-50%)"
  }

  // One source's filmstrip + ruler + clips. Drawing/scrubbing is scoped to it.
  const renderStrip = (source: CutSource) => {
    const dur = source.duration
    const segsHere = segs.filter((s) => s.sourceId === source.id)
    const head = heads[source.id]
    const isActive = source.id === activeId
    return (
      <div key={source.id} className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block size-2 shrink-0 rounded-full ${
              isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
          <span className="min-w-0 flex-1 truncate font-medium">{source.name}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {fmt(dur)}
          </span>
        </div>

        <div className="relative">
          <div
            ref={(el) => {
              tracksRef.current[source.id] = el
            }}
            className="relative h-20 w-full touch-none select-none overflow-hidden rounded-lg border bg-muted"
            onPointerDown={(e) => {
              if (e.button !== 0) return
              const t = clamp(timeFromX(e.clientX, source.id), 0, dur)
              setDraft({ sourceId: source.id, start: t, end: t })
              seek(source.id, t)
              beginDrag({ kind: "draw", sourceId: source.id, anchor: t, cur: t })
            }}
            onPointerMove={(e) => {
              // While dragging, the draft/playhead already show the time — don't
              // double up with the hover tooltip.
              if (dragRef.current) return
              setHover({
                sourceId: source.id,
                t: clamp(timeFromX(e.clientX, source.id), 0, dur),
              })
            }}
          >
            <div className="pointer-events-none absolute inset-0">
              {dur
                ? Array.from({ length: stripCount }, (_, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={frameUrl(source.path, (dur * (i + 0.5)) / stripCount, 96)}
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

            {segsHere.map((s) => {
              const sel = s.id === selectedId
              // Draw the band with a MINIMUM width so a short clip on a long
              // video is still a grabbable pill (a 6s clip on a 64-min strip is
              // ~2px otherwise). Edge-drag still maps the POINTER to real time,
              // so trimming stays accurate even though the pill is widened.
              const W = trackW || 1
              const realLeft = dur ? s.start / dur : 0
              const realW = dur ? (s.end - s.start) / dur : 0
              const wPx = Math.max(realW * W, MINBAND)
              const leftPx = Math.max(
                0,
                Math.min((realLeft + realW / 2) * W - wPx / 2, W - wPx),
              )
              const idx = ordered.findIndex((o) => o.id === s.id)
              return (
                <Popover
                  key={s.id}
                  open={popoverId === s.id}
                  onOpenChange={(o) => !o && setPopoverId(null)}
                >
                  <PopoverAnchor asChild>
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setSelectedId(s.id)
                    // Tap = open edit popover; drag = slide it (handled in up).
                    beginDrag({
                      kind: "move",
                      sourceId: source.id,
                      id: s.id,
                      anchor: clamp(timeFromX(e.clientX, source.id), 0, dur),
                      origStart: s.start,
                      len: s.end - s.start,
                      moved: false,
                    })
                  }}
                  className={`absolute inset-y-0 flex items-center justify-center rounded-sm border-x-2 ${
                    sel
                      ? "z-[6] cursor-grab border-emerald-300 bg-emerald-500/45 ring-2 ring-inset ring-emerald-300 active:cursor-grabbing"
                      : "z-[5] cursor-pointer border-emerald-400/80 bg-emerald-500/30"
                  }`}
                  style={{ left: leftPx, width: wPx }}
                  title="Tap to edit · drag edges to trim before/after · drag to move"
                >
                  <span className="pointer-events-none grid size-5 place-items-center rounded-full bg-black/45 text-white">
                    {loopId === s.id && playing ? (
                      <Pause className="size-3" />
                    ) : (
                      <Play className="size-3" />
                    )}
                  </span>
                  {/* trim handles — ALWAYS available (no select-first needed) */}
                  {(["start", "end"] as const).map((edge) => (
                    <div
                      key={edge}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setSelectedId(s.id)
                        beginDrag({ kind: "edge", sourceId: source.id, id: s.id, edge })
                      }}
                      className="absolute inset-y-0 z-10 w-4 cursor-ew-resize touch-none"
                      style={edge === "start" ? { left: -8 } : { right: -8 }}
                    >
                      <div className="mx-auto h-full w-1.5 rounded bg-emerald-200" />
                    </div>
                  ))}
                </div>
                  </PopoverAnchor>
                  <PopoverContent
                    side="top"
                    align="center"
                    className="w-auto max-w-[20rem] p-2"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    // Radix portals this to <body>, but React synthetic events
                    // still bubble up the React tree to the strip's onPointerDown
                    // — which would draw a NEW clip. Stop them at the popover.
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
                      {clipControls(s, idx, true)}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}

            {draft && draft.sourceId === source.id && draft.end > draft.start ? (
              <div
                className="pointer-events-none absolute inset-y-0 border-x-2 border-dashed border-emerald-300 bg-emerald-400/30"
                style={{
                  left: pct(draft.start, dur),
                  width: pct(draft.end - draft.start, dur),
                }}
              />
            ) : null}

            {/* live mark band — grows from the in point to the playing head as
                you watch, so you see the clip forming. Press C again to close it. */}
            {mark && mark.sourceId === source.id ? (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 z-[4] animate-pulse bg-emerald-400/25"
                  style={{
                    left: pct(Math.min(mark.start, head ?? mark.start), dur),
                    width: pct(Math.abs((head ?? mark.start) - mark.start), dur),
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 z-[4] w-0.5 -translate-x-1/2 bg-emerald-400 shadow-[0_0_3px_rgba(0,0,0,0.7)]"
                  style={{ left: pct(mark.start, dur) }}
                />
              </>
            ) : null}
          </div>

          {head != null ? (
            // Pointer-events-none so the bar/line never block clicks on the strip
            // behind it — only the green circle below is grabbable to drag.
            <div
              className="pointer-events-none absolute inset-y-0 z-30 w-4 -translate-x-1/2 touch-none"
              style={{ left: pct(head, dur) }}
            >
              <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
              {/* only handle: grab the green circle to scrub the playhead */}
              <div
                className="pointer-events-auto absolute left-1/2 top-0 size-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-emerald-500 shadow"
                onPointerDown={() => beginDrag({ kind: "scrub", sourceId: source.id })}
              />
              {/* the playhead's current time, pinned to the bottom of the strip */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white shadow">
                {fmt(head)}
              </div>
            </div>
          ) : null}

          {/* hover tooltip — the time under the cursor, so you can park the mouse
              on the exact instant you spotted while playing, then cut there */}
          {hover && hover.sourceId === source.id ? (
            <div
              className="pointer-events-none absolute inset-y-0 z-40"
              style={{ left: pct(hover.t, dur) }}
            >
              <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/60" />
              <div className="absolute top-1 left-0 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white shadow">
                {fmt(hover.t)}
              </div>
            </div>
          ) : null}
        </div>

        {dur ? (
          <div
            className="relative h-7 w-full touch-none cursor-ew-resize select-none"
            onPointerDown={(e) => {
              seek(source.id, clamp(timeFromX(e.clientX, source.id), 0, dur))
              beginDrag({ kind: "scrub", sourceId: source.id })
            }}
          >
            {ticksFor(dur).map((t, i) => (
              <React.Fragment key={i}>
                <div
                  className="absolute top-3 h-1.5 w-px bg-border"
                  style={{ left: pct(t, dur), transform: "translateX(-50%)" }}
                />
                <span
                  className="absolute top-[18px] whitespace-nowrap text-[10px] tabular-nums text-muted-foreground"
                  style={{ left: pct(t, dur), transform: tickAlign(t, dur) }}
                >
                  {fmtClock(t)}
                </span>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Scissors className="size-4 shrink-0 text-emerald-500" />
          <span className="truncate">
            Cut clips · {sources.length} video{sources.length === 1 ? "" : "s"}
          </span>
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

      {/* shared preview — a still frame pulled on demand at the active playhead */}
      {activeSource ? (
        <div
          className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-lg bg-black"
          style={{ aspectRatio: activeSource.aspect || 9 / 16, maxHeight: "40vh" }}
        >
          {/* Still-frame preview (always there; the live video covers it when
              the browser can decode the active source). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frameUrl(big.path, big.t, 640)}
            alt=""
            className="absolute inset-0 size-full object-contain"
            onLoad={onFrameSettled}
            onError={onFrameSettled}
          />
          {/* Live player for the active source — smooth playback when decodable
              (Mac Safari decodes HDR HEVC natively). Hidden in frame mode. */}
          <video
            ref={videoRef}
            src={streamUrl(activeSource.path)}
            playsInline
            preload="metadata"
            muted={muted}
            className={`absolute inset-0 size-full object-contain ${
              canPlay ? "" : "pointer-events-none opacity-0"
            }`}
            onClick={toggle}
            onLoadedData={() => {
              setCanPlay(true)
              const v = videoRef.current
              if (!v) return
              const lp = loopRef.current
              if (pendingPlayRef.current && lp && lp.sourceId === activeId) {
                pendingPlayRef.current = false
                v.currentTime = lp.start
                void v.play().catch(() => {})
              } else {
                v.currentTime = heads[activeId] ?? 0
              }
            }}
            onError={() => setCanPlay(false)}
            onTimeUpdate={() => {
              const v = videoRef.current
              if (!v) return
              const lp = loopRef.current
              if (lp && lp.sourceId === activeId && v.currentTime >= lp.end - 0.02) {
                v.currentTime = lp.start // loop back to the clip's start
                return
              }
              setHeads((h) => ({ ...h, [activeId]: v.currentTime }))
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {!canPlay && loadingFrame ? (
            <Loader2 className="absolute right-2 top-2 size-4 animate-spin text-white/70" />
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-3">
        {canPlay ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              title={muted ? "Unmute preview" : "Mute preview (export keeps audio)"}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
          </>
        ) : null}
        {activeSource ? (
          <Button
            size="sm"
            variant={mark && mark.sourceId === activeId ? "default" : "outline"}
            onClick={toggleMark}
            className={
              mark && mark.sourceId === activeId
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
            aria-label={
              mark && mark.sourceId === activeId ? "Mark clip end" : "Mark clip start"
            }
            title="C — drop the clip start at the playhead, then press again to end it (keep watching in between)"
          >
            <Scissors className="size-4" />
            {mark && mark.sourceId === activeId
              ? `End clip (${fmt(Math.abs(activeHead - mark.start))})`
              : "Mark clip"}
          </Button>
        ) : null}
        <span className="text-xs tabular-nums text-muted-foreground">
          {activeSource ? (
            <>
              {fmt(activeHead)} / {fmt(activeSource.duration)} · {activeSource.name}
            </>
          ) : null}
        </span>
      </div>

      {/* one filmstrip per source, stacked */}
      <div ref={wrapRef} className="space-y-4">
        {sources.map((s) => renderStrip(s))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1 font-mono text-[10px]">space</kbd>{" "}
        to play, then{" "}
        <kbd className="rounded border px-1 font-mono text-[10px]">C</kbd> to mark
        the clip&apos;s start and{" "}
        <kbd className="rounded border px-1 font-mono text-[10px]">C</kbd> again to
        end it — cut on the fly while you watch. Or drag across any strip to mark a
        clip by hand. Tap a clip band to loop-play it, drag its edges to trim, or
        drag the band to move it. Scroll over a strip to scrub; Backspace deletes
        the selected clip.
      </p>

      {/* AI clip-picking — Gemini finds the strongest ~2s moments */}
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={suggesting || !activeSource}
          onClick={suggest}
        >
          {suggesting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4 text-emerald-500" />
          )}
          {suggesting
            ? "Finding the best moments…"
            : `Suggest clips from ${activeSource?.name ?? "video"}`}
        </Button>
        {suggestErr ? (
          <p className="text-center text-xs text-amber-600 dark:text-amber-400">
            {suggestErr}
          </p>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            AI scans this video for scroll-stopping moments and adds them below.
          </p>
        )}
      </div>

      {/* unified clip list across ALL sources */}
      {ordered.length ? (
        <div className="w-full space-y-1.5">
          {ordered.map((s, i) => {
            const sel = s.id === selectedId
            return (
              <div
                key={s.id}
                className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-md border px-2 py-1.5 text-sm ${
                  sel ? "border-emerald-400 bg-emerald-500/10" : ""
                }`}
              >
                {clipControls(s, i, false)}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          No clips yet — drag across a strip to mark your first move.
        </p>
      )}

      <div className="flex justify-start">
        <Button
          size="sm"
          disabled={ordered.length === 0}
          onClick={() =>
            onUse(
              ordered.flatMap((s) => {
                const src = sourceById(s.sourceId)
                return src
                  ? [{ sourcePath: src.path, start: s.start, end: s.end, aspect: src.aspect }]
                  : []
              }),
            )
          }
        >
          Use {ordered.length || ""} clip{ordered.length === 1 ? "" : "s"} →
        </Button>
      </div>

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
