import type { Metadata } from "next"
import Link from "next/link"

import { TimerClient } from "@/components/timer/TimerClient"

export const metadata: Metadata = {
  title: "Free Interval Timer — Lipe Moves",
  description:
    "Free EMOM interval timer with a beep every minute. Set the minutes and your exercises, hit start, work the top of each minute.",
  alternates: { canonical: "https://lipemoves.com/timer" },
}

export default function PublicTimerPage() {
  return (
    <main className="dark min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-extrabold uppercase tracking-tight"
            aria-label="Lipe Moves"
          >
            Lipe<span className="text-[#39FF14]">Moves</span>
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 transition-colors hover:border-[#39FF14] hover:text-white"
          >
            Train with me →
          </Link>
        </header>

        <div className="mt-12 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Free tool
          </p>
          <h1 className="mt-4 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Interval <span className="text-[#39FF14]">timer.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/55">
            A countdown that beeps every minute — set the minutes, hit start,
            work the top of each minute and rest until the next beep.
          </p>
        </div>

        <div className="mt-12 flex-1">
          <TimerClient />
        </div>

        <footer className="mt-16 pb-4 text-center text-sm text-white/40">
          Yoga · Mobility · Kettlebell · Calisthenics —{" "}
          <Link href="/" className="text-[#39FF14] hover:underline">
            lipemoves.com
          </Link>
        </footer>
      </div>
    </main>
  )
}
