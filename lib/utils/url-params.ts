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
