import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { subscriptions, videos, emailSubscribers } from "@/lib/db/schema"
import { and, count, gte, inArray, eq } from "drizzle-orm"
import { startOfMonth, formatISO, format } from "date-fns"
import { StatCard } from "@/components/crm/stat-card"
import { PageHeader } from "@/components/crm/page-header"
import { Users, UserPlus, Clapperboard, Inbox } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardHome() {
  const session = await requireDashboardSession()
  const now = new Date()
  const monthStart = formatISO(startOfMonth(now))

  const [activeMembers] = await db
    .select({ v: count() })
    .from(subscriptions)
    .where(inArray(subscriptions.status, ["active", "trialing"]))

  const [newThisMonth] = await db
    .select({ v: count() })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ["active", "trialing"]),
        gte(subscriptions.createdAt, monthStart),
      ),
    )

  const [publishedVideos] = await db
    .select({ v: count() })
    .from(videos)
    .where(eq(videos.isPublished, true))

  const [newsletterCount] = await db
    .select({ v: count() })
    .from(emailSubscribers)
    .where(eq(emailSubscribers.status, "active"))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${session.name?.split(" ")[0] ?? "Felipe"}`}
        subtitle={`Lipe Moves — ${format(now, "MMMM yyyy")}`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Active members"
          value={activeMembers.v}
          icon={Users}
          hint="Active or trialing subscriptions"
        />
        <StatCard
          label="New this month"
          value={newThisMonth.v}
          icon={UserPlus}
          hint="Members joined this month"
        />
        <StatCard
          label="Published videos"
          value={publishedVideos.v}
          icon={Clapperboard}
          hint="Live in the library"
        />
        <StatCard
          label="Newsletter"
          value={newsletterCount.v}
          icon={Inbox}
          hint="Active subscribers"
        />
      </div>
    </div>
  )
}
