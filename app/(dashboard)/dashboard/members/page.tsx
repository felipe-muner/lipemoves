import { format, parseISO } from "date-fns"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, subscriptions } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { planForSub, PLAN_LABEL } from "@/lib/stripe/plans"
import { addManualMember } from "@/lib/actions/members"
import { PageHeader } from "@/components/crm/page-header"
import { StatCard } from "@/components/crm/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EntitySelectField } from "@/components/crm/entity-select-field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserCheck, CreditCard, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

type SubStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | null

const ACTIVE: SubStatus[] = ["active", "trialing"]

function statusVariant(status: SubStatus): "default" | "secondary" | "outline" {
  if (status && ACTIVE.includes(status)) return "default"
  if (status === "past_due") return "secondary"
  return "outline"
}

export default async function MembersPage() {
  await requireDashboardSession()

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      joined: users.createdAt,
      role: users.role,
      source: subscriptions.source,
      status: subscriptions.status,
      priceId: subscriptions.stripePriceId,
      plan: subscriptions.plan,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .orderBy(desc(users.createdAt))

  // Collapse multiple subscription rows per user → keep the "best" one.
  const byUser = new Map<string, (typeof rows)[number]>()
  for (const r of rows) {
    const existing = byUser.get(r.userId)
    if (!existing) {
      byUser.set(r.userId, r)
      continue
    }
    const rActive = r.status ? ACTIVE.includes(r.status) : false
    const eActive = existing.status ? ACTIVE.includes(existing.status) : false
    if (rActive && !eActive) byUser.set(r.userId, r)
  }
  const members = [...byUser.values()]

  const paying = members.filter((m) => m.status && ACTIVE.includes(m.status))
  const planOf = (m: (typeof members)[number]) =>
    planForSub({ source: m.source, stripePriceId: m.priceId, plan: m.plan })
  const recurring = paying.filter((m) => {
    const p = planOf(m)
    return p === "monthly" || p === "annual"
  })
  const coaching = paying.filter((m) => planOf(m) === "one_to_one")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle={`${members.length} registered · ${paying.length} active members`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Active members"
          value={paying.length}
          icon={UserCheck}
          hint="Active or trialing"
        />
        <StatCard
          label="Subscriptions"
          value={recurring.length}
          icon={CreditCard}
          hint="Monthly + Annual"
        />
        <StatCard
          label="1×1 coaching"
          value={coaching.length}
          icon={Sparkles}
          hint="Manually added"
        />
      </div>

      {/* Add a member manually (e.g. a 1×1 client who paid via WhatsApp). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add member manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addManualMember} className="grid gap-3 md:grid-cols-3">
            <Input name="name" placeholder="Name" />
            <Input name="email" type="email" placeholder="Email" required />
            <EntitySelectField
              name="plan"
              defaultValue="one_to_one"
              searchPlaceholder="Search plan..."
              items={[
                { id: "one_to_one", label: "1×1 Coaching" },
                { id: "monthly", label: "Monthly" },
                { id: "annual", label: "Annual" },
              ]}
            />
            <Input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount (e.g. 200)"
              required
            />
            <EntitySelectField
              name="currency"
              defaultValue="usd"
              searchPlaceholder="Search currency..."
              items={[
                { id: "usd", label: "USD" },
                { id: "eur", label: "EUR" },
                { id: "brl", label: "BRL" },
                { id: "thb", label: "THB" },
              ]}
            />
            <EntitySelectField
              name="billingInterval"
              defaultValue="month"
              searchPlaceholder="Search cadence..."
              items={[
                { id: "month", label: "Recurring monthly" },
                { id: "year", label: "Recurring yearly" },
                { id: "one_time", label: "One-time" },
              ]}
            />
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Starts
              <Input name="startsOn" type="date" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Ends (optional)
              <Input name="endsOn" type="date" />
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No members yet. Share the landing page to get your first signups.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renews / ends</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const plan = planOf(m)
                  const initials =
                    m.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? m.email[0]?.toUpperCase()
                  return (
                    <TableRow key={m.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m.image ?? undefined} alt={m.name ?? ""} />
                            <AvatarFallback className="text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {m.name ?? "—"}
                              {m.role ? (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  {m.role}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.status ? PLAN_LABEL[plan] : "Free / none"}
                        {m.source === "manual" ? (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            manual
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {m.status ? (
                          <Badge
                            variant={statusVariant(m.status)}
                            className="text-[10px]"
                          >
                            {m.status}
                            {m.cancelAtPeriodEnd ? " · ending" : ""}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.currentPeriodEnd
                          ? format(parseISO(m.currentPeriodEnd), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(parseISO(m.joined), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
