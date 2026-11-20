export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { Anton } from "next/font/google"
import { ArrowRight, Lock, Play } from "lucide-react"
import { hips } from "@/content/programs/hips"
import type { Exercise, WorkoutDay } from "@/content/programs/hips"
import { HIPS_CLIPS, exerciseSlug } from "@/content/programs/hips-clips"
import { HIPS_DETAILS } from "@/content/programs/hips-details"
import { HIPS_COOKIE, hasHipsAccess } from "@/lib/hips-access"
import { ClipPlayer } from "@/components/program/clip-player"
import { Button } from "@/components/ui/button"
import { unlockHips } from "./actions"

// Same condensed display face as the landing page headlines.
const anton = Anton({ subsets: ["latin"], weight: "400" })

export const metadata: Metadata = {
  title: "Open Hips — your program | Lipe Moves",
  robots: { index: false, follow: false },
}

const WA_FEEDBACK =
  "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20here%20is%20my%20Open%20Hips%20video%20for%20this%20week"

const WEEKS: Record<number, { name: string; cue: string }> = {
  1: { name: "Groove", cue: "Learn the positions. 30-second holds, easy range." },
  2: { name: "Open", cue: "More range and one-leg work. 40-second holds." },
  3: { name: "End range", cue: "Strength where you are tightest. 45-second holds." },
  4: { name: "Own it", cue: "Deepest positions, held for 60 seconds." },
}

const pad = (n: number) => String(n).padStart(2, "0")

/** "30 Seconds" -> 30 s hold · 10 -> 10 reps · "10 Each Side" -> 10 reps each side */
function dose(ex: Exercise): { value: string; unit: string; label: string } {
  if (ex.time) {
    const m = ex.time.match(/^(\d+)\s*(.*)$/)
    return {
      value: m ? m[1] : ex.time,
      unit: m && /^sec/i.test(m[2]) ? "s" : m ? m[2].toLowerCase() : "",
      label: "Hold",
    }
  }
  const m = String(ex.reps ?? "").match(/^(\d+)\s*(.*)$/)
  return {
    value: m ? m[1] : String(ex.reps ?? ""),
    unit: "",
    label: m && m[2] ? `Reps ${m[2].toLowerCase()}` : "Reps",
  }
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="px-4 first:pl-0">
      <p className={`${anton.className} text-4xl leading-none text-white sm:text-5xl`}>
        {value}
        {unit ? <span className="ml-1 text-xl text-white/50 sm:text-2xl">{unit}</span> : null}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
        {label}
      </p>
    </div>
  )
}

