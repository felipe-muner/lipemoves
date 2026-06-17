"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Hls from "hls.js"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Pause, Play, RotateCcw, Volume2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Status = "idle" | "running" | "paused" | "done"

/** One minute of a dated workout: a named exercise, its looping demo clip, and
 *  how many of the 60s are work (rest = 60 − work). */
interface DayBlock {
  name: string
  /** Signed Bunny HLS playlist URL for the muted, looping demo (from the
   *  /api/timer/day route; the stored manifest holds the video GUID). */
  video: string
  /** Signed poster (thumbnail) URL, shown before play. */
  poster?: string
  /** Work seconds in this minute (1..59); rest fills the rest of the minute. */
  work: number
}

/** A curated workout for one date, loaded from /timer-days/<date>.json. The
 *  blocks play one-per-minute; `rounds` repeats the whole list. */
interface DayFile {
  date: string
  title?: string
  rounds?: number
  blocks: DayBlock[]
}

/**
 * Cue motifs — messenger-style mallet chimes (MSN/ICQ vibe, synthesized; the
 * original samples are copyrighted). Felipe wants the GO cue clearly audible
 * across the room mid-set, so its last note rings out for ~a second instead
 * of the usual short blip.
 */
const GO_NOTES = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6 — rising "go!"
const REST_NOTES = [659.25, 523.25] // E5 C5 — falling "wind down"
const END_NOTES = [523.25, 783.99, 1046.5, 1318.5] // C5 G5 C6 E6 — "ta-da!"

const MIN_MINUTES = 1
const MAX_MINUTES = 60
const MIN_EXERCISES = 1
const MAX_EXERCISES = 10
// Work/rest split inside each minute (work + rest = 60s, e.g. 30/30, 40/20).
const MIN_WORK_SEC = 5
const MAX_WORK_SEC = 55

/** Day-mode layout presets. The same three blocks — ring, demo video, move
 *  list — are rearranged, and each piece of info has exactly ONE home so
 *  nothing repeats across the screen:
 *   - ring "full"   → clock + GO/REST + move N/total + %
 *     ring "numbers"→ clock + move N/total + %   (no phase word)
 *     ring "clock"  → clock only (phase/name live on the video)
 *   - video "none"  → just the clip (name lives in the list)
 *     video "name"  → clip + current/next move name
 *     video "full"  → clip + name + GO/REST chip   (ring drops the phase)
 *   - names → the full move list (with progress), or hidden
 *   - next  → a compact "next up" line when the list is hidden */
type RingMeta = "full" | "numbers" | "clock"
type VideoOverlay = "none" | "name" | "full"
interface DayLayout {
  label: string
  /** Stack vertically even on desktop (otherwise a row). */
  col: boolean
  ring: RingMeta
  ringOrder: number
  video: VideoOverlay
  videoOrder: number
  videoW: string
  names: boolean
  namesOrder: number
  /** Overlay mode: video is the hero, the timer sits ON it and shrinks from
   *  center → a corner on Start (with a wind whoosh). `dock` is its resting
   *  corner. The ring/video/names fields above are ignored when overlay. */
  overlay?: boolean
  dock?: "tr" | "tl" | "br"
}
const DAY_LAYOUTS: DayLayout[] = [
  // Overlay focus — big video, the timer flies center→corner on Start (the
  // chosen default; other arrangements were trialled and dropped).
  { label: "Overlay · top-right", col: false, ring: "full", ringOrder: 1, video: "none", videoOrder: 2, videoW: "max-w-[400px]", names: false, namesOrder: 3, overlay: true, dock: "tr" },
]

/** A clock segment (minutes or seconds) that rolls on change: the outgoing
 *  glyph slides up and fades while the new one rises into its place. Each
 *  character animates independently inside its own fixed, clipped box, so only
 *  the digits that actually change move. An invisible spacer reserves the
 *  glyph's box and the moving copy is absolutely positioned on top — so the
 *  animation is pure transform + opacity (GPU-composited, no layout
 *  measurement). This avoids framer's `popLayout` projection, which re-measures
 *  layout every tick and stutters on mobile Safari. Falls back to a plain
 *  crossfade when the user prefers reduced motion. */
