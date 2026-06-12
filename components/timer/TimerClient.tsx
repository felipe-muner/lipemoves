"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Pause, Play, RotateCcw, Volume2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "idle" | "running" | "paused" | "done"

/**
 * How long each minute "beep" lasts, in milliseconds. Felipe wanted a long,
 * clearly-audible tone he can hear across the room mid-set — so this is a full
 * second rather than the usual short blip.
 */
const BEEP_MS = 1000
const BEEP_FREQ = 880 // A5 — cuts through gym noise nicely
const END_FREQ = 1046 // C6 — higher, distinct "you're done" pitch
const REST_FREQ = 523 // C5 — clearly lower than the GO beep; played twice

const MIN_MINUTES = 1
const MAX_MINUTES = 60
const MIN_EXERCISES = 1
const MAX_EXERCISES = 10
// Work/rest split inside each minute (work + rest = 60s, e.g. 30/30, 40/20).
const MIN_WORK_SEC = 5
const MAX_WORK_SEC = 55

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function TimerClient() {
  const [minutes, setMinutes] = useState(30)
  const [workSec, setWorkSec] = useState(30) // rest is always 60 − work
  const [exercises, setExercises] = useState(3)
  const [exerciseNames, setExerciseNames] = useState<string[]>(["", "", ""])
  const [status, setStatus] = useState<Status>("idle")
  const [elapsed, setElapsed] = useState(0) // seconds, fractional
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

  // --- audio -------------------------------------------------------------

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      // iOS: declare our audio as short "transient" cues — they duck
      // background music (Spotify, YouTube) for a moment instead of being
      // silenced by the mute switch or losing the session to the other app.
      const nav = navigator as Navigator & { audioSession?: { type: string } }
      if (nav.audioSession) nav.audioSession.type = "transient"
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

  /** Schedule a single tone with a click-free envelope. If another app
   *  (music, a call) suspended our context, resume it first — otherwise the
   *  beep would be scheduled into a stopped clock and never heard. */
  const tone = useCallback(
    (ctx: AudioContext, freq: number, durationMs: number, atOffset = 0) => {
      const play = () => {
        const t0 = ctx.currentTime + atOffset
        const dur = durationMs / 1000
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, t0)
        gain.gain.linearRampToValueAtTime(0.7, t0 + 0.02)
        gain.gain.setValueAtTime(0.7, t0 + dur - 0.06)
        gain.gain.linearRampToValueAtTime(0, t0 + dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t0)
        osc.stop(t0 + dur)
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

  const beepMinute = useCallback(() => {
    tone(ensureAudio(), BEEP_FREQ, BEEP_MS)
    buzz(400)
  }, [ensureAudio, tone, buzz])

  const beepEnd = useCallback(() => {
    const ctx = ensureAudio()
    // three rising-spaced tones, last one extra long
    tone(ctx, END_FREQ, 450, 0)
    tone(ctx, END_FREQ, 450, 0.6)
    tone(ctx, END_FREQ, 1100, 1.2)
    buzz([300, 150, 300, 150, 700])
  }, [ensureAudio, tone, buzz])

  /** Two short low blips — "stop moving, rest until the next GO". */
  const beepRest = useCallback(() => {
    const ctx = ensureAudio()
    tone(ctx, REST_FREQ, 220, 0)
    tone(ctx, REST_FREQ, 220, 0.32)
    buzz([180, 120, 180])
  }, [ensureAudio, tone, buzz])

  /** Preview both cues: one GO beep, then the double REST blip. */
  const beepTest = useCallback(() => {
    const ctx = ensureAudio()
    tone(ctx, BEEP_FREQ, 600, 0)
    tone(ctx, REST_FREQ, 220, 1.0)
    tone(ctx, REST_FREQ, 220, 1.32)
  }, [ensureAudio, tone])

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
        e - minuteIdx * 60 >= workSec &&
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
  }, [status, minutes, totalSec, workSec, beepMinute, beepRest, beepEnd])

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

  /** The whole ring is tappable: start when idle, pause/resume while active.
   *  Done is inert — reset stays a small deliberate button so an accidental
   *  tap can never wipe a finished (or running) session. */
  function toggleFromRing() {
    if (status === "running") pause()
    else if (status !== "done") start()
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
  const label =
    status === "running"
      ? "running"
      : status === "paused"
        ? "paused"
        : status === "done"
          ? "done"
          : "ready"

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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Setup panel — settings and controls live together: configure the
          session, then hit start. Settings only editable while idle.
          On phones it drops below the timer: preset links open straight
          onto the ring, and the ring itself starts the session. */}
      <div className="order-2 flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card/50 p-4 sm:p-5 lg:order-1 lg:w-auto lg:max-w-none lg:flex-row lg:gap-7 lg:px-8">
        <div className="flex w-full flex-wrap items-start justify-center gap-x-8 gap-y-5 lg:order-3 lg:w-auto lg:flex-nowrap">
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

        <div className="h-px w-full bg-border/60 lg:order-2 lg:h-12 lg:w-px lg:self-center" />

        {/* Controls — left side of the panel on desktop */}
        <div className="flex flex-wrap items-center justify-center gap-3 lg:order-1">
          {status === "running" ? (
            <Button variant="outline" size="lg" onClick={pause}>
              <Pause className="size-4" /> pause
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={start}
              disabled={status === "done"}
            >
              <Play className="size-4" />
              {status === "paused" ? "resume" : "start"}
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw className="size-4" /> reset
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={beepTest}
            title="Test the GO beep and the REST double-blip"
          >
            <Volume2 className="size-4" /> test beep
          </Button>
        </div>
      </div>

      {/* Ring+controls on the left · names+dots column on the right */}
      <div className="order-1 flex w-full max-w-full min-w-0 flex-col items-center gap-6 lg:order-2 lg:w-auto lg:flex-row lg:items-center lg:gap-14">
        {/* Circular timer */}
        <div className="flex flex-col items-center">
      {/* The ring is the start button: one giant tap target for phones,
          with a glow that says "tap me" when a preset link lands here. */}
      <button
        type="button"
        onClick={toggleFromRing}
        disabled={status === "done"}
        aria-label={
          status === "running"
            ? "Pause timer"
            : status === "paused"
              ? "Resume timer"
              : "Start timer"
        }
        className="group relative grid cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 disabled:cursor-default"
      >
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
        <div className="absolute flex flex-col items-center">
          {/* Equal-height zones above and below keep the big number dead
              center in the ring, whatever appears around it. */}
          <div className="flex h-14 items-end pb-2">
            <Badge variant="secondary" className="tabular-nums">
              {(ringProgress * 100).toFixed(1)}%
            </Badge>
          </div>
          <span className="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl">
            {fmt(remaining)}
          </span>
          {/* Fixed-height zone under the time — content swaps per state but
              the big number never moves. */}
          <div className="flex h-14 flex-col items-center pt-1.5">
            {status === "running" ? (
              <>
                <span
                  className={cn(
                    "text-base font-extrabold tracking-[0.25em] transition-colors duration-300",
                    elapsed % 60 < workSec
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {elapsed % 60 < workSec ? "GO" : "REST"}
                </span>
                <span className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  exercise {currentExercise}/{exercises}
                </span>
              </>
            ) : status === "done" ? (
              <span className="text-sm text-muted-foreground">{label}</span>
            ) : (
              // Idle/paused: a filled play badge inside the ring — the
              // visible cue that the whole circle is the start button.
              <span className="grid size-11 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.7)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                <Play className="size-5 fill-current" />
                <span className="sr-only">{label}</span>
              </span>
            )}
          </div>
        </div>
      </button>

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
                    placeholder={`Exercise ${i + 1}`}
                    aria-label={`Exercise ${i + 1} name`}
                    className="h-10 w-56 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:ring-2 focus:ring-emerald-500 sm:w-48 sm:text-sm"
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
