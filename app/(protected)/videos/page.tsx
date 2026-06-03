import Link from "next/link"
import Image from "next/image"
import { asc, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { videos, categories } from "@/lib/db/schema"
import { hasActiveSubscription } from "@/lib/stripe/subscription"
import { getThumbnailUrl } from "@/lib/bunny"
import { Lock, Play } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VideosLibraryPage() {
  const session = await auth()
  const userId = session!.user.id
  const subscribed = await hasActiveSubscription(userId)

  const [cats, vids] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select()
      .from(videos)
      .where(eq(videos.isPublished, true))
      .orderBy(asc(videos.sortOrder), asc(videos.title)),
  ])

  // Group videos by category id (null = "Other").
  const groups = new Map<string, typeof vids>()
  for (const v of vids) {
    const key = v.categoryId ?? "__none__"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(v)
  }

  const orderedCats = [
    ...cats.filter((c) => groups.has(c.id)),
    ...(groups.has("__none__")
      ? [{ id: "__none__", name: "Other", slug: "other" }]
      : []),
  ]

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">
            The library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kettlebell & mobility — practice at your own pace.
          </p>
        </div>
      </div>

      {!subscribed ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#39FF14]/40 bg-[#39FF14]/5 p-5">
          <div>
            <p className="font-semibold">You don&apos;t have an active membership.</p>
            <p className="text-sm text-muted-foreground">
              Unlock the full library — free previews are open to everyone.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-full bg-[#39FF14] px-6 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            See plans
          </Link>
        </div>
      ) : null}

      {vids.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">
          No videos published yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {orderedCats.map((cat) => (
            <section key={cat.id}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {(groups.get(cat.id) ?? []).map((v) => {
                  const locked = !v.isFree && !subscribed
                  const inner = (
                    <>
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={getThumbnailUrl(v.bunnyVideoId)}
                          alt={v.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          {locked ? (
                            <Lock className="h-6 w-6 text-white" />
                          ) : (
                            <Play className="h-7 w-7 text-white" fill="white" />
                          )}
                        </div>
                        {v.isFree ? (
                          <span className="absolute left-2 top-2 rounded-full bg-[#39FF14] px-2 py-0.5 text-[10px] font-bold text-black">
                            FREE
                          </span>
                        ) : null}
                        {locked ? (
                          <span className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5">
                            <Lock className="h-3 w-3 text-white" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium">
                        {v.title}
                      </p>
                    </>
                  )
                  return locked ? (
                    <Link
                      key={v.id}
                      href="/pricing"
                      className="group block"
                      title="Subscribe to unlock"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <Link
                      key={v.id}
                      href={`/videos/${v.slug}`}
                      className="group block"
                    >
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
