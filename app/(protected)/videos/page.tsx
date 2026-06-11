import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { hasActiveSubscription } from "@/lib/stripe/subscription"
import { getThumbnailUrl } from "@/lib/bunny"
import { LibraryGrid, type LibraryVideo } from "@/components/library-grid"

export const dynamic = "force-dynamic"

export default async function VideosLibraryPage() {
  const session = await auth()
  const userId = session!.user.id
  const subscribed = await hasActiveSubscription(userId)

  const vids = await db
    .select()
    .from(videos)
    .where(eq(videos.isPublished, true))
    .orderBy(asc(videos.sortOrder), asc(videos.title))

  const items: LibraryVideo[] = vids.map((v) => ({
    slug: v.slug,
    title: v.title,
    thumbnailUrl: getThumbnailUrl(v.bunnyVideoId),
    tags: v.tags ?? [],
    isFree: Boolean(v.isFree),
    locked: !v.isFree && !subscribed,
  }))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">
            The library
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Kettlebell & mobility — practice at your own pace.
          </p>
        </div>
      </div>

      {!subscribed ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#39FF14]/40 bg-[#39FF14]/5 p-5">
          <div>
            <p className="font-semibold">You don&apos;t have an active membership.</p>
            <p className="text-sm text-white/60">
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

      <LibraryGrid videos={items} />
    </main>
  )
}
