/** Parse a comma-separated URL param into a Set of ids. Server-safe. */
export function parseIdsParam(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

/**
 * Build a `?key=value` href from the given params, dropping empty values
 * and the keys listed in `drop`. Returns `"?"` when no params remain.
 */
export function hrefWith(
  params: Record<string, string | undefined>,
  drop: string[] = [],
): string {
  const dropSet = new Set(drop)
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && !dropSet.has(k)) qs.set(k, v)
  }
  const s = qs.toString()
  return s ? `?${s}` : "?"
}
