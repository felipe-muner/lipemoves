import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { locations } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
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
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { LocationDialog } from "@/components/crm/location-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import {
  createLocation,
  updateLocation,
  deleteLocation,
  ensureDefaultLocation,
} from "@/lib/actions/locations"

export const dynamic = "force-dynamic"

export default async function LocationsPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultLocation()

  const rows = await db
    .select()
    .from(locations)
    .orderBy(desc(locations.isDefault), locations.name)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Shalas, rooms, outdoor spaces — anywhere a class can run. Color
            shows up on the calendar.
          </p>
        </div>
        <LocationDialog mode="create" action={createLocation} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} locations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span
                      className="inline-block h-6 w-6 rounded-md border border-black/10"
                      style={{ background: r.color }}
                      title={r.color}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {r.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.isActive ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <LocationDialog
                        mode="edit"
                        values={{
                          name: r.name,
                          description: r.description,
                          color: r.color,
                          isDefault: r.isDefault,
                          isActive: r.isActive,
                        }}
                        action={updateLocation.bind(null, r.id)}
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
                        action={deleteLocation.bind(null, r.id)}
                        confirmText={`Delete "${r.name}"? Classes will lose this location.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
