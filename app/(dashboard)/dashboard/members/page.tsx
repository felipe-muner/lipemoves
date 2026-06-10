import { format, parseISO } from "date-fns"
import { desc, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, subscriptions, payments } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { planForSub, PLAN_LABEL, type PlanKey } from "@/lib/stripe/plans"
import { PageHeader } from "@/components/crm/page-header"
import { StatCard } from "@/components/crm/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddMemberDialog } from "@/components/crm/add-member-dialog"
import {
  MemberPaymentsDialog,
  type MemberPaymentRow,
} from "@/components/crm/member-payments-dialog"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { parseIdsParam } from "@/lib/utils/url-params"
import { formatAmount } from "@/lib/utils/money"
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

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>
}) {
  await requireDashboardSession()
  const { member = "" } = await searchParams
  const selectedMembers = parseIdsParam(member)

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
    // Staff (role set) aren't members — LipeMoves has a single admin.
    .where(isNull(users.role))
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
  // All payments, newest first — grouped per member for the dialog,
  // with totals kept separate per currency.
  const allPayments = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.paidAt))

  const paymentsByUser = new Map<string, MemberPaymentRow[]>()
  const totalsByUser = new Map<string, Map<string, number>>()
  for (const p of allPayments) {
    const list = paymentsByUser.get(p.userId) ?? []
    list.push({
      id: p.id,
      paidAt: p.paidAt,
      planLabel: p.plan ? PLAN_LABEL[p.plan as PlanKey] ?? p.plan : "—",
      source: p.source,
      amountLabel: formatAmount(p.amountCents, p.currency),
    })
    paymentsByUser.set(p.userId, list)

    const totals = totalsByUser.get(p.userId) ?? new Map<string, number>()
    totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.amountCents)
    totalsByUser.set(p.userId, totals)
  }

  const paidByUser = new Map<string, string>()
  for (const [userId, totals] of totalsByUser) {
    paidByUser.set(
      userId,
      [...totals.entries()]
        .map(([currency, cents]) => formatAmount(cents, currency))
        .join(" · "),
    )
  }

  const members = [...byUser.values()]
  const visibleMembers =
    selectedMembers.size > 0
      ? members.filter((m) => selectedMembers.has(m.userId))
      : members

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
        actions={<AddMemberDialog />}
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

      <div className="w-full max-w-[320px]">
        <EntitySearchFilter
          multiple
          items={members.map((m) => ({
            id: m.userId,
            label: m.name ? `${m.name} · ${m.email}` : m.email,
          }))}
          paramName="member"
          value={member}
          placeholder="Search members..."
          searchPlaceholder="Search by name or email..."
          emptyText="No members found."
          allLabel="All members"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {visibleMembers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {selectedMembers.size > 0
                ? "No members match your search."
                : "No members yet. Share the landing page to get your first signups."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Renews / ends</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.map((m) => {
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
                      <TableCell className="text-sm">
                        <MemberPaymentsDialog
                          memberLabel={m.name ?? m.email}
                          totalLabel={paidByUser.get(m.userId) ?? ""}
                          payments={paymentsByUser.get(m.userId) ?? []}
                        />
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
