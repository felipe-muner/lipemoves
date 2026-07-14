import { requireUser } from "@/lib/auth/user"
import { db } from "@/lib/db"
import { movementCategories, movementEntries } from "@/lib/db/schema"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Activity, Flame, Timer } from "lucide-react"
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

export default async function MePage() {
  const session = await requireUser()
  await ensureDefaultMovementCategories(session.userId)

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)

  const [categories, rows, yearRows] = await Promise.all([
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
    db
      .select({
        durationMin: movementEntries.durationMin,
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
          gte(movementEntries.performedOn, yearStart.toISOString()),
          lte(movementEntries.performedOn, yearEnd.toISOString()),
        ),
      ),
  ])

  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const sessionsWeek = rows.filter((r) => {
    const d = parseISO(r.performedOn)
    return d >= weekStart && d <= weekEnd
  }).length
  const sessionsMonth = rows.length
  const minutesMonth = rows.reduce((a, b) => a + (b.durationMin ?? 0), 0)

  // Year roll-up: total minutes per category, so you can see how many hours
  // of yoga / mobility / etc. you've done this year.
  const yearMinutes = yearRows.reduce((a, b) => a + (b.durationMin ?? 0), 0)
  const byCategory = new Map<
    string,
    { name: string; color: string; minutes: number; sessions: number }
  >()
  for (const r of yearRows) {
    const key = r.categoryName
    const cur = byCategory.get(key) ?? {
      name: r.categoryName,
      color: r.categoryColor,
      minutes: 0,
      sessions: 0,
    }
    cur.minutes += r.durationMin ?? 0
    cur.sessions += 1
    byCategory.set(key, cur)
  }
  const yearBreakdown = [...byCategory.values()].sort(
    (a, b) => b.minutes - a.minutes || b.sessions - a.sessions,
  )
  const maxMinutes = Math.max(1, ...yearBreakdown.map((c) => c.minutes))

  const dialogCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            My movement
          </h1>
          <p className="text-sm text-muted-foreground">
            Log what you practiced — {format(now, "MMMM yyyy")}.
          </p>
        </div>
        <div className="flex gap-2">
          <CategoriesManagerDialog
            title="My categories"
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="This week" value={sessionsWeek} icon={Flame} />
        <StatCard label="This month" value={sessionsMonth} icon={Activity} />
        <StatCard
          label="Minutes (month)"
          value={minutesMonth}
          icon={Timer}
        />
      </div>

      {/* Year roll-up — hours of movement so far this year, by type */}
      <Card>
        <CardHeader className="flex-row items-baseline justify-between gap-2 space-y-0">
          <CardTitle>{format(now, "yyyy")} so far</CardTitle>
          <span className="text-sm text-muted-foreground">
            {(yearMinutes / 60).toFixed(1)} h · {yearRows.length}{" "}
            {yearRows.length === 1 ? "session" : "sessions"}
          </span>
        </CardHeader>
        <CardContent>
          {yearBreakdown.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nothing logged this year yet. Tap a day below to start.
            </p>
          ) : (
            <div className="space-y-2.5">
              {yearBreakdown.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">
                      {c.minutes > 0
                        ? `${(c.minutes / 60).toFixed(1)} h`
                        : `${c.sessions} ${c.sessions === 1 ? "session" : "sessions"}`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (c.minutes / maxMinutes) * 100)}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            {rows.length} {rows.length === 1 ? "session" : "sessions"} this month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
