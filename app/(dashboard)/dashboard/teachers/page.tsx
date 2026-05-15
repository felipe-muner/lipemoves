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
import { EntityAvatar } from "@/components/crm/entity-avatar"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { ReactivateRowButton } from "@/components/crm/reactivate-row-button"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { parseIdsParam } from "@/lib/utils/url-params"
import Link from "next/link"
import {
  createTeacher,
  updateTeacher,
  deactivateTeacher,
  reactivateTeacher,
} from "@/lib/actions/teachers"

export const dynamic = "force-dynamic"

type StatusFilter = "active" | "inactive" | "all"

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; status?: StatusFilter }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const params = await searchParams
  const { teacherId = "" } = params
  const status: StatusFilter = params.status ?? "active"
  const selectedIds = parseIdsParam(teacherId)

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

  const items = rows.map((r) => ({
    id: r.id,
    label: r.name,
    description: r.email,
  }))

  const activeCount = rows.filter((r) => r.isActive).length
  const inactiveCount = rows.length - activeCount

  let filtered = rows
  if (status === "active") filtered = filtered.filter((r) => r.isActive)
  if (status === "inactive") filtered = filtered.filter((r) => !r.isActive)
  if (selectedIds.size > 0)
    filtered = filtered.filter((r) => selectedIds.has(r.id))

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="md:max-w-md flex-1 min-w-[260px]">
          <EntitySearchFilter
            multiple
            items={items}
            paramName="teacherId"
            value={teacherId}
            placeholder="Search teachers..."
            searchPlaceholder="Search by name or email..."
            emptyText="No teachers match."
            allLabel="All teachers"
          />
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
          <StatusPill current={status} value="active" label={`Active (${activeCount})`} />
          <StatusPill current={status} value="inactive" label={`Inactive (${inactiveCount})`} />
          <StatusPill current={status} value="all" label={`All (${rows.length})`} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} teachers</CardTitle>
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "No teachers yet."
                      : "No teachers match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={r.name} />
                        <span>{r.name}</span>
                      </div>
                    </TableCell>
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
                        {r.isActive ? (
                          <DeleteRowButton
                            action={deactivateTeacher.bind(null, r.id)}
                            confirmText={`Deactivate "${r.name}"? They stay in the system — switch to the Inactive filter to bring them back.`}
                          />
                        ) : (
                          <ReactivateRowButton
                            action={reactivateTeacher.bind(null, r.id)}
                            label={`Reactivate ${r.name}`}
                            confirmText={`Reactivate "${r.name}"? They'll be active and appear under the Active filter again.`}
                          />
                        )}
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

function StatusPill({
  current,
  value,
  label,
}: {
  current: StatusFilter
  value: StatusFilter
  label: string
}) {
  const active = current === value
  return (
    <Link
      href={`?status=${value}`}
      className={`rounded-full px-3 py-1 transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  )
}
