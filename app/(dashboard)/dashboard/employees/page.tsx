import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { roles, teams } from "@/lib/db/schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmployeeDialog } from "@/components/crm/employee-dialog"
import { EntityAvatar } from "@/components/crm/entity-avatar"
import { RoleTeamDialog } from "@/components/crm/role-team-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { parseIdsParam } from "@/lib/utils/url-params"
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createRole,
  updateRole,
  deleteRole,
  createTeam,
  updateTeam,
  deleteTeam,
  employeeListWithRoleTeam,
} from "@/lib/actions/employees"

export const dynamic = "force-dynamic"

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const { employeeId = "" } = await searchParams
  const selectedIds = parseIdsParam(employeeId)

  const employeeRows = await employeeListWithRoleTeam()
  const roleRows = await db.select().from(roles).orderBy(roles.name)
  const teamRows = await db.select().from(teams).orderBy(teams.name)

  const filteredEmployees =
    selectedIds.size > 0
      ? employeeRows.filter((e) => selectedIds.has(e.id))
      : employeeRows

  const roleChips = roleRows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
  }))
  const teamChips = teamRows.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Everyone who works here. Roles and teams are reusable across the
            CRM (yoga, restaurant, ...).
          </p>
        </div>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees ({filteredEmployees.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roleRows.length})</TabsTrigger>
          <TabsTrigger value="teams">Teams ({teamRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="md:max-w-md w-full">
              <EntitySearchFilter
                multiple
                items={employeeRows.map((e) => ({
                  id: e.id,
                  label: e.name,
                  description: e.email,
                }))}
                paramName="employeeId"
                value={employeeId}
                placeholder="Search employees..."
                searchPlaceholder="Search by name or email..."
                emptyText="No employees match."
                allLabel="All employees"
              />
            </div>
            <EmployeeDialog
              mode="create"
              roles={roleChips}
              teams={teamChips}
              action={createEmployee}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead className="text-right">This month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {employeeRows.length === 0
                          ? "No employees yet."
                          : "No employees match the filter."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <EntityAvatar name={e.name} />
                            <span>{e.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {e.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {e.roles.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                style={{
                                  borderColor: `${r.color}55`,
                                  color: r.color,
                                  background: `${r.color}15`,
                                }}
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {e.teams.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                style={{
                                  borderColor: `${t.color}55`,
                                  color: t.color,
                                  background: `${t.color}15`,
                                }}
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {e.monthlySales.count > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {e.monthlySales.totalThb.toLocaleString()} ฿
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {e.monthlySales.count} sales
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {e.isActive ? (
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
                            <EmployeeDialog
                              mode="edit"
                              roles={roleChips}
                              teams={teamChips}
                              values={{
                                name: e.name,
                                email: e.email,
                                phone: e.phone,
                                passport: e.passport,
                                isActive: e.isActive,
                                roleIds: e.roles.map((r) => r.id),
                                teamIds: e.teams.map((t) => t.id),
                              }}
                              action={updateEmployee.bind(null, e.id)}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <DeleteRowButton
                              action={deleteEmployee.bind(null, e.id)}
                              confirmText={`Delete "${e.name}"? All their role + team assignments are removed.`}
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
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <RoleTeamDialog kind="role" mode="create" action={createRole} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span
                          className="inline-block h-6 w-6 rounded-md border border-black/10"
                          style={{ background: r.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.name}
                        {r.isSystem && (
                          <Badge variant="outline" className="ml-2">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <code>{r.slug}</code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <RoleTeamDialog
                            kind="role"
                            mode="edit"
                            values={{
                              name: r.name,
                              color: r.color,
                              description: r.description,
                            }}
                            action={updateRole.bind(null, r.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          {!r.isSystem && (
                            <DeleteRowButton
                              action={deleteRole.bind(null, r.id)}
                              confirmText={`Delete role "${r.name}"? Employees with this role keep their record but lose the assignment.`}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-end">
            <RoleTeamDialog kind="team" mode="create" action={createTeam} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <span
                          className="inline-block h-6 w-6 rounded-md border border-black/10"
                          style={{ background: t.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <code>{t.slug}</code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <RoleTeamDialog
                            kind="team"
                            mode="edit"
                            values={{
                              name: t.name,
                              color: t.color,
                              description: t.description,
                            }}
                            action={updateTeam.bind(null, t.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DeleteRowButton
                            action={deleteTeam.bind(null, t.id)}
                            confirmText={`Delete team "${t.name}"?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
