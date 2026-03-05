import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { hasActiveSubscription } from "@/lib/stripe/subscription"
import VideoPlayer from "@/components/video/VideoPlayer"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.slug, slug))
    .limit(1)

  if (!video || !video.isPublished) {
    notFound()
  }

  // Check subscription for paid videos
  if (!video.isFree) {
    const hasSubscription = await hasActiveSubscription(session.user.id)
    if (!hasSubscription) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-center">
          <h1 className="font-heading text-3xl">Assinatura Necess&aacute;ria</h1>
          <p className="mt-4 text-muted-foreground">
            Este v&iacute;deo &eacute; exclusivo para assinantes. Escolha um plano para assistir.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ver Planos
          </Link>
        </main>
      )
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/videos"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Voltar para biblioteca
      </Link>

      <VideoPlayer videoId={video.id} title={video.title} />

      <div className="mt-6">
        <h1 className="font-heading text-2xl md:text-3xl">{video.title}</h1>
        {video.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {video.description}
          </p>
        )}
      </div>
    </main>
  )
}
