import Image from "next/image"
import Link from "next/link"
import type { Video } from "@/lib/types/database"

interface VideoCardProps {
  video: Video
  progress?: number
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function VideoCard({ video, progress }: VideoCardProps) {
  const progressPercent =
    progress && video.durationSeconds
      ? Math.min((progress / video.durationSeconds) * 100, 100)
      : 0

  return (
    <Link
      href={`/videos/${video.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      <div className="relative aspect-video bg-muted">
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        {video.durationSeconds && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
        {video.isFree && (
          <span className="absolute top-2 left-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Gr&aacute;tis
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}
        {progressPercent > 0 && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
