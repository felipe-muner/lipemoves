"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * Page-wide Lenis smooth scroll for the landing page — the weighted, gliding
 * scroll the reference sites (lenis.dev) use. Drives the native scroll position
 * so Framer Motion's useScroll (the "in motion" showcase) composes on top of it.
 * Also routes same-page anchor clicks through Lenis so the nav scrolls smoothly.
 * Disabled under prefers-reduced-motion.
 */
export function LenisScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.4,
    })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element).closest?.('a[href^="#"]')
      const href = link?.getAttribute("href")
      if (!href || href === "#") return
      const target = document.getElementById(href.slice(1))
      if (!target) return
      event.preventDefault()
      lenis.scrollTo(target, { offset: -72 })
      window.history.pushState(null, "", href)
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
