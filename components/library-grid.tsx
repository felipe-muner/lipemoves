"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, Play, Search } from "lucide-react"

export interface LibraryVideo {
  slug: string
  title: string
  thumbnailUrl: string
  tags: string[]
  isFree: boolean
  locked: boolean
}

export function LibraryGrid({ videos }: { videos: LibraryVideo[] }) {
  const [query, setQuery] = React.useState("")
  const [activeTag, setActiveTag] = React.useState<string | null>(null)

  const allTags = React.useMemo(
    () => [...new Set(videos.flatMap((v) => v.tags))].sort(),
    [videos],
  )

  const q = query.trim().toLowerCase()
  const filtered = videos.filter((v) => {
    if (activeTag && !v.tags.includes(activeTag)) return false
    if (!q) return true
    return (
      v.title.toLowerCase().includes(q) ||
      v.tags.some((t) => t.includes(q))
    )
  })

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flows…"
            className="h-11 w-full rounded-full border border-white/15 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#39FF14]/60"
          />
        </div>
        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = activeTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className={
                    active
                      ? "rounded-full bg-[#39FF14] px-4 py-1.5 text-xs font-semibold text-black"
                      : "rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  }
                >
                  {tag}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-sm text-white/50">
          {videos.length === 0
            ? "No videos published yet — check back soon."
            : "Nothing matches — try another tag or search."}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((v) => {
            const inner = (
              <>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/10">
                  <Image
                    src={v.thumbnailUrl}
                    alt={v.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    {v.locked ? (
                      <Lock className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-7 w-7 text-white" fill="white" />
                    )}
                  </div>
                  {v.isFree ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#39FF14] px-2 py-0.5 text-[10px] font-bold text-black">
                      FREE
                    </span>
                  ) : null}
                  {v.locked ? (
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5">
                      <Lock className="h-3 w-3 text-white" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium">
                  {v.title}
                </p>
                {v.tags.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {v.tags.join(" · ")}
                  </p>
                ) : null}
              </>
            )
            return (
              <Link
                key={v.slug}
                href={v.locked ? "/pricing" : `/videos/${v.slug}`}
                title={v.locked ? "Subscribe to unlock" : v.title}
                className="group block"
              >
                {inner}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
