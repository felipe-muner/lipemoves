import type { Metadata } from "next"
import fs from "node:fs"
import path from "node:path"
import Link from "next/link"
import { ArrowLeft, Camera, ExternalLink } from "lucide-react"
import { HIPS_CLIPS } from "@/content/programs/hips-clips"
import { PROGRAM_CLIPS } from "@/content/programs/program-clips"
import { AREA_PROGRAMS } from "@/content/programs/areas"

// Felipe's private shot list: every exercise of every program, with the
// mannequin demo clip (when it exists) looping like a GIF, the camera angle,
// the start position and the movement, so he can film himself doing the same.
// Built from the clip queues in assets/glossary/<program>-queue.json.

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Shot list — film every exercise | Lipe Moves",
  robots: { index: false, follow: false },
}

type QueueClip = {
  n: number
  slug: string
  name: string
  view: string
  start: string
  motion: string
  status: string
}

const TITLES: Record<string, string> = {
  hips: "Open Hips",
  ...Object.fromEntries(Object.entries(AREA_PROGRAMS).map(([k, v]) => [k, v.program.title])),
}

function loadQueues() {
  const dir = path.join(process.cwd(), "assets", "glossary")
  const order: string[] = JSON.parse(fs.readFileSync(path.join(dir, "queues.json"), "utf8")).order
  return order
    .filter((p) => fs.existsSync(path.join(dir, `${p}-queue.json`)))
    .map((p) => {
      const q = JSON.parse(fs.readFileSync(path.join(dir, `${p}-queue.json`), "utf8"))
      return { program: p, clips: q.clips as QueueClip[] }
    })
}

function clipFor(program: string, slug: string): string | undefined {
  return program === "hips" ? HIPS_CLIPS[slug] : PROGRAM_CLIPS[program]?.[slug]
}

// The queue text is written for the video AI ("He starts already in this
// position: ..."). Make it read as a direct filming cue.
const cue = (s: string) => s.replace(/\bhe\b/gi, "you").replace(/\bhis\b/gi, "your").replace(/\bhim\b/gi, "you")

const angle = (view: string) => view.replace(/ view/i, "")

export default function ShotListPage() {
  const queues = loadQueues()
  const total = queues.reduce((n, q) => n + q.clips.length, 0)
  const withClip = queues.reduce((n, q) => n + q.clips.filter((c) => clipFor(q.program, c.slug)).length, 0)

  return (
    <main className="min-h-screen text-white antialiased" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-6">
        <Link href="/program" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All areas
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#39FF14]">Private · for Felipe</p>
        <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight">Shot list</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
          Every exercise in every program ({total} total, {withClip} with a demo clip). Copy the pose and the
          movement, film about 10 seconds with 3 slow reps, then hold still.
        </p>

        <div className="mt-8 rounded-3xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-6 text-sm leading-relaxed text-white/75">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#39FF14]">
            <Camera className="h-4 w-4" /> Same setup for every clip
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>iPhone vertical (9:16), 4K 30 fps, HDR video off, 1× lens, on the tripod at hip height.</li>
            <li>Same room, same light, same outfit for all clips so the program looks consistent.</li>
            <li>Whole body in frame with space around you. Use the camera angle shown on each card.</li>
            <li>Lock focus and exposure (press and hold on your body), then start 2 s before the first rep.</li>
            <li>AirDrop to the Mac and name the file like the slug under the title, e.g. arm-circles.mov.</li>
          </ul>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Programs">
          {queues.map((q) => (
            <a
              key={q.program}
              href={`#${q.program}`}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-[#39FF14] hover:text-white"
            >
              {TITLES[q.program] ?? q.program} <span className="text-white/40">· {q.clips.length}</span>
            </a>
          ))}
        </nav>

        {queues.map((q) => (
          <section key={q.program} id={q.program} className="scroll-mt-6 pt-14">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight">{TITLES[q.program] ?? q.program}</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {q.clips.map((c) => {
                const clip = clipFor(q.program, c.slug)
                const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${c.name} exercise`)}`
                return (
                  <li key={c.slug} className="flex overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="relative w-[38%] shrink-0 bg-black">
                      <div className="aspect-[9/16] w-full" aria-hidden="true" />
                      {clip ? (
                        <video
                          src={clip}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={`${c.name} demo`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <a
                          href={yt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-white/40 hover:text-white"
                        >
                          <ExternalLink className="h-5 w-5" />
                          No clip yet
                          <span className="normal-case tracking-normal text-[#39FF14]">See examples on YouTube</span>
                        </a>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#39FF14]">
                        {String(c.n).padStart(2, "0")} · {angle(c.view)} angle
                      </p>
                      <h3 className="mt-2 text-xl font-bold uppercase leading-tight">{c.name}</h3>
                      <p className="mt-1 font-mono text-[11px] text-white/35">{c.slug}</p>
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Start</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/75">{cue(c.start)}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Move</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/75">{cue(c.motion)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </main>
  )
}
