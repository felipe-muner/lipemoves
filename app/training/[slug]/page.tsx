import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { users, movementEntries, movementCategories } from "@/lib/db/schema"
import { and, desc, eq, gte } from "drizzle-orm"
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Flame, Timer, Calendar } from "lucide-react"
import { YearHeatmap } from "@/components/training/year-heatmap"

export const dynamic = "force-dynamic"
export const revalidate = 60

async function loadProfile(slug: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      publicBio: users.publicBio,
    })
    .from(users)
    .where(eq(users.publicSlug, slug))
    .limit(1)
  return user ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await loadProfile(slug)
  if (!profile) return { title: "Not found" }

  const title = `${profile.name ?? slug}'s training log — Lipe Moves`
  const description =
    profile.publicBio ??
    `Public movement calendar — see what ${profile.name ?? slug} is training every day.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://lipemoves.com/training/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function PublicTrainingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await loadProfile(slug)
  if (!profile) notFound()

  const now = new Date()
  const yearStart = subDays(startOfDay(now), 365)

  const rows = await db
    .select({
      id: movementEntries.id,
      performedOn: movementEntries.performedOn,
      durationMin: movementEntries.durationMin,
      notes: movementEntries.notes,
      categoryName: movementCategories.name,
      categoryColor: movementCategories.color,
    })
    .from(movementEntries)
    .innerJoin(
      movementCategories,
      eq(movementCategories.id, movementEntries.categoryId),
    )
    .where(
      and(
        eq(movementEntries.userId, profile.id),
        gte(movementEntries.performedOn, yearStart.toISOString()),
      ),
    )
    .orderBy(desc(movementEntries.performedOn))

  // Stats
  const totalSessions = rows.length
  const totalMinutes = rows.reduce((a, b) => a + (b.durationMin ?? 0), 0)

  // Current streak (consecutive days ending today/yesterday with at least one session)
  const dateSet = new Set(
    rows.map((r) => format(parseISO(r.performedOn), "yyyy-MM-dd")),
  )
  let streak = 0
  let cursor = startOfDay(now)
  // grace: if no entry today, still count from yesterday
  if (!dateSet.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1)
  }
  while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
    streak++
    cursor = subDays(cursor, 1)
  }

  // Past 7 days sessions
  const weekAgo = subDays(startOfDay(now), 7)
  const sessionsThisWeek = rows.filter(
    (r) => parseISO(r.performedOn) >= weekAgo,
  ).length

  const recent = rows.slice(0, 20)

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:py-16">
      <header className="space-y-3 text-center">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-muted">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt={profile.name ?? slug}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
              {(profile.name ?? slug).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.name ?? slug}&apos;s training log
        </h1>
        {profile.publicBio && (
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            {profile.publicBio}
          </p>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile icon={Flame} label="Current streak" value={`${streak}d`} />
        <StatTile
          icon={Calendar}
          label="This week"
          value={`${sessionsThisWeek}`}
        />
        <StatTile
          icon={Activity}
          label="Sessions (1y)"
          value={`${totalSessions}`}
        />
        <StatTile
          icon={Timer}
          label="Minutes (1y)"
          value={`${totalMinutes}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 12 months</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <YearHeatmap entries={rows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sessions logged yet.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex gap-3 py-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: r.categoryColor }}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium">{r.categoryName}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {format(parseISO(r.performedOn), "EEE MMM d · HH:mm")}
                      </span>
                      {r.durationMin ? (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            {r.durationMin} min
                          </span>
                        </>
                      ) : null}
                    </div>
                    {r.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        Tracking with{" "}
        <a href="/" className="underline underline-offset-2">
          Lipe Moves
        </a>
      </footer>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}
