import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { movementCategories, movementEntries } from "@/lib/db/schema"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Activity, Flame, Timer } from "lucide-react"
import { PageHeader } from "@/components/crm/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/crm/stat-card"
import { MovementDialog } from "@/components/crm/movement-dialog"
import { MovementMonthGrid } from "@/components/crm/movement-month-grid"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { CategoriesManagerDialog } from "@/components/crm/categories-manager-dialog"
import {
  createMovementEntry,
  updateMovementEntry,
  deleteMovementEntry,
  createMovementCategory,
  updateMovementCategory,
  deleteMovementCategory,
  ensureDefaultMovementCategories,
  listMovementCategories,
} from "@/lib/actions/movement"

export const dynamic = "force-dynamic"

export default async function MovementPage() {
  const session = await requireDashboardSession()
  await ensureDefaultMovementCategories(session.userId)

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [categories, rows] = await Promise.all([
    listMovementCategories(session.userId),
    db
      .select({
        id: movementEntries.id,
        categoryId: movementEntries.categoryId,
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
          eq(movementEntries.userId, session.userId),
          gte(movementEntries.performedOn, monthStart.toISOString()),
          lte(movementEntries.performedOn, monthEnd.toISOString()),
        ),
      )
      .orderBy(desc(movementEntries.performedOn)),
  ])

  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const weekRows = rows.filter((r) => {
    const d = parseISO(r.performedOn)
    return d >= weekStart && d <= weekEnd
  })

  const sessionsMonth = rows.length
  const sessionsWeek = weekRows.length
  const minutesMonth = rows.reduce((a, b) => a + (b.durationMin ?? 0), 0)

  const dialogCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movement"
        subtitle={`Your training log for ${format(now, "MMMM yyyy")}.`}
        actions={
          <>
            <CategoriesManagerDialog
              title="Movement categories"
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                isActive: c.isActive,
              }))}
              createAction={createMovementCategory}
              updateAction={updateMovementCategory}
              deleteAction={deleteMovementCategory}
            />
            <MovementDialog
              mode="create"
              categories={dialogCategories}
              action={createMovementEntry}
              createCategoryAction={createMovementCategory}
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Sessions this week"
          value={sessionsWeek}
          icon={Flame}
        />
        <StatCard
          label="Sessions this month"
          value={sessionsMonth}
          icon={Activity}
        />
        <StatCard
          label="Total minutes (month)"
          value={minutesMonth}
          icon={Timer}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{format(now, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementMonthGrid
            monthDate={now}
            entries={rows}
            categories={dialogCategories}
            createAction={createMovementEntry}
            createCategoryAction={createMovementCategory}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <span key={c.id} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </span>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {rows.length} {rows.length === 1 ? "session" : "sessions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Notes</TableHead>
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
                    No sessions logged yet this month.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">
                        {format(parseISO(r.performedOn), "MMM dd")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(r.performedOn), "HH:mm")}
                      </div>
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
                    <TableCell className="text-right text-muted-foreground">
                      {r.durationMin ? `${r.durationMin} min` : "—"}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                      {r.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <MovementDialog
                          mode="edit"
                          categories={dialogCategories}
                          values={{
                            categoryId: r.categoryId,
                            performedOn: r.performedOn,
                            durationMin: r.durationMin,
                            notes: r.notes,
                          }}
                          action={updateMovementEntry.bind(null, r.id)}
                          createCategoryAction={createMovementCategory}
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
                          action={deleteMovementEntry.bind(null, r.id)}
                          confirmText="Delete this session?"
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
