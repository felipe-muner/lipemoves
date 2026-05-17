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
    <span className="relative inline-flex h-10 w-16 shrink-0 items-center">
      {flag ? (
        <span
          className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-muted text-[1.5rem] leading-none"
          aria-hidden
        >
          {flag}
        </span>
      ) : null}
      <Avatar
        className={cn(
          "relative ml-auto h-10 w-10 shrink-0 ring-2 ring-background",
          className,
        )}
      >
        {image && <AvatarImage src={image} alt={name} />}
        <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
    </span>
  )
}
