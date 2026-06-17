"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  /** Absolute MP4 URL (Bunny CDN) for the muted, looping demo. */
  video: string
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
  const videoRef = useRef<HTMLVideoElement | null>(null)
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
      fetch(`/timer-days/${date}.json`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: DayFile | null) => {
          if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0)
            return
          const blocks = data.blocks
            .slice(0, MAX_EXERCISES)
            .map((b) => ({
              name: typeof b.name === "string" ? b.name : "",
              video: typeof b.video === "string" ? b.video : "",
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

  function start() {
    ensureAudio() // unlock audio within the user gesture
    startRef.current = performance.now() - elapsed * 1000
    setStatus("running")
  }

  function pause() {
    setStatus("paused")
  }


  function reset() {
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
  // The demo clip for the current minute (day mode only). Before start, show
  // the first block so the page isn't a black box.
  const currentBlock = dayMode
    ? dayBlocks[Math.min(dayBlocks.length - 1, isActive ? minuteNow : 0)]
    : null

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
    if (!v || !currentBlock?.video) return
    if (v.dataset.src !== currentBlock.video) {
      v.dataset.src = currentBlock.video
      v.src = currentBlock.video
      v.load()
    }
    if (status === "running") void v.play().catch(() => {})
    else v.pause()
  }, [currentBlock?.video, status])

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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dated workout: title + move count instead of the manual setup. */}
      {dayMode ? (
        <div className="order-2 flex w-full max-w-2xl flex-col items-center gap-1 text-center lg:order-1">
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

      {/* Ring+controls on the left · names+dots column on the right */}
      <div className="order-1 flex w-full max-w-full min-w-0 flex-col items-center gap-6 lg:order-2 lg:w-auto lg:flex-row lg:items-center lg:gap-10">
        {/* Demo clip for the current minute (dated workouts) — same screen as
            the timer so you watch the move while the clock runs. */}
        {dayMode ? (
          <div className="w-full max-w-[240px]">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="auto"
                className="size-full object-cover"
              />
              {status === "running" ? (
                <span
                  className={cn(
                    "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.18em]",
                    elapsed % 60 < workNow
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-black",
                  )}
                >
                  {elapsed % 60 < workNow ? "GO" : "REST"}
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                  move {currentExercise}/{exercises}
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {currentBlock?.name || `Exercise ${currentExercise}`}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Circular timer */}
        <div className="flex flex-col items-center">
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
            {status === "running" ? (
              // Mid-workout: live cue on top, exercise counter + the % badge
              // below it (Felipe wants the percentage visible while running).
              <>
                <span
                  className={cn(
                    "text-base font-extrabold tracking-[0.25em] transition-colors duration-300",
                    elapsed % 60 < workNow
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {elapsed % 60 < workNow ? "GO" : "REST"}
                </span>
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
            )}
          </div>
          <span className="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl">
            <TickDigit value={clockMin} reduce={reduceMotion} />
            <span>:</span>
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
                      // release grows back; plus a one-time zoom-in on mount to
                      // pull the eye to START when the page loads.
                      className="grid size-12 animate-in place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.7)] transition-transform duration-200 ease-out zoom-in-50 hover:scale-110 active:scale-95 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
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

        {/* Names + minute dots — they belong together, one column on the
            right; both blocks pin to the left edge of the column */}
        <div className="flex min-w-0 max-w-full flex-col items-start gap-4">
          {/* Exercise names — write them down, screenshot for members */}
          <div className="flex flex-col gap-2">
            {exerciseNames.map((name, i) => {
              const live = isActive && i + 1 === currentExercise
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300",
                      live
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
              fills top-to-bottom then left-to-right (1,2,3 → 4,5,6) */}
          <div className="relative w-fit max-w-full">
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
      </div>
    </div>
  )
}
