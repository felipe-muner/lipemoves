import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { Metadata } from "next"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { CopyButton } from "./_components/CopyButton"

export const metadata: Metadata = {
  title: "Captions — Lipe Moves",
  description: "IG/TikTok/YouTube caption + hashtag library",
  robots: { index: false, follow: false },
}

type Source =
  | "movement"
  | "protocol"
  | "hashtags-kettlebell"
  | "hashtags-yoga"

interface Entry {
  source: Source
  number: number
  title: string
  body: string
}

function parseFile(source: Source): Entry[] {
  const text = readFileSync(resolve(`captions/${source}.md`), "utf8")
  const entries: Entry[] = []
  const re = /^## (\d+) — (.+?)$([\s\S]*?)(?=^## |$(?![\r\n]))/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    entries.push({
      source,
      number: Number(m[1]),
      title: m[2].trim(),
      body: m[3].trim(),
    })
  }
  return entries
}

const TABS: { value: Source; label: string; description: string }[] = [
  {
    value: "movement",
    label: "Movement",
    description: "Short, mindful flow-style captions.",
  },
  {
    value: "protocol",
    label: "Protocols",
    description: "Workout sets with GUIA call-to-action.",
  },
  {
    value: "hashtags-kettlebell",
    label: "KB hashtags",
    description: "10-hashtag sets for kettlebell posts.",
  },
  {
    value: "hashtags-yoga",
    label: "Yoga hashtags",
    description: "10-hashtag sets for yoga posts.",
  },
]

export default function CaptionsPage() {
  const data = Object.fromEntries(
    TABS.map((t) => [t.value, parseFile(t.value)]),
  ) as Record<Source, Entry[]>

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Library
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap <span className="text-emerald-400">Copy</span> on any block — paste
          into Instagram, TikTok, or YouTube.
        </p>
      </header>

      <Tabs defaultValue="movement" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            <p className="mb-4 text-xs text-muted-foreground">{t.description}</p>
            <ul className="space-y-4">
              {data[t.value].map((e) => (
                <li
                  key={`${e.source}-${e.number}`}
                  className="rounded-lg border bg-card p-4 sm:p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        #{e.number}
                      </div>
                      <div className="font-medium">{e.title}</div>
                    </div>
                    <CopyButton text={e.body} />
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/80">
                    {e.body}
                  </pre>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
