"use client"

import * as React from "react"

// The CarouselRenderer lays out fixed 1080px-wide slides (built for a 1080×1350
// Instagram export). To read them on the site we scale that fixed width down to
// the available width with CSS `zoom`, which — unlike `transform: scale()` —
// reflows the layout height so there's no dead space below the slides.
const SLIDE_W = 1080

export function CarouselWebView({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = React.useState(1)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const compute = () => setZoom(Math.min(1, el.clientWidth / SLIDE_W))
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full">
      <div style={{ width: SLIDE_W, zoom, marginInline: "auto" }}>{children}</div>
    </div>
  )
}
