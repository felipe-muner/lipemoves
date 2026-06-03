import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { hasActiveSubscription } from "@/lib/stripe/subscription"
import { getSignedVideoUrl, getThumbnailUrl } from "@/lib/bunny"
import { VideoPlayer } from "@/components/VideoPlayer"

export const dynamic = "force-dynamic"

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  const userId = session!.user.id

  const [video] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.slug, slug), eq(videos.isPublished, true)))
    .limit(1)

  if (!video) notFound()

  // Gate: paid videos require an active membership.
  if (!video.isFree) {
    const subscribed = await hasActiveSubscription(userId)
    if (!subscribed) redirect("/pricing")
  }

  const src = getSignedVideoUrl({ videoId: video.bunnyVideoId })
  const poster = getThumbnailUrl(video.bunnyVideoId)

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/videos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <div className="mt-4">
        <VideoPlayer src={src} poster={poster} />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight">{video.title}</h1>
      {video.description ? (
        <p className="mt-2 leading-relaxed text-muted-foreground">
          {video.description}
        </p>
      ) : null}
    </main>
  )
}
