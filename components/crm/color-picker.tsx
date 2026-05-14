"use client"

import { Check } from "lucide-react"

/** Curated palette that reads well on the cream/white CRM background. */
export const LOCATION_PALETTE = [
  { name: "Amber", hex: "#fbbf24" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Rose", hex: "#fb7185" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Violet", hex: "#a78bfa" },
  { name: "Indigo", hex: "#818cf8" },
  { name: "Sky", hex: "#38bdf8" },
  { name: "Teal", hex: "#2dd4bf" },
  { name: "Emerald", hex: "#34d399" },
  { name: "Lime", hex: "#84cc16" },
] as const

export function ColorPicker({
  value,
  onChange,
  name,
}: {
  value: string
  onChange: (hex: string) => void
  /** Optional hidden input name for plain-form submission. */
  name?: string
}) {
  return (
    <div>
      {name && <input type="hidden" name={name} value={value} />}
      <div className="flex flex-wrap gap-2">
        {LOCATION_PALETTE.map((c) => {
          const selected = c.hex.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => onChange(c.hex)}
              className="relative h-9 w-9 rounded-md ring-offset-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background: c.hex,
                boxShadow: selected
                  ? `0 0 0 2px white, 0 0 0 4px ${c.hex}`
                  : "0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              {selected && (
                <Check
                  className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                  strokeWidth={3}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
