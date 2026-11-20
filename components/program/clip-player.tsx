"use client"

import * as React from "react"
import { Pause, Play } from "lucide-react"

/**
 * Silent looping demo clip for an exercise card. Plays by itself while it is
 * on screen and pauses when scrolled away; a tap toggles it. People who ask
 * their device for reduced motion get a still frame until they press play.
 */
export function ClipPlayer({ src, label }: { src: string; label: string }) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const userPaused = React.useRef(false)
  const [playing, setPlaying] = React.useState(false)

  React.useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) userPaused.current = true

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.6 }
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  function toggle() {
    const video = ref.current
    if (!video) return
    if (video.paused) {
      userPaused.current = false
      video.play().catch(() => {})
    } else {
      userPaused.current = true
      video.pause()
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? `Pause ${label} demo` : `Play ${label} demo`}
      className="group/clip absolute inset-0 block h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#39FF14]"
    >
      <video
        ref={ref}
        src={`${src}#t=0.1`}
        loop
        muted
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
        Demo
      </span>
      <span
        className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-opacity ${
          playing ? "opacity-0 group-hover/clip:opacity-100 group-focus-visible/clip:opacity-100" : "opacity-100"
        }`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </span>
    </button>
  )
}
