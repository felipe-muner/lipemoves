"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw, Volume2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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

const MIN_MINUTES = 1
const MAX_MINUTES = 60

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function TimerClient() {
  const [minutes, setMinutes] = useState(20)
  const [status, setStatus] = useState<Status>("idle")
  const [elapsed, setElapsed] = useState(0) // seconds, fractional

  const startRef = useRef(0) // performance.now() baseline
  const lastMinuteRef = useRef(-1) // highest minute index already beeped
  const audioRef = useRef<AudioContext | null>(null)

  const totalSec = minutes * 60
  const remaining = Math.max(0, totalSec - elapsed)
  const progress = totalSec > 0 ? Math.min(1, elapsed / totalSec) : 0
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
  }, [status, minutes, totalSec, beepMinute, beepEnd])

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
  }

  function changeMinutes(delta: number) {
    setMinutes((m) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m + delta)))
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

  const isActive = status === "running" || status === "paused"
  const label =
    status === "running"
      ? "running"
      : status === "paused"
        ? "paused"
        : status === "done"
          ? "done"
          : "ready"

  // --- ring geometry -----------------------------------------------------

  const R = 130
  const STROKE = 14
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - progress)

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
      </div>

      {/* Circular timer */}
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
            className="stroke-emerald-500 transition-[stroke-dashoffset] duration-200 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-bold tabular-nums tracking-tight">
            {fmt(remaining)}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">{label}</span>
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
          onClick={beepMinute}
          title="Test the beep volume"
        >
          <Volume2 className="size-4" /> test beep
        </Button>
      </div>

      {/* Minute dots — 10 per row */}
      <div className="grid w-fit grid-cols-10 gap-2">
        {Array.from({ length: minutes }, (_, i) => {
          const n = i + 1
          const done = n <= completedMinutes
          const current = isActive && n === completedMinutes + 1
          return (
            <span
              key={n}
              className={cn(
                "grid size-8 place-items-center rounded-full border text-xs tabular-nums transition-colors",
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : current
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-border text-muted-foreground",
              )}
            >
              {n}
            </span>
          )
        })}
      </div>
    </div>
  )
}
