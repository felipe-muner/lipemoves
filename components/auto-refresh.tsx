"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

/**
 * Mimics React Query's refetchOnWindowFocus + refetchInterval for App Router.
 *
 * - Refreshes server components when the tab becomes visible or regains focus
 *   (so swapping from phone to desktop instantly shows latest data).
 * - While the tab is visible, polls every `intervalMs` so two open tabs stay
 *   in sync even without focus changes.
 * - Stops polling when the tab is hidden (saves DB hits + battery).
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter()

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (timer) return
      timer = setInterval(() => router.refresh(), intervalMs)
    }
    const stopPolling = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh()
        startPolling()
      } else {
        stopPolling()
      }
    }
    const handleFocus = () => router.refresh()

    handleVisibility()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleFocus)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleFocus)
    }
  }, [router, intervalMs])

  return null
}
