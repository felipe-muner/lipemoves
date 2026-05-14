import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { employees, roles, employeeRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
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
import { TeacherDialog } from "@/components/crm/teacher-dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "@/lib/actions/teachers"

export const dynamic = "force-dynamic"

export default async function TeachersPage() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  // Employees who hold the "teacher" role
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      phone: employees.phone,
      passport: employees.passport,
      bio: employees.bio,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .innerJoin(employeeRoles, eq(employeeRoles.employeeId, employees.id))
    .innerJoin(roles, eq(roles.id, employeeRoles.roleId))
    .where(eq(roles.slug, "teacher"))
    .orderBy(employees.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teachers</h1>
          <p className="text-sm text-muted-foreground">
            Manage teachers. Each class has its own per-teacher pay.
          </p>
        </div>
        <TeacherDialog mode="create" action={createTeacher} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No teachers yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone ?? "—"}</TableCell>
                    <TableCell>{r.passport ?? "—"}</TableCell>
                    <TableCell>
                      {r.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <TeacherDialog
                          mode="edit"
                          values={{
                            id: r.id,
                            name: r.name,
                            email: r.email,
                            phone: r.phone,
                            passport: r.passport,
                            bio: r.bio,
                            isActive: r.isActive,
                          }}
                          action={updateTeacher.bind(null, r.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <DeleteRowButton
                          action={deleteTeacher.bind(null, r.id)}
                          confirmText={`Delete "${r.name}"? Classes will keep but lose teacher.`}
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
