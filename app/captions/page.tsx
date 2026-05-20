import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { Metadata } from "next"

import { CopyButton } from "./_components/CopyButton"

export const metadata: Metadata = {
  title: "Captions — Lipe Moves",
  description: "IG/TikTok/YouTube caption library",
  robots: { index: false, follow: false },
}

type Pattern = "movement" | "protocol"

interface Entry {
  pattern: Pattern
  number: number
  title: string
  body: string
}

function parseFile(pattern: Pattern): Entry[] {
  const text = readFileSync(resolve(`captions/${pattern}.md`), "utf8")
  const entries: Entry[] = []
  const re = /^## (\d+) — (.+?)$([\s\S]*?)(?=^## |$(?![\r\n]))/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    entries.push({
      pattern,
      number: Number(m[1]),
      title: m[2].trim(),
      body: m[3].trim(),
    })
  }
  return entries
}

const PATTERN_LABELS: Record<Pattern, { label: string; description: string }> = {
  movement: {
    label: "Movement & Philosophy",
    description: "Short, mindful, English-leaning. Hook + insight + question.",
  },
  protocol: {
    label: "Workout Protocols",
    description: "PT-leaning. Hook → GUIA call-to-action → detailed sets → mindset close.",
  },
}

export default function CaptionsPage() {
  const movement = parseFile("movement")
  const protocol = parseFile("protocol")

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Library
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Tap <span className="text-emerald-400">Copy</span> on any caption — paste
          into Instagram, TikTok, or YouTube.
        </p>
      </header>

      {([
        { pattern: "movement" as const, entries: movement },
        { pattern: "protocol" as const, entries: protocol },
      ]).map(({ pattern, entries }) => (
        <section key={pattern} className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {PATTERN_LABELS[pattern].label}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {PATTERN_LABELS[pattern].description}
            </p>
          </div>

          <ul className="space-y-4">
            {entries.map((e) => (
              <li
                key={`${pattern}-${e.number}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                      #{e.number}
                    </div>
                    <div className="font-medium">{e.title}</div>
                  </div>
                  <CopyButton text={e.body} />
                </div>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-300">
                  {e.body}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
