"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export interface MotionClip {
  src: string
  poster: string
  tag: string
  label: string
}

/**
 * "The practice, in motion" — a pinned section whose row of vertical (9:16)
 * movement clips slides sideways as the page scrolls down, reading as a wall of
 * Reels. Travel is measured from the real track width so the last card lands
 * flush. Clips only play while near the viewport (IntersectionObserver).
 */
export function MotionShowcase({
  clips,
  fontClass,
}: {
  clips: MotionClip[]
  fontClass: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(0)

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      setTravel(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [clips.length])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel])

  return (
    <section
      ref={sectionRef}
      id="in-motion"
      aria-label="The practice in motion"
      style={{ height: `calc(100vh + ${travel}px)` }}
      className="relative scroll-mt-0"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-10 sm:px-10">
          <span className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">
            The practice · in motion
          </span>
          <h2 className={`${fontClass} mt-3 text-4xl uppercase leading-[0.9] sm:text-6xl`}>
            This is what it<br />looks like.
          </h2>
        </div>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex items-center gap-4 px-6 pt-24 sm:gap-6 sm:px-10"
        >
          {clips.map((clip, i) => (
            <MotionCard key={clip.src} clip={clip} index={i} fontClass={fontClass} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function MotionCard({
  clip,
  index,
  fontClass,
}: {
  clip: MotionClip
  index: number
  fontClass: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { root: null, rootMargin: "150px", threshold: 0.1 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  return (
    <div className="relative w-[62vw] shrink-0 overflow-hidden rounded-3xl bg-[#131210] ring-1 ring-white/10 sm:w-[34vw] lg:w-[22vw]">
      <video
        ref={videoRef}
        src={clip.src}
        poster={clip.poster}
        muted
        loop
        playsInline
        preload="none"
        className="block aspect-[9/16] w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5">
        <div>
          <span className="text-[0.6rem] uppercase tracking-[0.25em] text-[#39FF14]">
            {String(index + 1).padStart(2, "0")} · {clip.tag}
          </span>
          <p className={`${fontClass} mt-1 text-xl uppercase leading-none text-white`}>
            {clip.label}
          </p>
        </div>
      </div>
    </div>
  )
}