function TickDigit({ value, reduce }: { value: string; reduce: boolean }) {
  return (
    <span className="inline-block tabular-nums">
      {value.split("").map((char, i) => (
        <span
          // index key: positions are stable for a fixed-width segment; only the
          // glyph inside swaps, which is what we want to animate.
          key={i}
          className="relative inline-block overflow-hidden align-baseline"
        >
          <span className="invisible" aria-hidden>
            {char}
          </span>
          <AnimatePresence initial={false}>
            <motion.span
              key={char}
              className="absolute inset-0 inline-block will-change-transform"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: "0.6em" }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-0.6em" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

export function TimerClient() {
  const [minutes, setMinutes] = useState(30)
  const [workSec, setWorkSec] = useState(30) // rest is always 60 − work
  const [exercises, setExercises] = useState(3)
  const [exerciseNames, setExerciseNames] = useState<string[]>(["", "", ""])
  const [status, setStatus] = useState<Status>("idle")
  const [elapsed, setElapsed] = useState(0) // seconds, fractional
  // Dated-workout mode: when ?date=YYYY-MM-DD loads a day-file, the timer is
  // driven by its blocks (per-minute exercise + demo video + work split) and
  // the manual setup is hidden.
  const [day, setDay] = useState<DayFile | null>(null)
  const dayLayout = 0 // single overlay layout (selector removed)
  // Overlay start sequence: 3-2-1 countdown, then a psychedelic "flight" of the
  // dial to its corner.
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flying, setFlying] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  // Latest layout, readable from the (non-reactive) start() handler.
  const layRef = useRef<DayLayout | null>(null)
  // Edge fades on the dots scroller — visual hint that more dots exist
  // beyond the visible strip, on whichever side is clipped.
  const [dotsFade, setDotsFade] = useState({ left: false, right: false })

  const startRef = useRef(0) // performance.now() baseline
  const lastMinuteRef = useRef(-1) // highest minute index already beeped
  const lastRestRef = useRef(-1) // highest minute index already rest-cued
  const audioRef = useRef<AudioContext | null>(null)
  const dotsRef = useRef<HTMLDivElement | null>(null)

  const totalSec = minutes * 60
  const remaining = Math.max(0, totalSec - elapsed)
  const completedMinutes = Math.min(minutes, Math.floor(elapsed / 60))

  // --- preset links --------------------------------------------------------
  // /timer?min=20&work=40&names=Swing%20Squat,Figure%208 pre-fills the setup
  // so Felipe can send members a ready-to-start session. Read from
  // window.location after mount (not useSearchParams) so the page stays
  // static and hydration renders the plain defaults first. Values are
  // clamped to the same limits as the UI; missing or invalid ones are
  // ignored. When `names` is present the exercise count comes from the list,
  // so `ex` is only needed for unnamed slots.

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v))
    const num = (key: string) => {
      const raw = params.get(key)
      if (raw === null) return null
      const parsed = parseInt(raw, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

    // Dated workout: /timer?date=2026-06-17 loads a curated day-file and
    // takes over the setup. Falls back silently to the manual timer if the
    // date is malformed or the file is missing.
    const date = params.get("date")
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      fetch(`/api/timer/day?date=${date}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: DayFile | null) => {
          if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0)
            return
          const blocks = data.blocks
            .slice(0, MAX_EXERCISES)
            .map((b) => ({
              name: typeof b.name === "string" ? b.name : "",
              video: typeof b.video === "string" ? b.video : "",
              poster: typeof b.poster === "string" ? b.poster : undefined,
              work: clamp(Number(b.work) || 30, MIN_WORK_SEC, MAX_WORK_SEC),
            }))
          const rounds = clamp(Number(data.rounds) || 1, 1, 20)
          const total = clamp(blocks.length * rounds, MIN_MINUTES, MAX_MINUTES)
          setDay({ ...data, blocks, rounds })
          setMinutes(total)
          setExercises(blocks.length)
          setExerciseNames(blocks.map((b) => b.name))
        })
        .catch(() => {
          /* network/JSON error — keep the manual timer */
        })
      return // a dated workout ignores the manual min/work/names params
    }

    const min = num("min")
    if (min !== null) setMinutes(clamp(min, MIN_MINUTES, MAX_MINUTES))

    const work = num("work")
    if (work !== null) setWorkSec(clamp(work, MIN_WORK_SEC, MAX_WORK_SEC))

    const names = (params.get("names") ?? "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, MAX_EXERCISES)
    const ex = num("ex")
    const count =
      names.length > 0
        ? names.length
        : ex !== null
          ? clamp(ex, MIN_EXERCISES, MAX_EXERCISES)
          : null
    if (count !== null) {
      setExercises(count)
      setExerciseNames(Array.from({ length: count }, (_, i) => names[i] ?? ""))
    }
  }, [])

  // Day mode + its per-minute blocks flattened across rounds (length =
  // minutes). Minute i (0-based) shows dayBlocks[i].
  const dayMode = day !== null
  const dayBlocks = useMemo<DayBlock[]>(() => {
    if (!day) return []
    const rounds = day.rounds ?? 1
    const out: DayBlock[] = []
    for (let r = 0; r < rounds; r++) out.push(...day.blocks)
    return out
  }, [day])

  /** Work seconds for a given minute (0-based) — per-block in day mode, the
   *  shared workSec otherwise. */
  const workForMinute = useCallback(
    (m: number) =>
      dayBlocks.length
        ? (dayBlocks[Math.min(dayBlocks.length - 1, m)]?.work ?? workSec)
        : workSec,
    [dayBlocks, workSec],
  )

  // --- audio -------------------------------------------------------------

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      // iOS: "playback" is the only session type that ignores the Ring/Silent
      // switch (and the Action Button mute toggle on 15 Pro+/17 Pro), so the
      // timer still beeps with the phone on silent — exactly when you need it
      // mid-workout. Cost vs. "transient": it pauses background music/podcasts
      // instead of just ducking them. Worth it for an audible workout cue.
      const nav = navigator as Navigator & { audioSession?: { type: string } }
      if (nav.audioSession) nav.audioSession.type = "playback"
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      audioRef.current = new Ctx()
    }
    if (audioRef.current.state !== "running") {
      void audioRef.current.resume()
    }
    return audioRef.current
  }, [])

  /** Schedule one percussive "mallet" note — the rounded marimba-ish timbre
   *  of the old messenger chimes: fundamental + a quiet bright partial, sharp
   *  click-free attack, exponential ring-out. If another app (music, a call)
   *  suspended our context, resume it first — otherwise the note would be
   *  scheduled into a stopped clock and never heard. */
  const mallet = useCallback(
    (ctx: AudioContext, freq: number, atOffset = 0, ringMs = 450, peak = 0.8) => {
      const play = () => {
        const t0 = ctx.currentTime + atOffset
        const dur = ringMs / 1000
        const out = ctx.createGain()
        out.gain.setValueAtTime(0, t0)
        out.gain.linearRampToValueAtTime(peak, t0 + 0.012)
        out.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
        out.connect(ctx.destination)
        // [harmonic multiple, relative level] — the 4x partial is the woody
        // "tick" that makes it read as a mallet hit instead of a sine beep.
        const partials: Array<[number, number]> = [
          [1, 1],
          [4, 0.18],
        ]
        for (const [mult, amt] of partials) {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = "sine"
          osc.frequency.value = freq * mult
          g.gain.value = amt
          osc.connect(g).connect(out)
          osc.start(t0)
          osc.stop(t0 + dur)
        }
      }
      if (ctx.state === "running") {
        play()
      } else {
        ctx.resume().then(play).catch(() => {})
      }
    },
    [],
  )

  /** Vibration backup (Android) — phones in a pocket still feel the cue. */
  const buzz = useCallback((pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern)
  }, [])

  /** Rising messenger arpeggio; the final note rings long ("GO!"). */
  const beepMinute = useCallback(() => {
    const ctx = ensureAudio()
    GO_NOTES.forEach((f, i) =>
      mallet(ctx, f, i * 0.09, i === GO_NOTES.length - 1 ? 950 : 350),
    )
    buzz(400)
  }, [ensureAudio, mallet, buzz])

  const beepEnd = useCallback(() => {
    const ctx = ensureAudio()
    // "ta-da!" — the GO arpeggio stretched, last note rings out extra long
    END_NOTES.forEach((f, i) =>
      mallet(ctx, f, i * 0.14, i === END_NOTES.length - 1 ? 1500 : 420),
    )
    buzz([300, 150, 300, 150, 700])
  }, [ensureAudio, mallet, buzz])

  /** A short wind whoosh — filtered noise that swells then fades. Played the
   *  moment the overlay timer animates from center to its corner on Start. */
  const whoosh = useCallback(() => {
    const ctx = ensureAudio()
    const dur = 2.5 // spans the full 3-2-1 flight to the corner
    const t0 = ctx.currentTime
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    // Two band-passes sweeping in opposite directions = a fuller rushing wind.
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.5)
    g.gain.setValueAtTime(0.4, t0 + dur - 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    g.connect(ctx.destination)
    const sweep = (from: number, to: number, q: number) => {
      const src = ctx.createBufferSource()
      src.buffer = noise
      const bp = ctx.createBiquadFilter()
      bp.type = "bandpass"
      bp.Q.value = q
      bp.frequency.setValueAtTime(from, t0)
      bp.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.5)
      bp.frequency.exponentialRampToValueAtTime(from, t0 + dur)
      src.connect(bp).connect(g)
      src.start(t0)
      src.stop(t0 + dur)
    }
    sweep(300, 2200, 0.6)
    sweep(900, 240, 1.1)
  }, [ensureAudio])

  /** Single tick for the 3-2-1 countdown. */
  const countTick = useCallback(
    (last = false) => {
      const ctx = ensureAudio()
      mallet(ctx, last ? 990 : 620, 0, last ? 320 : 180, last ? 0.7 : 0.5)
    },
    [ensureAudio, mallet],
  )

  /** Two falling soft notes — "stop moving, rest until the next GO". */
  const beepRest = useCallback(() => {
    const ctx = ensureAudio()
    REST_NOTES.forEach((f, i) => mallet(ctx, f, i * 0.16, 380, 0.6))
    buzz([180, 120, 180])
  }, [ensureAudio, mallet, buzz])

  /** Preview both cues: the GO chime, then the falling REST notes. */
  const beepTest = useCallback(() => {
    const ctx = ensureAudio()
    GO_NOTES.forEach((f, i) =>
      mallet(ctx, f, i * 0.09, i === GO_NOTES.length - 1 ? 700 : 350),
    )
    REST_NOTES.forEach((f, i) => mallet(ctx, f, 1.3 + i * 0.16, 380, 0.6))
  }, [ensureAudio, mallet])

  // --- ticking -----------------------------------------------------------

  useEffect(() => {
    if (status !== "running") return
    let frame = 0
    const tick = () => {
      const e = (performance.now() - startRef.current) / 1000

      // Beep on every minute boundary (including 0:00 — the "go" for set 1),
      // but not on the final boundary, which gets the end signal instead.
      const minuteIdx = Math.floor(e / 60)
      if (
        minuteIdx > lastMinuteRef.current &&
        minuteIdx < minutes &&
        e < totalSec
      ) {
        lastMinuteRef.current = minuteIdx
        beepMinute()
      }

      // Rest cue: work seconds of the current minute are done — double blip
      // so you can stop without watching the screen.
      if (
        minuteIdx < minutes &&
        e - minuteIdx * 60 >= workForMinute(minuteIdx) &&
        lastRestRef.current < minuteIdx &&
        e < totalSec
      ) {
        lastRestRef.current = minuteIdx
        beepRest()
      }

      if (e >= totalSec) {
        setElapsed(totalSec)
        setStatus("done")
        beepEnd()
        return
      }

      setElapsed(e)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [status, minutes, totalSec, workForMinute, beepMinute, beepRest, beepEnd])

  // --- screen wake lock ----------------------------------------------------
  // Keep the phone/laptop screen on while the timer runs; release on
  // pause/reset/done. The OS drops the lock when the tab is hidden, so we
  // re-acquire when it becomes visible again.

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    const release = () => {
      void wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }

    if (status !== "running") {
      release()
      return
    }

    let cancelled = false
    const acquire = async () => {
      if (!("wakeLock" in navigator)) return // unsupported — timer still works
      try {
        const lock = await navigator.wakeLock.request("screen")
        if (cancelled) {
          void lock.release().catch(() => {})
          return
        }
        wakeLockRef.current = lock
      } catch {
        // denied (e.g. battery saver) — nothing to do, the timer keeps going
      }
    }

    void acquire()
    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
      release()
    }
  }, [status])

  // --- controls ----------------------------------------------------------

  // Overlay fresh-start ritual: count "3 · 2 · 1" (ticks), then on GO fire the
  // wind whoosh + the psychedelic flight and actually start running. Driven by
  // timeouts (not an effect) so it survives re-renders cleanly.
  function beginCountdown() {
    // The dial begins flying to its corner NOW and arrives as the count hits
    // GO — so the user watches the countdown travel into its resting spot.
    setCountdown(3)
    setFlying(true)
    whoosh() // the wind runs through the whole flight
    countTick()
    let n = 3
    const next = () => {
      n -= 1
      if (n > 0) {
        setCountdown(n)
        countTick(n === 1)
        countdownRef.current = setTimeout(next, 900)
      } else {
        setCountdown(null)
        startRef.current = performance.now()
        setStatus("running")
        countdownRef.current = setTimeout(() => setFlying(false), 500)
      }
    }
    countdownRef.current = setTimeout(next, 900)
  }

  function start() {
    ensureAudio() // unlock audio within the user gesture
    // Overlay layouts get the 3-2-1 + flight on a fresh start (not resume).
    if (layRef.current?.overlay && status === "idle") {
      if (countdown !== null) return
      beginCountdown()
      return
    }
    startRef.current = performance.now() - elapsed * 1000
    setStatus("running")
  }

  function pause() {
    setStatus("paused")
  }


  function reset() {
    if (countdownRef.current) clearTimeout(countdownRef.current)
    setCountdown(null)
    setFlying(false)
    setStatus("idle")
    setElapsed(0)
    lastMinuteRef.current = -1
    lastRestRef.current = -1
  }

  function changeMinutes(delta: number) {
    setMinutes((m) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m + delta)))
  }

  function changeExercises(delta: number) {
    const count = Math.min(
      MAX_EXERCISES,
      Math.max(MIN_EXERCISES, exercises + delta),
    )
    setExercises(count)
    setExerciseNames((names) =>
      Array.from({ length: count }, (_, i) => names[i] ?? ""),
    )
  }

  function renameExercise(index: number, value: string) {
    setExerciseNames((names) => names.map((n, i) => (i === index ? value : n)))
  }

  function handleMinutesInput(value: string) {
    if (value === "") {
      setMinutes(MIN_MINUTES)
      return
    }
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    setMinutes(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed)))
  }

  // Work and rest always sum to one minute — editing either side rebalances
  // the other (30/30, 40/20, 45/15, …).
  function setWorkClamped(v: number) {
    setWorkSec(Math.min(MAX_WORK_SEC, Math.max(MIN_WORK_SEC, v)))
  }

  function handleWorkInput(value: string) {
    if (value === "") return
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    setWorkClamped(parsed)
  }

  function handleRestInput(value: string) {
    if (value === "") return
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    setWorkClamped(60 - parsed)
  }

  const isActive = status === "running" || status === "paused"
  // Each minute is one exercise slot; a row of dots is one full round.
  const currentExercise = (completedMinutes % exercises) + 1
  const currentMinute = Math.min(minutes, completedMinutes + 1)
  // Work split for the minute we're in (per-block in day mode).
  const minuteNow = Math.min(minutes - 1, Math.floor(elapsed / 60))
  const workNow = workForMinute(minuteNow)
  // True while in the work part of the current minute (or before start).
  const inWork = !isActive || elapsed % 60 < workNow
  // Which block the demo clip shows: the current move while working, the NEXT
  // move during the rest (so you can prep). Before start, show move 1.
  const displayIndex =
    !dayMode || !isActive
      ? 0
      : Math.min(dayBlocks.length - 1, inWork ? minuteNow : minuteNow + 1)
  const displayBlock = dayMode ? (dayBlocks[displayIndex] ?? null) : null
  const displayMoveNum = (displayIndex % exercises) + 1
  // True only when the rest is actually previewing a NEXT move (not the final
  // minute, where there's nothing after).
  const previewingNext = !inWork && displayIndex > minuteNow
  // Single-round dated workout: the named list doubles as the progress
  // tracker, so the separate minute-dot row is redundant and hidden.
  const singleRoundDay = dayMode && minutes === exercises
  // Active day-mode layout preset (drives arrangement + which block shows
  // each piece of info). In the plain timer the ring always shows everything.
  const lay = dayMode ? DAY_LAYOUTS[dayLayout] : null
  const ringMeta: RingMeta = lay ? lay.ring : "full"

  const updateDotsFade = useCallback(() => {
    const el = dotsRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setDotsFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < maxScroll - 4,
    })
  }, [])

  // Re-measure when the dot layout changes or the viewport resizes; the
  // scroller's own onScroll handles everything in between.
  useEffect(() => {
    updateDotsFade()
    window.addEventListener("resize", updateDotsFade)
    return () => window.removeEventListener("resize", updateDotsFade)
  }, [minutes, exercises, updateDotsFade])

  // When the dots overflow and scroll, the system does the scrolling: keep
  // the current minute centered so the user always sees where they are in
  // the sequence without touching the scroll. Reset parks it back at dot 1.
  useEffect(() => {
    const container = dotsRef.current
    if (!container) return
    if (status === "idle") {
      container.scrollTo({ left: 0, behavior: "smooth" })
      return
    }
    const dot = container.querySelector<HTMLElement>(
      `[data-minute="${currentMinute}"]`,
    )
    if (!dot) return
    const cRect = container.getBoundingClientRect()
    const dRect = dot.getBoundingClientRect()
    const target =
      container.scrollLeft +
      (dRect.left - cRect.left) +
      dRect.width / 2 -
      cRect.width / 2
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
  }, [status, currentMinute, minutes, exercises])
  // Day mode: keep the demo clip pointed at the current minute's exercise and
  // mirror the timer's play state. Muted + playsInline so autoplay is allowed;
  // the short clip loops until the minute rolls over to the next exercise.
  useEffect(() => {
    const v = videoRef.current
    const url = displayBlock?.video
    if (!v || !url) return
    if (displayBlock?.poster) v.poster = displayBlock.poster
    if (v.dataset.src !== url) {
      v.dataset.src = url
      const isHls = url.includes(".m3u8")
      if (!isHls) {
        v.src = url // plain MP4 (local / CDN)
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = url // Safari / iOS play HLS natively
      } else if (Hls.isSupported()) {
        if (!hlsRef.current) {
          hlsRef.current = new Hls({ enableWorker: true })
          hlsRef.current.attachMedia(v)
        }
        hlsRef.current.loadSource(url)
      } else {
        v.src = url
      }
    }
    if (status === "running") void v.play().catch(() => {})
    else v.pause()
  }, [displayBlock?.video, displayBlock?.poster, status])

  // Tear down the hls.js instance + any pending countdown timer on unmount.
  useEffect(
    () => () => {
      hlsRef.current?.destroy()
      if (countdownRef.current) clearTimeout(countdownRef.current)
    },
    [],
  )

  // Keep the latest layout readable from start() without a render-time ref read.
  useEffect(() => {
    layRef.current = lay
  }, [lay])

  // --- ring geometry -----------------------------------------------------

  // Smooth per-second sweep proportional to the total: each elapsed minute
  // adds exactly 1/minutes of the circle, completing on the final second.
  const ringProgress =
    status === "done"
      ? 1
      : totalSec > 0
        ? Math.min(1, elapsed / totalSec)
        : 0

  const R = 130
  const STROKE = 14
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - ringProgress)

  // Split the remaining time so each digit group can animate independently:
  // minutes hold steady while the seconds tick over.
  const reduceMotion = !!useReducedMotion()
  const remainCeil = Math.max(0, Math.ceil(remaining))
  const clockMin = String(Math.floor(remainCeil / 60))
  const clockSec = (remainCeil % 60).toString().padStart(2, "0")

  // --- overlay focus mode (layouts 6-8) ---------------------------------
  // The timer rides on top of the video and flies from center → corner on
  // Start. `DOCK` are the two framer targets (center vs the resting corner).
  // Straight-line travel (no rotation — spinning arced it off-screen).
  const DOCK: Record<
    string,
    { top: string; left: string; x: string; y: string; scale: number }
  > = {
    center: { top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1 },
    tr: { top: "5%", left: "95%", x: "-100%", y: "0%", scale: 0.4 },
    tl: { top: "5%", left: "5%", x: "0%", y: "0%", scale: 0.4 },
    br: { top: "95%", left: "95%", x: "-100%", y: "-100%", scale: 0.4 },
  }
  // A compact dial (progress ring + clock + phase + a single play/pause) for
  // the overlay; reuses the same ring geometry, sized to fit a corner. During
  // the 3-2-1 it shows the count instead of the clock, so the countdown itself
  // travels into the corner.
  const counting = countdown !== null
  // Before the first Start (overlay): show ONLY a big play button (over a
  // scrim) — clean "press to begin". The full dial appears once it starts.
  const idleStart = status === "idle" && !counting
  const compactTimer = idleStart ? (
    <button
      type="button"
      onClick={start}
      aria-label="Start"
      className="lm-psy-btn grid size-20 place-items-center rounded-full text-white transition-transform hover:scale-110 active:scale-95"
    >
      <Play className="size-9 fill-current" />
    </button>
  ) : (
    <div className="relative grid size-44 place-items-center">
      {/* Localized dark glow so the dial stays readable on ANY video (it
          scales with the dial, so it works big-centered and small-in-corner,
          on mobile + desktop) without dimming the whole clip. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.35) 55%, transparent 72%)",
        }}
      />
      <svg
        viewBox={`0 0 ${(R + STROKE) * 2} ${(R + STROKE) * 2}`}
        className="size-44 -rotate-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
      >
        <circle cx={R + STROKE} cy={R + STROKE} r={R} fill="none" strokeWidth={STROKE} className="stroke-white/25" />
        <circle
          cx={R + STROKE} cy={R + STROKE} r={R} fill="none" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashOffset}
          className="stroke-emerald-400"
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-1 text-white">
        {counting ? (
          // The travelling countdown — pops on each tick as the dial flies.
          <motion.span
            key={countdown}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
            className="text-7xl font-extrabold leading-none drop-shadow-[0_0_24px_rgba(16,185,129,0.85)]"
          >
            {countdown}
          </motion.span>
        ) : (
          <>
            {status === "running" && ringMeta !== "clock" ? (
              <span
                className={cn(
                  "text-sm font-extrabold tracking-[0.2em]",
                  inWork ? "text-emerald-400" : "text-amber-400",
                )}
              >
                {inWork ? "GO" : "REST"}
              </span>
            ) : null}
            <span className="flex items-center text-4xl font-bold leading-none tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              <TickDigit value={clockMin} reduce={reduceMotion} />
              <span className="px-0.5 pb-[0.1em]">:</span>
              <TickDigit value={clockSec} reduce={reduceMotion} />
            </span>
            <button
              type="button"
              onClick={status === "running" ? pause : start}
              disabled={status === "done"}
              aria-label={status === "running" ? "Pause" : "Start"}
              className={cn(
                "mt-1 grid size-11 place-items-center rounded-full text-white transition-transform hover:scale-110 active:scale-95",
                status === "done" ? "bg-muted" : "lm-psy-btn",
              )}
            >
              {status === "running" ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-6">
      {/* psychedelic hue/blur sweep while the dial flies to its corner */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes lm-trip{0%{filter:hue-rotate(0deg) saturate(1) blur(0)}20%{filter:hue-rotate(90deg) saturate(2.6) blur(2px)}50%{filter:hue-rotate(220deg) saturate(3.4) blur(1px)}80%{filter:hue-rotate(320deg) saturate(2) blur(.5px)}100%{filter:hue-rotate(360deg) saturate(1) blur(0)}}.lm-trip{animation:lm-trip 1.3s ease-in-out infinite}" +
            "@keyframes lm-psy-move{0%{background-position:0% 50%}100%{background-position:300% 50%}}" +
            "@keyframes lm-psy-glow{0%{box-shadow:0 0 22px rgba(57,255,20,.75)}33%{box-shadow:0 0 26px rgba(0,224,255,.8)}66%{box-shadow:0 0 26px rgba(177,75,255,.8)}100%{box-shadow:0 0 22px rgba(255,45,149,.75)}}" +
            ".lm-psy-btn{background-image:linear-gradient(120deg,#39FF14,#00e0ff,#b14bff,#ff2d95,#39FF14);background-size:300% 300%;animation:lm-psy-move 16s linear infinite,lm-psy-glow 13s ease-in-out infinite}",
        }}
      />
      {/* Dated workout: title + move count instead of the manual setup. */}
      {dayMode ? (
        <div className="order-2 flex w-full max-w-2xl flex-col items-center gap-2 text-center lg:order-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            {day?.date} · {exercises} moves
          </p>
          {day?.title ? (
            <h2 className="text-2xl font-extrabold tracking-tight">
              {day.title}
            </h2>
          ) : null}
        </div>
      ) : null}

      {/* Setup panel — settings and controls live together: configure the
          session, then hit start. Settings only editable while idle.
          On phones it drops below the timer: preset links open straight
          onto the ring, and the ring itself starts the session. */}
      <div
        className={cn(
          "order-2 flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card/50 p-4 sm:p-5 lg:order-1 lg:w-auto lg:max-w-none lg:flex-row lg:gap-7 lg:px-8",
          dayMode && "hidden",
        )}
      >
        <div className="flex w-full flex-wrap items-start justify-center gap-x-8 gap-y-5 lg:w-auto lg:flex-nowrap">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMinutes(-1)}
                disabled={isActive || minutes <= MIN_MINUTES}
                aria-label="Decrease minutes"
              >
                <Minus className="size-4" />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={minutes}
                onChange={(e) => handleMinutesInput(e.target.value)}
                disabled={isActive}
                aria-label="Minutes"
                className="w-16 bg-transparent text-center text-2xl font-semibold tabular-nums outline-none focus:rounded-md focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMinutes(1)}
                disabled={isActive || minutes >= MAX_MINUTES}
                aria-label="Increase minutes"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              minutes
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeExercises(-1)}
                disabled={isActive || exercises <= MIN_EXERCISES}
                aria-label="Decrease exercises"
              >
                <Minus className="size-4" />
              </Button>
              <span
                aria-label="Exercises per round"
                aria-live="polite"
                className={cn(
                  "w-10 text-center text-2xl font-semibold tabular-nums",
                  isActive && "opacity-50",
                )}
              >
                {exercises}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeExercises(1)}
                disabled={isActive || exercises >= MAX_EXERCISES}
                aria-label="Increase exercises"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              exercises
            </span>
          </div>

          {/* Work/rest split — locked while running, always sums to 60s */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={MIN_WORK_SEC}
                max={MAX_WORK_SEC}
                step={5}
                value={workSec}
                onChange={(e) => handleWorkInput(e.target.value)}
                disabled={isActive}
                aria-label="Work seconds per minute"
                className="h-9 w-14 rounded-md border border-input bg-transparent text-center text-sm font-semibold tabular-nums text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 dark:text-emerald-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-sm text-muted-foreground">/</span>
              <input
                type="number"
                inputMode="numeric"
                min={60 - MAX_WORK_SEC}
                max={60 - MIN_WORK_SEC}
                step={5}
                value={60 - workSec}
                onChange={(e) => handleRestInput(e.target.value)}
                disabled={isActive}
                aria-label="Rest seconds per minute"
                className="h-9 w-14 rounded-md border border-input bg-transparent text-center text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              work / rest · sec
            </span>
          </div>
        </div>

      </div>

      {/* Ring · demo clip · move list — arrangement set by the layout preset
          in day mode (each block carries non-overlapping info). */}
      <div
        className={cn(
          "order-1 flex w-full max-w-full min-w-0 flex-col items-center gap-6 lg:order-2 lg:w-auto lg:gap-8",
          (!lay || !lay.col) && "lg:flex-row lg:items-center",
        )}
      >
        {lay?.overlay ? (
          /* Overlay focus — video hero, timer flies center → corner on Start */
          <div className="relative aspect-[9/16] w-[min(400px,85vw)] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Idle scrim — darkens the clip so the play button pops. */}
            {idleStart ? (
              <div className="absolute inset-0 bg-black/45" />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                {previewingNext
                  ? `next · move ${displayMoveNum}/${exercises}`
                  : `move ${displayMoveNum}/${exercises}`}
              </p>
              <p className="truncate text-base font-bold text-white">
                {displayBlock?.name || `Exercise ${displayMoveNum}`}
              </p>
            </div>
            <motion.div
              className={cn("absolute", flying && "lm-trip")}
              style={{
                transformOrigin:
                  lay.dock === "tl"
                    ? "top left"
                    : lay.dock === "br"
                      ? "bottom right"
                      : "top right",
              }}
              initial={false}
              // Travel to the corner during the countdown (counting) and stay
              // there once running; center while idle.
              animate={DOCK[counting || isActive ? (lay.dock ?? "tr") : "center"]}
              transition={
                counting
                  ? { duration: 2.7, ease: [0.45, 0, 0.15, 1] } // slow flight over 3·2·1
                  : { type: "spring", stiffness: 170, damping: 18 }
              }
            >
              {compactTimer}
            </motion.div>
          </div>
        ) : (
          <>
        {/* Circular timer */}
        <div
          className="flex flex-col items-center"
          style={lay ? { order: lay.ringOrder } : undefined}
        >
      <div className="relative grid place-items-center rounded-full">
        {status === "idle" && (
          <span
            aria-hidden
            className="absolute inset-6 animate-pulse rounded-full bg-emerald-500/25 blur-2xl"
          />
        )}
        <svg
          viewBox={`0 0 ${(R + STROKE) * 2} ${(R + STROKE) * 2}`}
          className="size-72 -rotate-90 sm:size-80"
        >
          <circle
            cx={R + STROKE}
            cy={R + STROKE}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          <circle
            cx={R + STROKE}
            cy={R + STROKE}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            // No CSS transition here: the value already updates every frame,
            // and restarting a transition per frame can pin the rendered arc
            // far behind the real progress on some engines.
            className="stroke-emerald-500"
          />
        </svg>
        {/* Equal-height zones above/below keep the number geometrically
            centered; the slight upward nudge is optical — the button row
            below carries more visual weight than the badge above. */}
        <div className="absolute flex -translate-y-2 flex-col items-center">
          <div className="flex h-14 flex-col items-center justify-end pb-2">
            {/* ringMeta="clock" hides this row entirely (phase/counter live on
                the video in that layout); "numbers" drops the GO/REST word. */}
            {ringMeta !== "clock" &&
              (status === "running" ? (
                <>
                  {ringMeta === "full" ? (
                    <span
                      className={cn(
                        "text-base font-extrabold tracking-[0.25em] transition-colors duration-300",
                        inWork
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {inWork ? "GO" : "REST"}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    exercise {currentExercise}/{exercises}
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] tabular-nums"
                    >
                      {(ringProgress * 100).toFixed(1)}%
                    </Badge>
                  </span>
                </>
              ) : (
                <Badge variant="secondary" className="tabular-nums">
                  {(ringProgress * 100).toFixed(1)}%
                </Badge>
              ))}
          </div>
          <span className="flex items-center justify-center text-6xl font-bold leading-none tabular-nums sm:text-7xl">
            <TickDigit value={clockMin} reduce={reduceMotion} />
            <span className="px-0.5 pb-[0.12em]">:</span>
            <TickDigit value={clockSec} reduce={reduceMotion} />
          </span>
          {/* Controls — always inside the ring, under the time. The middle
              button is the play/pause toggle; reset only appears once there
              is something to reset (invisible, not removed, so play stays
              dead-center under the number). */}
          <div className="flex h-14 items-center justify-center pt-1.5">
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={reset}
                      aria-label="Reset timer"
                      className={cn(
                        "grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-emerald-500 hover:text-foreground",
                        status === "idle" && "invisible",
                      )}
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Reset</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={status === "running" ? pause : start}
                      disabled={status === "done"}
                      aria-label={
                        status === "running"
                          ? "Pause timer"
                          : status === "paused"
                            ? "Resume timer"
                            : "Start timer"
                      }
                      // 200ms ease pop (per Leo's tip): press squashes to 95%,
                      // release grows back. Psychedelic animated-gradient fill.
                      className={cn(
                        "grid size-12 place-items-center rounded-full text-white transition-transform duration-200 ease-out hover:scale-110 active:scale-95 disabled:scale-100 disabled:text-muted-foreground disabled:shadow-none",
                        status === "done" ? "bg-muted" : "lm-psy-btn",
                      )}
                    >
                      {status === "running" ? (
                        <Pause className="size-5 fill-current" />
                      ) : (
                        <Play className="size-5 fill-current" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {status === "running"
                      ? "Pause"
                      : status === "paused"
                        ? "Resume"
                        : "Start"}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={beepTest}
                      aria-label="Test the GO beep and the REST double-blip"
                      className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-emerald-500 hover:text-foreground"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Test beep</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>

          {/* Done CTA — only exists in the done state, slides in under the
              ring like a reward; reset removes it with the state change. */}
          {status === "done" && (
            <div className="flex animate-in fade-in slide-in-from-bottom-3 flex-col items-center gap-3 pt-5 text-center duration-500">
              <p className="text-sm font-medium">
                Nice work 💪 {minutes} minutes done.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Link href="/pricing">Want a plan to follow? Train with me →</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Demo clip (dated workouts) — sits right next to the move list. While
            working it shows the current move; during the rest it previews the
            NEXT move so you can set up for it. */}
        {dayMode && lay ? (
          <div
            className={cn("w-full", lay.videoW)}
            style={{ order: lay.videoOrder }}
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="auto"
                className="size-full object-cover"
              />
              {/* GO/REST chip only when the video carries the phase ("full") */}
              {lay.video === "full" && status === "running" ? (
                <span
                  className={cn(
                    "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.18em]",
                    inWork
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-black",
                  )}
                >
                  {inWork ? "GO" : "REST"}
                </span>
              ) : null}
              {/* Name caption when the video owns the name ("name"/"full") */}
              {lay.video !== "none" ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                    {previewingNext
                      ? `next · move ${displayMoveNum}/${exercises}`
                      : `move ${displayMoveNum}/${exercises}`}
                  </p>
                  <p className="truncate text-sm font-bold text-white">
                    {displayBlock?.name || `Exercise ${displayMoveNum}`}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Names + minute dots — they belong together, one column on the
            right; both blocks pin to the left edge of the column. Hidden in
            day-mode layouts that move the move name onto the video. */}
        {!dayMode || (lay && lay.names) ? (
        <div
          className="flex min-w-0 max-w-full flex-col items-start gap-4"
          style={lay ? { order: lay.namesOrder } : undefined}
        >
          {/* Exercise names — write them down, screenshot for members */}
          <div className="flex flex-col gap-2">
            {exerciseNames.map((name, i) => {
              const live = isActive && i + 1 === currentExercise
              // In a single-round dated workout the list IS the progress
              // tracker (the dot row below is hidden), so fill done moves too.
              const done = singleRoundDay && isActive && i + 1 < currentExercise
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300",
                      live || done
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(e) => renameExercise(i, e.target.value)}
                    readOnly={dayMode}
                    placeholder={`Exercise ${i + 1}`}
                    aria-label={`Exercise ${i + 1} name`}
                    className={cn(
                      "h-10 w-56 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:ring-2 focus:ring-emerald-500 sm:w-48 sm:text-sm",
                      dayMode && "cursor-default border-transparent focus:ring-0",
                    )}
                  />
                </div>
              )
            })}
          </div>

          {/* Minute dots — one row per exercise, one column per round;
              fills top-to-bottom then left-to-right (1,2,3 → 4,5,6). Hidden in
              day mode entirely: the ring (% + move N/total) and the named list
              already track progress, so dots would just repeat it. */}
          <div className={cn("relative w-fit max-w-full", dayMode && "hidden")}>
            <div
              ref={dotsRef}
              onScroll={updateDotsFade}
              className="grid w-fit max-w-full grid-flow-col gap-1.5 overflow-x-auto sm:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                gridTemplateRows: `repeat(${exercises}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: minutes }, (_, i) => {
                const n = i + 1
                // The minute we're currently in counts as filled — dot 1 fills
                // the moment the timer starts.
                const current = isActive && n === completedMinutes + 1
                const filled =
                  status === "done" || n <= completedMinutes || current
                // Shrink dots only for long sessions (many columns) — depends
                // on minutes alone so changing exercises never resizes them.
                const compact = minutes > 30
                return (
                  <span
                    key={n}
                    data-minute={n}
                    className={cn(
                      "relative grid place-items-center overflow-hidden rounded-full border tabular-nums transition-colors duration-500",
                      compact
                        ? "size-6 text-[10px] sm:size-8 sm:text-xs"
                        : "size-10 text-sm sm:size-11 sm:text-sm",
                      filled
                        ? "border-emerald-500 text-white"
                        : "border-border text-muted-foreground",
                      current && status === "running" && "animate-pulse",
                    )}
                  >
                    {/* Fill grows from the center instead of snapping on */}
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full bg-emerald-500 transition-transform duration-500 ease-out",
                        filled ? "scale-100" : "scale-0",
                      )}
                    />
                    <span className="relative">{n}</span>
                  </span>
                )
              })}
            </div>
            {/* Edge fades — pure visual cue that the strip continues */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-300",
                dotsFade.left ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-300",
                dotsFade.right ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
        ) : null}
          </>
        )}
      </div>
    </div>
  )
}
