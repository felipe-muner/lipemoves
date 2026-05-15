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
import { StatCard } from "@/components/crm/stat-card"
import { TrendingDown, Wallet, Coins } from "lucide-react"
import { ExpenseDialog } from "@/components/crm/expense-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { FinanceFilters } from "@/components/crm/finance-filters"
import { EmployeeFilter } from "@/components/crm/employee-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { parsePagination } from "@/lib/utils/pagination"
import { DataTablePagination } from "@/components/crm/data-table-pagination"
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
    employeeId?: string
    tab?: "manual" | "payouts"
    page?: string
    perPage?: string
  }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultExpenseCategories()

  const params = await searchParams
  const { page, perPage, offset } = parsePagination(params)
  const now = new Date()
  const from = params.from ? parseISO(params.from) : startOfMonth(now)
  const to = params.to ? endOfDay(parseISO(params.to)) : endOfMonth(now)
  const categoryId = params.categoryId ?? ""
  const employeeId = params.employeeId ?? ""
  const activeTab = params.tab === "payouts" ? "payouts" : "manual"

  const [categories, allExpenses, payouts, employeeRows] = await Promise.all([
    listExpenseCategories(),
    manualExpenses({ from, to }),
    teacherPayouts({ from, to }),
    db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
      })
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

  const filteredManual = allExpenses.filter((e) => {
    if (categoryId && e.categoryId !== categoryId) return false
    if (employeeId && e.employeeId !== employeeId) return false
    return true
  })
  const filteredPayouts = payouts.filter((p) => {
    if (employeeId && p.teacherId !== employeeId) return false
    return true
  })

  const manualTotal = filteredManual.reduce((a, b) => a + b.amountThb, 0)
  const payoutTotal = filteredPayouts.reduce((a, b) => a + b.payoutThb, 0)
  const visibleManual = filteredManual.slice(offset, offset + perPage)
  const visiblePayouts = filteredPayouts.slice(offset, offset + perPage)
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

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">
            Manual expenses ({filteredManual.length})
          </TabsTrigger>
          <TabsTrigger value="payouts">
            Teacher payouts ({filteredPayouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardContent className="p-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              label="Manual expenses"
              value={<Money thb={manualTotal} />}
              icon={Coins}
            />
            <StatCard
              label="Total out (incl. payouts)"
              value={<Money thb={grandTotal} />}
              icon={TrendingDown}
              valueClassName="text-red-600"
            />
          </div>

          <Card>
        <CardHeader>
          <CardTitle>{filteredManual.length} manual expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
              {visibleManual.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No expenses in this range.
                  </TableCell>
                </TableRow>
              ) : (
                visibleManual.map((e) => (
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
          <DataTablePagination
            total={filteredManual.length}
            page={page}
            perPage={perPage}
            label="expenses"
          />
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <FinanceFilters
                defaultFrom={format(from, "yyyy-MM-dd")}
                defaultTo={format(to, "yyyy-MM-dd")}
                extraField={
                  <div className="grid gap-1.5 min-w-[220px]">
                    <Label htmlFor="employeeId" className="text-xs">
                      Teacher
                    </Label>
                    <EmployeeFilter
                      employees={employeeRows}
                      value={employeeId}
                      placeholder="All teachers"
                    />
                  </div>
                }
              />
            </CardContent>
          </Card>

          <StatCard
            label="Teacher payouts"
            value={<Money thb={payoutTotal} />}
            icon={Wallet}
          />

          <Card>
            <CardHeader>
              <CardTitle>
                {filteredPayouts.length} teacher payouts{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (read-only · manage in{" "}
                  <Link href="/dashboard/payments" className="underline">
                    payroll
                  </Link>
                  )
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visiblePayouts.length === 0 ? (
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
                    {visiblePayouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {p.paidAt
                            ? format(parseISO(p.paidAt), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.className}
                        </TableCell>
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
              <DataTablePagination
                total={filteredPayouts.length}
                page={page}
                perPage={perPage}
                label="payouts"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

