import type { Metadata } from "next"
import { BodyMap } from "@/components/program/body-map"

export const metadata: Metadata = {
  title: "Programs — pick the area you want to move better | Lipe Moves",
  description:
    "Tap the body area you want to work on (hips, shoulders, back, legs and more) and go straight to its program.",
}

export default function ProgramsPage() {
  return (
    <main className="min-h-screen px-4 py-12 text-white md:py-20" style={{ backgroundColor: "#0b0d0c" }}>
      <div className="mx-auto mb-10 max-w-5xl text-center md:mb-14">
        <div className="text-xs tracking-[0.3em] text-[#39ff88]">LIPE MOVES PROGRAMS</div>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Where do you want to move better?</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/60">
          Tap a body area to see its program.
        </p>
      </div>
      <BodyMap />
    </main>
  )
}
