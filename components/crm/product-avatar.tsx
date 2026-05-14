import * as React from "react"

const PALETTE = [
  { bg: "#fbbf2422", fg: "#92400e" }, // amber
  { bg: "#fb718522", fg: "#9f1239" }, // rose
  { bg: "#a78bfa22", fg: "#5b21b6" }, // violet
  { bg: "#38bdf822", fg: "#075985" }, // sky
  { bg: "#34d39922", fg: "#065f46" }, // emerald
  { bg: "#f472b622", fg: "#9d174d" }, // pink
  { bg: "#84cc1622", fg: "#365314" }, // lime
  { bg: "#fb923c22", fg: "#9a3412" }, // orange
] as const

export function initialsForName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

export function colorForName(name: string): { bg: string; fg: string } {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function ProductAvatar({
  name,
  imageUrl,
  size = 40,
  className,
}: {
  name: string
  imageUrl: string | null | undefined
  size?: number
  className?: string
}) {
  const { bg, fg } = colorForName(name)
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-md object-cover ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-md font-semibold ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.max(11, Math.floor(size * 0.35)),
      }}
    >
      {initialsForName(name)}
    </div>
  )
}
