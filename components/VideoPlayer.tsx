"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

export function VideoPlayer({
  src,
  poster,
}: {
  src: string
  poster?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Safari (and iOS) play HLS natively.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => hls.destroy()
    }
  }, [src])

  return (
    <video
      ref={ref}
      controls
      playsInline
      poster={poster}
      className="aspect-video w-full rounded-xl bg-black"
    />
  )
}
