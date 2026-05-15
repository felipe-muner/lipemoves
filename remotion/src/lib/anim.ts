import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"

/**
 * Spring-based "punch in" — scale and opacity in over a short window,
 * then linger. Tuned for kinetic title cards.
 */
export function usePunchIn(
  startFrame: number,
  durationFrames = 14,
): { scale: number; opacity: number } {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - startFrame
  if (local < 0) return { scale: 0.7, opacity: 0 }

  const s = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.6 },
    durationInFrames: durationFrames,
  })
  return {
    scale: interpolate(s, [0, 1], [0.7, 1]),
    opacity: interpolate(s, [0, 1], [0, 1]),
  }
}

/**
 * Out-easing on a window's tail: fades + slides up at the end.
 */
export function useOutro(
  startFrame: number,
  durationInWindow: number,
  exitFrames = 10,
): { opacity: number; y: number } {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const exitStart = durationInWindow - exitFrames
  if (local < exitStart) return { opacity: 1, y: 0 }
  const t = (local - exitStart) / exitFrames
  return {
    opacity: 1 - Math.min(1, Math.max(0, t)),
    y: -interpolate(t, [0, 1], [0, 40]),
  }
}

/**
 * Quick swoop entry from the side.
 */
export function useSwoop(
  startFrame: number,
  direction: "left" | "right" | "down" | "up" = "left",
  durationFrames = 12,
): { x: number; y: number; opacity: number } {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - startFrame
  if (local < 0) {
    const off = direction === "right" ? 200 : direction === "left" ? -200 : 0
    return {
      x: off,
      y: direction === "down" ? -150 : direction === "up" ? 150 : 0,
      opacity: 0,
    }
  }
  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.7 },
    durationInFrames: durationFrames,
  })
  const xStart = direction === "right" ? 200 : direction === "left" ? -200 : 0
  const yStart = direction === "down" ? -150 : direction === "up" ? 150 : 0
  return {
    x: interpolate(s, [0, 1], [xStart, 0]),
    y: interpolate(s, [0, 1], [yStart, 0]),
    opacity: interpolate(s, [0, 0.4, 1], [0, 1, 1]),
  }
}

/**
 * Ken Burns zoom — slow scale + drift across a window.
 */
export function useKenBurns(
  startFrame: number,
  windowFrames: number,
  mode: "in" | "out" = "in",
  drift: { x: number; y: number } = { x: -2, y: 1 },
): { scale: number; x: number; y: number } {
  const frame = useCurrentFrame()
  const local = Math.max(0, Math.min(windowFrames, frame - startFrame))
  const t = local / windowFrames
  const scale =
    mode === "in" ? interpolate(t, [0, 1], [1.0, 1.12]) : interpolate(t, [0, 1], [1.12, 1.0])
  return {
    scale,
    x: interpolate(t, [0, 1], [0, drift.x]),
    y: interpolate(t, [0, 1], [0, drift.y]),
  }
}

/** Quick white flash that fades over a few frames. Use between cuts. */
export function useFlash(
  triggerFrames: number[],
  duration = 4,
): number {
  const frame = useCurrentFrame()
  for (const t of triggerFrames) {
    if (frame >= t && frame < t + duration) {
      const local = frame - t
      return 1 - local / duration
    }
  }
  return 0
}

/** A tiny shake (for impact). Returns x/y offset in px. */
export function useShake(
  startFrame: number,
  durationFrames = 8,
  intensity = 6,
): { x: number; y: number } {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  if (local < 0 || local >= durationFrames) return { x: 0, y: 0 }
  const decay = 1 - local / durationFrames
  // Pseudo-random shake
  const sx = Math.sin(local * 3.7) * intensity * decay
  const sy = Math.cos(local * 4.3) * intensity * decay
  return { x: sx, y: sy }
}
