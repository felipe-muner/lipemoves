"use client"

import { useEffect, useRef, useCallback } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  videoId: string
  title: string
}

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveProgress = useCallback(async (seconds: number, completed: boolean) => {
    await fetch(`/api/videos/${videoId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        progressSeconds: Math.floor(seconds),
        completed,
      }),
    })
  }, [videoId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let mounted = true

    async function loadVideo() {
      const res = await fetch(`/api/videos/${videoId}/stream`)
      const data = await res.json()

      if (!mounted || !data.url) return

      if (Hls.isSupported()) {
        const hls = new Hls()
        hlsRef.current = hls
        hls.loadSource(data.url)
        hls.attachMedia(video!)
      } else if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = data.url
      }

      // Restore progress
      const progressRes = await fetch(`/api/videos/${videoId}/progress`)
      const progressData = await progressRes.json()

      if (mounted && progressData.progressSeconds > 0) {
        video!.currentTime = progressData.progressSeconds
      }
    }

    loadVideo()

    // Save progress every 10 seconds
    progressIntervalRef.current = setInterval(() => {
      if (video && !video.paused && video.currentTime > 0) {
        const isCompleted = video.duration > 0 && video.currentTime / video.duration > 0.9
        saveProgress(video.currentTime, isCompleted)
      }
    }, 10000)

    return () => {
      mounted = false
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      // Save final progress
      if (video && video.currentTime > 0) {
        const isCompleted = video.duration > 0 && video.currentTime / video.duration > 0.9
        saveProgress(video.currentTime, isCompleted)
      }
    }
  }, [videoId, saveProgress])

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        className="aspect-video w-full"
        title={title}
      />
    </div>
  )
}
