import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { restaurantTables } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { RestaurantTableDialog } from "@/components/crm/restaurant-table-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { parseIdsParam } from "@/lib/utils/url-params"
import {
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
} from "@/lib/actions/restaurant-tables"

export const dynamic = "force-dynamic"

const STATUS_TONES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-600",
  occupied: "bg-amber-500/10 text-amber-600",
  cleaning: "bg-sky-500/10 text-sky-600",
  closed: "bg-muted text-muted-foreground",
}

export default async function RestaurantTablesPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const rows = await db.select().from(restaurantTables).orderBy(restaurantTables.tableNumber)
  const { tableId = "" } = await searchParams
  const selectedIds = parseIdsParam(tableId)
  const filtered =
    selectedIds.size > 0 ? rows.filter((r) => selectedIds.has(r.id)) : rows

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Restaurant tables</h1>
          <p className="text-sm text-muted-foreground">
            Tables, booths, rooms. Used when taking a sale on the restaurant page.
          </p>
        </div>
        <RestaurantTableDialog mode="create" action={createRestaurantTable} />
      </div>

      <div className="md:max-w-md">
        <EntitySearchFilter
          items={rows.map((r) => ({
            id: r.id,
            label: r.tableNumber,
            description: [r.room, r.seats ? `${r.seats} seats` : null]
              .filter(Boolean)
              .join(" · "),
            imageType: "logo",
          }))}
          multiple
          paramName="tableId"
          value={tableId}
          placeholder="Search tables..."
          searchPlaceholder="Search by number or room..."
          emptyText="No tables match."
          allLabel="All tables"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} tables</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {rows.length === 0 ? "No tables yet." : "No tables match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.tableNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.room ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{t.seats ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_TONES[t.status]}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <RestaurantTableDialog
                          mode="edit"
                          values={{
                            tableNumber: t.tableNumber,
                            room: t.room,
                            seats: t.seats,
                            status: t.status,
                            isActive: t.isActive,
                            notes: t.notes,
                          }}
                          action={updateRestaurantTable.bind(null, t.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <DeleteRowButton
                          action={deleteRestaurantTable.bind(null, t.id)}
                          confirmText={`Delete table "${t.tableNumber}"?`}
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
