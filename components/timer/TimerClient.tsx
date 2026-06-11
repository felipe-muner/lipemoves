"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

  const startRef = useRef(0) // performance.now() baseline
  const lastMinuteRef = useRef(-1) // highest minute index already beeped
  const lastRestRef = useRef(-1) // highest minute index already rest-cued
  const audioRef = useRef<AudioContext | null>(null)

  const totalSec = minutes * 60
  const remaining = Math.max(0, totalSec - elapsed)
  const completedMinutes = Math.min(minutes, Math.floor(elapsed / 60))

  // --- audio -------------------------------------------------------------

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      audioRef.current = new Ctx()
    }
    if (audioRef.current.state === "suspended") {
      void audioRef.current.resume()
    }
    return audioRef.current
  }, [])

  /** Schedule a single tone with a click-free envelope. */
  const tone = useCallback(
    (ctx: AudioContext, freq: number, durationMs: number, atOffset = 0) => {
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
    },
    [],
  )

  const beepMinute = useCallback(() => {
    tone(ensureAudio(), BEEP_FREQ, BEEP_MS)
  }, [ensureAudio, tone])

  const beepEnd = useCallback(() => {
    const ctx = ensureAudio()
    // three rising-spaced tones, last one extra long
    tone(ctx, END_FREQ, 450, 0)
    tone(ctx, END_FREQ, 450, 0.6)
    tone(ctx, END_FREQ, 1100, 1.2)
  }, [ensureAudio, tone])

  /** Two short low blips — "stop moving, rest until the next GO". */
  const beepRest = useCallback(() => {
    const ctx = ensureAudio()
    tone(ctx, REST_FREQ, 220, 0)
    tone(ctx, REST_FREQ, 220, 0.32)
  }, [ensureAudio, tone])

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

  function changeExercises(count: number) {
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
    <div className="flex flex-col items-center gap-8">
      {/* Minutes selector — only editable while idle */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeMinutes(-1)}
          disabled={isActive || minutes <= MIN_MINUTES}
          aria-label="Decrease minutes"
        >
          <Minus className="size-4" />
        </Button>
        <div className="flex min-w-28 items-baseline justify-center">
          <input
            type="number"
            inputMode="numeric"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            value={minutes}
            onChange={(e) => handleMinutesInput(e.target.value)}
            disabled={isActive}
            aria-label="Minutes"
            className="w-14 bg-transparent text-center text-2xl font-semibold tabular-nums outline-none focus:rounded-md focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="ml-1 text-sm text-muted-foreground">min</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeMinutes(1)}
          disabled={isActive || minutes >= MAX_MINUTES}
          aria-label="Increase minutes"
        >
          <Plus className="size-4" />
        </Button>

        <div className="ml-4 flex items-center gap-2">
          <select
            value={exercises}
            onChange={(e) => changeExercises(Number(e.target.value))}
            disabled={isActive}
            aria-label="Exercises per round"
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {Array.from({ length: MAX_EXERCISES }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">exercises</span>
        </div>

        {/* Work/rest split — locked while running, always sums to 60s */}
        <div className="ml-4 flex items-center gap-2">
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
          <span className="text-sm text-muted-foreground">work</span>
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
          <span className="text-sm text-muted-foreground">rest&nbsp;· s</span>
        </div>
      </div>

      {/* Names · ring+controls · minute dots — side by side, no scrolling */}
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-14">
        {/* Exercise names — write them down, screenshot for members */}
        <div className="order-2 flex flex-col gap-2 lg:order-1">
          {exerciseNames.map((name, i) => {
            const live = isActive && i + 1 === currentExercise
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
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
                  className="h-9 w-48 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )
          })}
        </div>

        {/* Circular timer + controls */}
        <div className="order-1 flex flex-col items-center gap-5 lg:order-2">
      <div className="relative grid place-items-center">
        <svg
          width={(R + STROKE) * 2}
          height={(R + STROKE) * 2}
          className="-rotate-90"
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
          <span className="text-6xl font-bold tabular-nums tracking-tight">
            {fmt(remaining)}
          </span>
          {status === "running" ? (
            <span
              className={cn(
                "mt-1 text-sm font-extrabold tracking-[0.25em]",
                elapsed % 60 < workSec
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            >
              {elapsed % 60 < workSec ? "GO" : "REST"}
            </span>
          ) : (
            <span className="mt-1 text-sm text-muted-foreground">{label}</span>
          )}
          {status === "running" || status === "paused" ? (
            <span className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              exercise {currentExercise}/{exercises}
            </span>
          ) : null}
          <Badge variant="secondary" className="mt-2 tabular-nums">
            {(ringProgress * 100).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
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

      {/* Minute dots — one row per round, one column per exercise */}
      <div
        className="order-3 grid w-fit gap-1.5 self-center"
        style={{ gridTemplateColumns: `repeat(${exercises}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: minutes }, (_, i) => {
          const n = i + 1
          // The minute we're currently in counts as filled — dot 1 fills the
          // moment the timer starts.
          const current = isActive && n === completedMinutes + 1
          const filled =
            status === "done" || n <= completedMinutes || current
          // Shrink dots when there are many rounds so the column never
          // grows taller than the ring (no page scrolling).
          const compact = minutes / exercises > 8
          return (
            <span
              key={n}
              className={cn(
                "grid place-items-center rounded-full border tabular-nums transition-colors",
                compact ? "size-6 text-[10px]" : "size-8 text-xs",
                filled
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border text-muted-foreground",
                current && status === "running" && "animate-pulse",
              )}
            >
              {n}
            </span>
          )
        })}
      </div>
      </div>
    </div>
  )
}
