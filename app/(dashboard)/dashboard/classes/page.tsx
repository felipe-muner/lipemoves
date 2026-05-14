import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses, teachers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ClassDialog } from "@/components/crm/class-dialog"
import { ImportClassesDialog } from "@/components/crm/import-classes-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import {
  createClass,
  updateClass,
  deleteClass,
} from "@/lib/actions/classes"

export const dynamic = "force-dynamic"

export default async function ClassesPage() {
  const session = await requireDashboardSession()

  const baseSelect = db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      description: yogaClasses.description,
      scheduledAt: yogaClasses.scheduledAt,
      durationMinutes: yogaClasses.durationMinutes,
      dropInPriceCents: yogaClasses.dropInPriceCents,
      capacity: yogaClasses.capacity,
      teacherId: yogaClasses.teacherId,
      teacherName: teachers.name,
    })
    .from(yogaClasses)
    .leftJoin(teachers, eq(teachers.id, yogaClasses.teacherId))

  const rows =
    session.role === "teacher" && session.teacherId
      ? await baseSelect
          .where(eq(yogaClasses.teacherId, session.teacherId))
          .orderBy(yogaClasses.scheduledAt)
      : await baseSelect.orderBy(yogaClasses.scheduledAt)

  const canManage = session.role === "admin" || session.role === "manager"

  const teacherOptions = canManage
    ? await db
        .select({ id: teachers.id, name: teachers.name })
        .from(teachers)
        .where(eq(teachers.isActive, true))
        .orderBy(teachers.name)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Schedule and manage classes." : "Your scheduled classes."}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <ImportClassesDialog />
            <ClassDialog
              mode="create"
              action={createClass}
              teachers={teacherOptions}
            />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} classes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                {session.role !== "teacher" && <TableHead>Teacher</TableHead>}
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Drop-in (THB)</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No classes scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(r.scheduledAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    {session.role !== "teacher" && (
                      <TableCell>{r.teacherName ?? "—"}</TableCell>
                    )}
                    <TableCell className="text-right">
                      {r.durationMinutes} min
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round((r.dropInPriceCents ?? 0) / 100)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <ClassDialog
                            mode="edit"
                            values={{
                              name: r.name,
                              description: r.description,
                              scheduledAt: r.scheduledAt,
                              durationMinutes: r.durationMinutes,
                              dropInPriceCents: r.dropInPriceCents,
                              capacity: r.capacity,
                              teacherId: r.teacherId,
                            }}
                            teachers={teacherOptions}
                            action={updateClass.bind(null, r.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DeleteRowButton
                            action={deleteClass.bind(null, r.id)}
                            confirmText={`Delete class "${r.name}"?`}
                          />
                        </div>
                      </TableCell>
                    )}
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
