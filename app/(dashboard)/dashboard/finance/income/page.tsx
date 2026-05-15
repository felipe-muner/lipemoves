import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Money } from "@/components/crm/money"
import { FinanceFilters } from "@/components/crm/finance-filters"
import {
  restaurantDailyTotals,
  membershipPurchases,
  dropInPayments,
} from "@/lib/finance/queries"

export const dynamic = "force-dynamic"

type SourceFilter = "all" | "restaurant" | "memberships" | "drop_in"

export default async function FinanceIncomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; source?: SourceFilter }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const params = await searchParams
  const now = new Date()
  const from = params.from ? parseISO(params.from) : startOfMonth(now)
  const to = params.to ? endOfDay(parseISO(params.to)) : endOfMonth(now)
  const source: SourceFilter = params.source ?? "all"

  const [restaurant, memberships, dropIns] = await Promise.all([
    restaurantDailyTotals({ from, to }),
    membershipPurchases({ from, to }),
    dropInPayments({ from, to }),
  ])

  const restaurantTotal = restaurant.reduce((a, b) => a + b.totalThb, 0)
  const membershipsTotal = memberships.reduce((a, b) => a + b.amountThb, 0)
  const dropInTotal = dropIns.reduce((a, b) => a + b.amountThb, 0)
  const grandTotal = restaurantTotal + membershipsTotal + dropInTotal

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
        <p className="text-sm text-muted-foreground">
          {format(from, "MMM dd, yyyy")} → {format(to, "MMM dd, yyyy")} ·
          every IN from the period.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinanceFilters
            defaultFrom={format(from, "yyyy-MM-dd")}
            defaultTo={format(to, "yyyy-MM-dd")}
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <SourcePill current={source} value="all" label="All" />
            <SourcePill current={source} value="restaurant" label="Restaurant" />
            <SourcePill current={source} value="memberships" label="Memberships" />
            <SourcePill current={source} value="drop_in" label="Drop-in" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total income" amount={grandTotal} />
        <KpiCard label="Restaurant" amount={restaurantTotal} />
        <KpiCard label="Memberships" amount={membershipsTotal} />
        <KpiCard label="Drop-in" amount={dropInTotal} />
      </div>

      {(source === "all" || source === "restaurant") && (
        <Card>
          <CardHeader>
            <CardTitle>
              Restaurant — daily totals ({restaurant.length} days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurant.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No restaurant sales in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurant.map((r) => (
                    <TableRow key={r.day}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(r.day), "EEE, MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.salesCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money thb={r.totalThb} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(source === "all" || source === "memberships") && (
        <Card>
          <CardHeader>
            <CardTitle>
              Memberships — {memberships.length} purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No memberships purchased in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  memberships.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(m.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{m.studentEmail}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{m.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money thb={m.amountThb} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(source === "all" || source === "drop_in") && (
        <Card>
          <CardHeader>
            <CardTitle>Drop-in — {dropIns.length} payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dropIns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No drop-in payments recorded in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  dropIns.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(d.date), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{d.className ?? "—"}</TableCell>
                      <TableCell>{d.studentEmail}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {d.paymentMethod ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money thb={d.amountThb} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({ label, amount }: { label: string; amount: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-emerald-600">
          <Money thb={amount} />
        </div>
      </CardContent>
    </Card>
  )
}

function SourcePill({
  current,
  value,
  label,
}: {
  current: SourceFilter
  value: SourceFilter
  label: string
}) {
  const active = current === value
  const cls = active
    ? "bg-foreground text-background"
    : "bg-muted text-muted-foreground hover:bg-muted/80"
  return (
    <a
      href={`?source=${value}`}
      className={`rounded-full px-3 py-1 ${cls}`}
    >
      {label}
    </a>
  )
}
