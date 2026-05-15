import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { employees } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  endOfDay,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Money } from "@/components/crm/money"
import { ExpenseDialog } from "@/components/crm/expense-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { FinanceFilters } from "@/components/crm/finance-filters"
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/actions/expenses"
import { ensureDefaultExpenseCategories } from "@/lib/actions/expense-categories"
import {
  listExpenseCategories,
  manualExpenses,
  teacherPayouts,
} from "@/lib/finance/queries"

export const dynamic = "force-dynamic"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    categoryId?: string
  }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultExpenseCategories()

  const params = await searchParams
  const now = new Date()
  const from = params.from ? parseISO(params.from) : startOfMonth(now)
  const to = params.to ? endOfDay(parseISO(params.to)) : endOfMonth(now)
  const categoryId = params.categoryId ?? ""

  const [categories, allExpenses, payouts, employeeRows] = await Promise.all([
    listExpenseCategories(),
    manualExpenses({ from, to }),
    teacherPayouts({ from, to }),
    db
      .select({ id: employees.id, name: employees.name })
      .from(employees)
      .where(eq(employees.isActive, true))
      .orderBy(employees.name),
  ])

  const activeCategories = categories.filter((c) => c.isActive)
  const dialogCategories = activeCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  const filtered = categoryId
    ? allExpenses.filter((e) => e.categoryId === categoryId)
    : allExpenses

  const manualTotal = filtered.reduce((a, b) => a + b.amountThb, 0)
  const payoutTotal = payouts.reduce((a, b) => a + b.payoutThb, 0)
  const grandTotal = manualTotal + payoutTotal

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            All money out: manual expenses + teacher payouts (auto from{" "}
            <Link href="/dashboard/payments" className="underline">
              payroll
            </Link>
            , cash-basis).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/categories">Categories</Link>
          </Button>
          <ExpenseDialog
            mode="create"
            categories={dialogCategories}
            employees={employeeRows}
            action={createExpense}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinanceFilters
            defaultFrom={format(from, "yyyy-MM-dd")}
            defaultTo={format(to, "yyyy-MM-dd")}
            categoryId={categoryId}
            categories={activeCategories.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            showCategory
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Manual expenses" amount={manualTotal} />
        <KpiCard label="Teacher payouts" amount={payoutTotal} />
        <KpiCard label="Total out" amount={grandTotal} accent="red" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} manual expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No expenses in this range.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(e.incurredOn), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        style={{
                          background: `${e.categoryColor}15`,
                          color: e.categoryColor,
                          border: `1px solid ${e.categoryColor}55`,
                        }}
                      >
                        {e.categoryName}
                      </span>
                    </TableCell>
                    <TableCell>{e.vendor ?? "—"}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {e.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.employeeName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money thb={e.amountThb} />
                    </TableCell>
                    <TableCell>
                      {e.paidAt ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700"
                        >
                          {format(parseISO(e.paidAt), "MMM dd")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">
                          Unpaid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ExpenseDialog
                          mode="edit"
                          categories={dialogCategories}
                          employees={employeeRows}
                          values={{
                            categoryId: e.categoryId,
                            amountThb: e.amountThb,
                            incurredOn: e.incurredOn,
                            vendor: e.vendor,
                            description: e.description,
                            employeeId: e.employeeId,
                            paymentMethod: e.paymentMethod,
                            paidAt: e.paidAt,
                            receiptUrl: e.receiptUrl,
                          }}
                          action={updateExpense.bind(null, e.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <DeleteRowButton
                          action={deleteExpense.bind(null, e.id)}
                          confirmText={`Delete this ${e.categoryName.toLowerCase()} expense?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Teacher payouts in range — {payouts.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (read-only · manage in{" "}
              <Link href="/dashboard/payments" className="underline">
                payroll
              </Link>
              )
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No teacher classes marked paid in this range.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paid on</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      {p.paidAt ? format(parseISO(p.paidAt), "MMM dd, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{p.className}</TableCell>
                    <TableCell>{p.teacherName ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {p.attendeeCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money thb={p.payoutThb} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  amount,
  accent = "default",
}: {
  label: string
  amount: number
  accent?: "default" | "red"
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-semibold ${accent === "red" ? "text-red-600" : ""}`}
        >
          <Money thb={amount} />
        </div>
      </CardContent>
    </Card>
  )
}
