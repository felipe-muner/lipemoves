import Link from "next/link"
import { Anton } from "next/font/google"
import { ArrowLeft, ArrowRight, Play } from "lucide-react"
import type { Exercise, WorkoutDay } from "@/content/programs/hips"
import type { AreaProgram } from "@/content/programs/areas"
import { exerciseSlug } from "@/content/programs/hips-clips"
import { PROGRAM_CLIPS } from "@/content/programs/program-clips"
import { DualClip } from "@/components/program/dual-clip"
import { COACH_CLIPS } from "@/content/programs/coach-clips"
import { Button } from "@/components/ui/button"

// Public preview of a body-area program (everything except Open Hips).
// Same look as /hips/program, plus a waitlist call to action, since these
// programs are drafts: demo clips fill in as they are generated.

const anton = Anton({ subsets: ["latin"], weight: "400" })

const WEEKS: Record<number, { name: string; cue: string }> = {
  1: { name: "Groove", cue: "Learn the positions with an easy range." },
  2: { name: "Open", cue: "More range and one-side work." },
  3: { name: "End range", cue: "Strength where you are tightest." },
  4: { name: "Own it", cue: "Your deepest, strongest positions." },
}

const pad = (n: number) => String(n).padStart(2, "0")

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
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">{label}</p>
    </div>
  )
}

function ExerciseCard({ ex, total, area }: { ex: Exercise; total: number; area: AreaProgram }) {
  const slug = exerciseSlug(ex.name)
  const clip = PROGRAM_CLIPS[area.program.slug]?.[slug]
  const coach = COACH_CLIPS[area.program.slug]?.[slug]
  const detail = area.details[slug]
  const d = dose(ex)

  return (
    <li className="flex overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] transition-colors hover:border-[#39FF14]/30">
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 p-5 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#39FF14]">
            Exercise {pad(ex.n)} <span className="text-white/30">/ {pad(total)}</span>
          </p>
          <h4 className={`${anton.className} mt-3 text-3xl uppercase leading-[0.92] tracking-tight text-white sm:text-5xl`}>
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
                <span className="mt-0.5 text-xs font-semibold tabular-nums text-[#39FF14]">{pad(i + 1)}</span>
                <span>{cue}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="flex divide-x divide-white/10 border-t border-white/10 pt-5">
          <Stat value={String(ex.sets)} label="Sets" />
          <Stat value={d.value} unit={d.unit} label={d.label} />
        </div>
      </div>

      <div className="relative w-[42%] shrink-0 self-stretch bg-black sm:w-[40%]">
        <div className="aspect-[9/16] w-full" aria-hidden="true" />
        {clip || coach ? (
          <DualClip coach={coach} muscles={clip} label={ex.name} />
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
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0f0f0f] to-transparent" />
      </div>
    </li>
  )
}

function DayBlock({ day, area }: { day: WorkoutDay; area: AreaProgram }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
        <h3 className={`${anton.className} text-2xl uppercase tracking-tight text-white`}>Day {day.day}</h3>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
          {day.exercises.length} exercises
        </p>
      </div>
      <ol className="mt-5 space-y-5">
        {day.exercises.map((ex) => (
          <ExerciseCard key={ex.n} ex={ex} total={day.exercises.length} area={area} />
        ))}
      </ol>
    </div>
  )
}

export function AreaProgramPage({ area }: { area: AreaProgram }) {
  const { program } = area
  const wa = `https://wa.me/5521984852802?text=${encodeURIComponent(
    `Hi Felipe, put me on the waitlist for ${program.title}`
  )}`
  const weeks = [1, 2, 3, 4].map((week) => ({
    week,
    days: program.days.filter((d) => d.week === week),
  }))

  return (
    <main className="min-h-screen text-white antialiased" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-6">
        <Link href="/program" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All areas
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#39FF14]">
          {area.area} · Coming soon
        </p>
        <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight">{program.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          {area.promise} Three sessions a week for four weeks, with video feedback from Felipe.
        </p>

        <div className="mt-8 rounded-3xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#39FF14]">Join the first group</p>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            This program opens soon. Message me and you get a spot in the first group, at the founding price.
          </p>
          <Button asChild variant="lime" size="pill" className="mt-5 w-full">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              Put me on the waitlist <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <nav
          aria-label="Weeks"
          className="sticky top-0 z-10 -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6"
          style={{ backgroundColor: "rgba(10,10,10,0.95)" }}
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
                <DayBlock key={`${day.week}-${day.day}`} day={day} area={area} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
