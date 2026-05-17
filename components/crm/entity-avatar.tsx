import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Compact avatar for entity list rows — shows the user's image when present,
 * falls back to 2-letter initials with a subtle colored background.
 */
export function EntityAvatar({
  name,
  image,
  className,
  flag,
}: {
  name: string
  image?: string | null
  className?: string
  /** Flag emoji shown as a small badge in the bottom-right corner. */
  flag?: string | null
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <Avatar className={cn("h-10 w-10 shrink-0", className)}>
        {image && <AvatarImage src={image} alt={name} />}
        <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {flag ? (
        <span className="text-xl leading-none" aria-hidden>
          {flag}
        </span>
      ) : null}
    </span>
  )
}
