import { db } from "@/lib/db"
import { videos, categories, watchProgress } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import VideoCard from "@/components/video/VideoCard"

export const dynamic = "force-dynamic"

export default async function VideosPage() {
  const session = await auth()

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder))

  const allVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.isPublished, true))
    .orderBy(asc(videos.sortOrder))

  let progressMap: Record<string, number> = {}

  if (session?.user?.id) {
    const allProgress = await db
      .select()
      .from(watchProgress)
      .where(eq(watchProgress.userId, session.user.id))

    progressMap = Object.fromEntries(
      allProgress.map((p) => [p.videoId, p.progressSeconds ?? 0])
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl md:text-4xl">Biblioteca de V&iacute;deos</h1>

      {allCategories.length === 0 && allVideos.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          Nenhum v&iacute;deo dispon&iacute;vel ainda. Volte em breve!
        </p>
      )}

      {allCategories.map((category) => {
        const categoryVideos = allVideos.filter(
          (v) => v.categoryId === category.id
        )

        if (categoryVideos.length === 0) return null

        return (
          <section key={category.id} className="mt-12">
            <h2 className="font-heading text-2xl">{category.name}</h2>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categoryVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  progress={progressMap[video.id]}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Uncategorized videos */}
      {allVideos.filter((v) => !v.categoryId).length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-2xl">Outros</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allVideos
              .filter((v) => !v.categoryId)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  progress={progressMap[video.id]}
                />
              ))}
          </div>
        </section>
      )}
    </main>
  )
}
