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
}: {
  name: string
  image?: string | null
  className?: string
}) {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
