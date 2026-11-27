"use client"

import * as React from "react"
import { ClipPlayer } from "@/components/program/clip-player"

/**
 * An exercise can have two demos: Felipe doing it (how to move) and the
 * mannequin "muscle map" (which muscles work). Shows Felipe's video first and
 * a small switch to flip between the two. With only one of them, it just
 * plays that one with a matching label.
 */
export function DualClip({
  coach,
  muscles,
  label,
}: {
  coach?: string
  muscles?: string
  label: string
}) {
  const [mode, setMode] = React.useState<"coach" | "muscles">(coach ? "coach" : "muscles")

  if (coach && muscles) {
    const src = mode === "coach" ? coach : muscles
    return (
      <>
        <ClipPlayer key={src} src={src} label={label} badge={null} />
        <div
          role="tablist"
          aria-label={`${label} demo`}
          className="absolute left-2 top-2 z-10 flex rounded-full bg-black/60 p-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] backdrop-blur"
        >
          {(
            [
              ["coach", "Felipe"],
              ["muscles", "Muscles"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                mode === value ? "bg-[#39FF14] text-black" : "text-white/75 hover:text-white"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </>
    )
  }

  if (coach) return <ClipPlayer src={coach} label={label} badge="Felipe" />
  if (muscles) return <ClipPlayer src={muscles} label={label} badge="Muscle map" />
  return null
}
