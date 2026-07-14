import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import {
  personalExpenses,
  personalExpenseCategories,
} from "@/lib/db/schema"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  parseISO,
  format,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { PageHeader } from "@/components/crm/page-header"
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
import { Coins, TrendingDown, CalendarDays } from "lucide-react"
import { PersonalExpenseDialog } from "@/components/crm/personal-expense-dialog"
import { CategoriesManagerDialog } from "@/components/crm/categories-manager-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import {
  createPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
  createPersonalExpenseCategory,
  updatePersonalExpenseCategory,
  deletePersonalExpenseCategory,
  ensureDefaultPersonalExpenseCategories,
  listPersonalExpenseCategories,
} from "@/lib/actions/personal-expenses"

export const dynamic = "force-dynamic"

export default async function PersonalExpensesPage() {
  const session = await requireDashboardSession()
  await ensureDefaultPersonalExpenseCategories(session.userId)

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [categories, rows] = await Promise.all([
    listPersonalExpenseCategories(session.userId),
    db
      .select({
        id: personalExpenses.id,
        categoryId: personalExpenses.categoryId,
        amountThb: personalExpenses.amountThb,
        spentOn: personalExpenses.spentOn,
        notes: personalExpenses.notes,
        categoryName: personalExpenseCategories.name,
        categoryColor: personalExpenseCategories.color,
      })
      .from(personalExpenses)
      .innerJoin(
        personalExpenseCategories,
        eq(personalExpenseCategories.id, personalExpenses.categoryId),
      )
      .where(
        and(
          eq(personalExpenses.userId, session.userId),
          gte(personalExpenses.spentOn, monthStart.toISOString()),
          lte(personalExpenses.spentOn, monthEnd.toISOString()),
        ),
      )
      .orderBy(desc(personalExpenses.spentOn)),
  ])

  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const totalToday = rows
    .filter((r) => {
      const d = parseISO(r.spentOn)
      return d >= todayStart && d <= todayEnd
    })
    .reduce((a, b) => a + b.amountThb, 0)

  const totalWeek = rows
    .filter((r) => {
      const d = parseISO(r.spentOn)
      return d >= weekStart && d <= weekEnd
    })
    .reduce((a, b) => a + b.amountThb, 0)

  const totalMonth = rows.reduce((a, b) => a + b.amountThb, 0)

  const dialogCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal expenses"
        subtitle={`What you spent in ${format(now, "MMMM yyyy")}. Better numbers, better moves.`}
        actions={
          <>
            <CategoriesManagerDialog
              title="Expense categories"
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                isActive: c.isActive,
              }))}
              createAction={createPersonalExpenseCategory}
              updateAction={updatePersonalExpenseCategory}
              deleteAction={deletePersonalExpenseCategory}
            />
            <PersonalExpenseDialog
              mode="create"
              categories={dialogCategories}
              action={createPersonalExpense}
              createCategoryAction={createPersonalExpenseCategory}
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today"
          value={<Money thb={totalToday} />}
          icon={Coins}
        />
        <StatCard
          label="This week"
          value={<Money thb={totalWeek} />}
          icon={CalendarDays}
        />
        <StatCard
          label="This month"
          value={<Money thb={totalMonth} />}
          icon={TrendingDown}
          valueClassName="text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {rows.length} {rows.length === 1 ? "entry" : "entries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nothing yet this month — add your first expense.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(r.spentOn), "MMM dd")}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        style={{
                          background: `${r.categoryColor}15`,
                          color: r.categoryColor,
                          border: `1px solid ${r.categoryColor}55`,
                        }}
                      >
                        {r.categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                      {r.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money thb={r.amountThb} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <PersonalExpenseDialog
                          mode="edit"
                          categories={dialogCategories}
                          values={{
                            categoryId: r.categoryId,
                            amountThb: r.amountThb,
                            spentOn: r.spentOn,
                            notes: r.notes,
                          }}
                          action={updatePersonalExpense.bind(null, r.id)}
                          createCategoryAction={createPersonalExpenseCategory}
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
                          action={deletePersonalExpense.bind(null, r.id)}
                          confirmText="Delete this expense?"
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
    </div>
  )
}