function ExerciseCard({ ex, total }: { ex: Exercise; total: number }) {
  const slug = exerciseSlug(ex.name)
  const clip = HIPS_CLIPS[slug]
  const detail = HIPS_DETAILS[slug]
  const d = dose(ex)

  return (
    <li className="flex overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] transition-colors hover:border-[#39FF14]/30">
      {/* Left: what to do */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 p-5 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#39FF14]">
            Exercise {pad(ex.n)} <span className="text-white/30">/ {pad(total)}</span>
          </p>
          <h4
            className={`${anton.className} mt-3 text-3xl uppercase leading-[0.92] tracking-tight text-white sm:text-5xl`}
          >
            {ex.name}
          </h4>
          {detail ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Targets">
              {detail.targets.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70"
                >
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {detail ? (
          <ol className="space-y-2.5 text-sm leading-relaxed text-white/65">
            {detail.cues.map((cue, i) => (
              <li key={cue} className="flex gap-3">
                <span className="mt-0.5 text-xs font-semibold tabular-nums text-[#39FF14]">
                  {pad(i + 1)}
                </span>
                <span>{cue}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <div>
          <div className="flex divide-x divide-white/10 border-t border-white/10 pt-5">
            <Stat value={String(ex.sets)} label="Sets" />
            <Stat value={d.value} unit={d.unit} label={d.label} />
          </div>
          {ex.youtube ? (
            <a
              href={ex.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-[#39FF14] underline-offset-4 hover:underline"
            >
              Watch on YouTube
            </a>
          ) : null}
        </div>
      </div>

      {/* Right: the demo clip. The sizer keeps a 9:16 minimum; the clip fills
          the column if the text side is taller. */}
      <div className="relative w-[42%] shrink-0 self-stretch bg-black sm:w-[40%]">
        <div className="aspect-[9/16] w-full" aria-hidden="true" />
        {clip ? (
          <ClipPlayer src={clip} label={ex.name} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_bottom_right,rgba(57,255,20,0.10),transparent_60%)] px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/35">
              <Play className="ml-0.5 h-4 w-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-white/30">
              Video coming soon
            </span>
          </div>
        )}
        {/* Soft edge so the clip melts into the card instead of ending in a hard line */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0f0f0f] to-transparent" />
      </div>
    </li>
  )
}

function DayBlock({ day }: { day: WorkoutDay }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
        <h3 className={`${anton.className} text-2xl uppercase tracking-tight text-white`}>
          Day {day.day}
        </h3>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
          {day.exercises.length} exercises
        </p>
      </div>
      <ol className="mt-5 space-y-5">
        {day.exercises.map((ex) => (
          <ExerciseCard key={ex.n} ex={ex} total={day.exercises.length} />
        ))}
      </ol>
    </div>
  )
}

function Locked({ error }: { error: boolean }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Lock className="h-8 w-8 text-[#39FF14]" />
        <h1 className="mt-6 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight">
          Open Hips <span className="text-[#39FF14]">program</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          This page is for people in the program. Enter the access code I sent
          you on WhatsApp.
        </p>
        <form action={unlockHips} className="mt-8 flex flex-col gap-3">
          <label htmlFor="code" className="sr-only">
            Access code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Access code"
            className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-base text-white placeholder:text-white/40 outline-none focus-visible:border-[#39FF14]"
          />
          <Button type="submit" variant="lime" size="pill">
            Open my program <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-400">
            That code didn&apos;t work. Check it and try again, or message me.
          </p>
        ) : null}
        <p className="mt-10 text-sm text-white/45">
          Not in the program yet?{" "}
          <Link href="/hips" className="text-[#39FF14] underline-offset-4 hover:underline">
            See what it is
          </Link>
        </p>
      </div>
    </main>
  )
}

export default async function HipsProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [jar, params] = await Promise.all([cookies(), searchParams])

  if (!hasHipsAccess(jar.get(HIPS_COOKIE)?.value)) {
    return <Locked error={params.error === "1"} />
  }

  const weeks = [1, 2, 3, 4].map((week) => ({
    week,
    days: hips.days.filter((d) => d.week === week),
  }))

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">Your program</p>
        <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight">
          Open Hips
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Three sessions a week for four weeks. Do the days in order, with at
          least one rest day between sessions.
        </p>

        <div className="mt-8 rounded-3xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#39FF14]">Every week</p>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Film one or two exercises from the side and send them to me. I
            reply with what to fix. Film your hip test on day 1 and again on
            day 28.
          </p>
          <Button asChild variant="lime" size="pill" className="mt-5 w-full">
            <a href={WA_FEEDBACK} target="_blank" rel="noopener noreferrer">
              Send my video on WhatsApp <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <nav
          aria-label="Weeks"
          className="sticky top-0 z-10 -mx-5 mt-10 flex gap-2 overflow-x-auto bg-[#0a0a0a]/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6"
        >
          {weeks.map(({ week }) => (
            <a
              key={week}
              href={`#week-${week}`}
              className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-[#39FF14] hover:text-white"
            >
              Week {week}
            </a>
          ))}
        </nav>

        {weeks.map(({ week, days }) => (
          <section key={week} id={`week-${week}`} className="scroll-mt-20 pt-10">
            <p className="text-xs tracking-[0.3em] text-[#39FF14]">WEEK {week}</p>
            <h2 className={`${anton.className} mt-2 text-5xl uppercase leading-none tracking-tight sm:text-6xl`}>
              {WEEKS[week].name}
            </h2>
            <p className="mt-2 text-sm text-white/55">{WEEKS[week].cue}</p>
            <div className="mt-8 space-y-12">
              {days.map((day) => (
                <DayBlock key={`${day.week}-${day.day}`} day={day} />
              ))}
            </div>
          </section>
        ))}

        <p className="mt-16 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Lipe Moves · This page is for program members. Please don&apos;t share it.
        </p>
      </div>
    </main>
  )
}
