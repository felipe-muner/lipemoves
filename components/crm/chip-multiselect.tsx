"use client"

import { Check } from "lucide-react"

export interface ChipOption {
  id: string
  name: string
  color?: string
}

export function ChipMultiSelect({
  options,
  value,
  onChange,
  placeholder = "None selected",
}: {
  options: ChipOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const isSelected = (id: string) => value.includes(id)
  function toggle(id: string) {
    onChange(isSelected(id) ? value.filter((v) => v !== id) : [...value, id])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.length === 0 && (
        <span className="text-xs text-muted-foreground">{placeholder}</span>
      )}
      {options.map((o) => {
        const on = isSelected(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition"
            style={{
              borderColor: on && o.color ? o.color : on ? "#0a0a0a" : "rgba(0,0,0,0.15)",
              background: on
                ? o.color
                  ? `${o.color}1f`
                  : "rgba(0,0,0,0.06)"
                : "transparent",
              color: on && o.color ? o.color : "inherit",
            }}
          >
            {o.color && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: o.color }}
              />
            )}
            {o.name}
            {on && <Check className="h-3 w-3" />}
          </button>
        )
      })}
    </div>
  )
}
