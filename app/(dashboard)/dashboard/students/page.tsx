import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { students, studentMemberships } from "@/lib/db/schema"
import { eq, inArray, sql } from "drizzle-orm"
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
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { StudentDialog } from "@/components/crm/student-dialog"
import { EntityAvatar } from "@/components/crm/entity-avatar"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { StudentMembershipsCell } from "@/components/crm/student-memberships-cell"
import { loadStudentMembershipsData } from "@/lib/db/queries/student-memberships"
import Link from "next/link"
import { hrefWith, parseIdsParam } from "@/lib/utils/url-params"
import { nationalityFlag } from "@/lib/utils/country-flag"
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/actions/students"
import { ensureDefaultMembershipPlans } from "@/lib/actions/membership-plans"
import { parsePagination } from "@/lib/utils/pagination"
import { DataTablePagination } from "@/components/crm/data-table-pagination"
import { PageHeader } from "@/components/crm/page-header"

export const dynamic = "force-dynamic"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string
    page?: string
    perPage?: string
    editEmail?: string
  }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const params = await searchParams
  const { studentId = "", editEmail } = params
  const selectedIds = parseIdsParam(studentId)
  const { page, perPage, offset } = parsePagination(params)

  const baseParams = {
    studentId,
    page: params.page,
    perPage: params.perPage,
  }

  await ensureDefaultMembershipPlans()

  const { planOptions, membershipsByStudent, checkinsByMembership } =
    await loadStudentMembershipsData(null)

  // Light query: just name+email for the filter combobox (cheap even at 1000+ rows).
  const allForFilter = await db
    .select({ email: students.email, name: students.name })
    .from(students)
    .orderBy(students.name)

  const whereClause =
    selectedIds.size > 0
      ? inArray(students.email, Array.from(selectedIds))
      : undefined

  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(whereClause)

  const rows = await db
    .select({
      email: students.email,
      name: students.name,
      passport: students.passport,
      phone: students.phone,
      nationality: students.nationality,
      notes: students.notes,
      membershipCount: sql<number>`count(${studentMemberships.id})::int`,
    })
    .from(students)
    .leftJoin(
      studentMemberships,
      eq(studentMemberships.studentEmail, students.email),
    )
    .where(whereClause)
    .groupBy(students.email)
    .orderBy(students.name)
    .limit(perPage)
    .offset(offset)

  const items = allForFilter.map((r) => ({
    id: r.email,
    label: r.name,
    description: r.email,
  }))

  const editingStudent = editEmail
    ? await db
        .select({
          email: students.email,
          name: students.name,
          phone: students.phone,
          passport: students.passport,
          nationality: students.nationality,
          notes: students.notes,
        })
        .from(students)
        .where(eq(students.email, editEmail))
        .limit(1)
        .then((rs) => rs[0])
    : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="All students enrolled at the studio."
        actions={<StudentDialog mode="create" action={createStudent} />}
      />

      <div className="md:max-w-md">
        <EntitySearchFilter
          multiple
          items={items}
          paramName="studentId"
          value={studentId}
          placeholder="Search students by name or email..."
          searchPlaceholder="Search students..."
          emptyText="No students match."
          allLabel="All students"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{total} students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead className="text-right">Memberships</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {total === 0 ? "No students yet." : "No students match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.email}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          name={r.name}
                          flag={nationalityFlag(r.nationality) || null}
                        />
                        <span>{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.passport ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <StudentMembershipsCell
                        studentEmail={r.email}
                        studentName={r.name}
                        memberships={membershipsByStudent.get(r.email) ?? []}
                        plans={planOptions}
                        checkinsByMembership={checkinsByMembership}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Link
                            href={hrefWith({ ...baseParams, editEmail: r.email })}
                            aria-label={`Edit ${r.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <DeleteRowButton
                          action={deleteStudent.bind(null, r.email)}
                          confirmText={`Delete "${r.name}"? Their memberships and attendance will also be removed.`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            total={total}
            page={page}
            perPage={perPage}
            label="students"
          />
        </CardContent>
      </Card>

      {editingStudent ? (
        <StudentDialog
          key={editingStudent.email}
          mode="edit"
          values={{
            email: editingStudent.email,
            name: editingStudent.name,
            phone: editingStudent.phone,
            passport: editingStudent.passport,
            nationality: editingStudent.nationality,
            notes: editingStudent.notes,
          }}
          action={updateStudent}
          trigger={false}
          defaultOpen
          onCloseHref={hrefWith(baseParams)}
        />
      ) : null}
    </div>
  )
}
