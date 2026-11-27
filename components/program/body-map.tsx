"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import mannequin from "@/public/programs/body-map/mannequin-front.jpg"

// Clickable body map for /program. Each area glows neon green (same look as
// the Open Hips demo clips) and leads to its program, or to WhatsApp while
// the program for that area is still a preview with a waitlist.
//
// Shapes are ellipses in the coordinates of the original 1792x2400 render
// (assets/body-map/mannequin-front-raw.jpeg). To add a program for an area,
// open it for sale, set `ready: true`.

const WA = "https://wa.me/5521984852802?text="

type Area = {
  id: string
  label: string
  program: string // program name
  blurb: string
  href: string // program page
  ready?: boolean // true = program is sold now; otherwise it's a preview + waitlist
  shapes: { cx: number; cy: number; rx: number; ry: number }[]
}

const AREAS: Area[] = [
  {
    id: "shoulders",
    label: "Neck & Shoulders",
    program: "Open Shoulders",
    href: "/program/shoulders",
    blurb: "Free up tight shoulders and a stiff neck.",
    shapes: [
      { cx: 893, cy: 520, rx: 80, ry: 70 },
      { cx: 667, cy: 640, rx: 95, ry: 115 },
      { cx: 1120, cy: 640, rx: 95, ry: 115 },
    ],
  },
  {
    id: "wrists",
    label: "Wrists & Hands",
    program: "Strong Wrists",
    href: "/program/wrists",
    blurb: "Strong, pain-free wrists for push-ups, handstands and yoga.",
    shapes: [
      { cx: 550, cy: 1215, rx: 52, ry: 80 },
      { cx: 1237, cy: 1215, rx: 52, ry: 80 },
    ],
  },
  {
    id: "core",
    label: "Core",
    program: "Solid Core",
    href: "/program/core",
    blurb: "A strong, steady middle for every move.",
    shapes: [{ cx: 893, cy: 860, rx: 165, ry: 210 }],
  },
  {
    id: "hips",
    label: "Hips",
    program: "Open Hips",
    blurb: "4-week coached program: three short sessions a week, a clear progression and video feedback.",
    href: "/hips",
    ready: true,
    shapes: [
      { cx: 893, cy: 1150, rx: 210, ry: 105 },
      { cx: 740, cy: 1190, rx: 55, ry: 80 },
      { cx: 1046, cy: 1190, rx: 55, ry: 80 },
    ],
  },
  {
    id: "legs",
    label: "Hamstrings & Legs",
    program: "Long Hamstrings",
    href: "/program/legs",
    blurb: "Longer hamstrings and stronger legs.",
    shapes: [
      { cx: 787, cy: 1400, rx: 105, ry: 150 },
      { cx: 1005, cy: 1400, rx: 105, ry: 150 },
    ],
  },
  {
    id: "knees",
    label: "Knees",
    program: "Strong Knees",
    href: "/program/knees",
    blurb: "Pain-free, resilient knees.",
    shapes: [
      { cx: 768, cy: 1625, rx: 72, ry: 75 },
      { cx: 1021, cy: 1625, rx: 72, ry: 75 },
    ],
  },
  {
    id: "ankles",
    label: "Ankles & Feet",
    program: "Mobile Ankles",
    href: "/program/ankles",
    blurb: "Mobile ankles for a deeper squat and better balance.",
    shapes: [
      { cx: 760, cy: 1960, rx: 75, ry: 120 },
      { cx: 1050, cy: 1960, rx: 75, ry: 120 },
    ],
  },
]

// Not visible from the front, so it only appears in the list below the body.
const BACK: Area = {
  id: "back",
  label: "Back & Spine",
  program: "Free Spine",
  href: "/program/back",
  blurb: "A mobile, strong spine and less back stiffness.",
  shapes: [],
}

const ALL = [...AREAS, BACK]

export function BodyMap() {
  const [hover, setHover] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const active = ALL.find((a) => a.id === selected) ?? null

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-[minmax(0,420px)_1fr]">
      <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-3xl">
        <Image
          src={mannequin}
          alt="Mannequin, front view. Tap a body area to see its program."
          priority
          placeholder="blur"
          sizes="(max-width: 768px) 100vw, 420px"
          className="h-auto w-full"
        />
        <svg
          viewBox="0 0 1792 2400"
          className="absolute inset-0 h-full w-full"
          role="group"
          aria-label="Body areas"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="28" />
            </filter>
          </defs>
          {AREAS.map((a) => {
            const on = hover === a.id || selected === a.id
            return (
              <g
                key={a.id}
                role="button"
                tabIndex={0}
                aria-label={a.ready ? `${a.label}: ${a.program}` : `${a.label}: ${a.program}, coming soon`}
                aria-pressed={selected === a.id}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
                onClick={() => setSelected(a.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelected(a.id)
                  }
                }}
              >
                {a.shapes.map((s, i) => (
                  <g key={i}>
                    {/* soft neon glow */}
                    <ellipse
                      {...s}
                      fill="#39ff88"
                      filter="url(#glow)"
                      style={{ mixBlendMode: "screen" }}
                      className={
                        on
                          ? "opacity-80 transition-opacity duration-200"
                          : a.ready
                            ? "animate-pulse opacity-35 transition-opacity duration-200"
                            : "opacity-0 transition-opacity duration-200"
                      }
                    />
                    {/* invisible hit area, a bit larger than the glow */}
                    <ellipse {...s} rx={s.rx * 1.1} ry={s.ry * 1.1} fill="transparent" />
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="space-y-6">
        <div aria-live="polite" className="min-h-[190px] rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {active ? (
            <AreaCard area={active} />
          ) : (
            <div className="text-white/60">
              <p className="text-lg text-white">Tap the body where you want to move better.</p>
              <p className="mt-2">
                Glowing green means the program is open now. The other areas open soon: see their plan and join
                the waitlist.
              </p>
            </div>
          )}
        </div>

        <ul className="flex flex-wrap gap-2">
          {ALL.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelected(a.id)}
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                className={[
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  selected === a.id
                    ? "border-[#39ff88] bg-[#39ff88]/15 text-white"
                    : a.ready
                      ? "border-[#39ff88]/60 text-white hover:bg-[#39ff88]/10"
                      : "border-white/15 text-white/70 hover:border-white/40 hover:text-white",
                ].join(" ")}
              >
                {a.label}
                {a.ready ? <span className="ml-2 text-[#39ff88]">●</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AreaCard({ area }: { area: Area }) {
  if (area.ready) {
    return (
      <div>
        <div className="text-xs tracking-widest text-[#39ff88]">{area.label.toUpperCase()} · PROGRAM READY</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{area.program}</h2>
        <p className="mt-2 text-white/70">{area.blurb}</p>
        <Link
          href={area.href}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#39ff88] px-5 py-3 font-semibold text-black transition hover:bg-[#5cff9f]"
        >
          See the program <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }
  const text = encodeURIComponent(`Hi Felipe, put me on the waitlist for ${area.program}`)
  return (
    <div>
      <div className="text-xs tracking-widest text-white/50">{area.label.toUpperCase()} · COMING SOON</div>
      <h2 className="mt-2 text-2xl font-semibold text-white">{area.program}</h2>
      <p className="mt-2 text-white/70">{area.blurb}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={area.href}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/85"
        >
          See the plan <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={`${WA}${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 font-semibold text-white transition hover:border-white/60"
        >
          Join the waitlist
        </a>
      </div>
    </div>
  )
}
