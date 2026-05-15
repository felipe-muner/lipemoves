import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import {
  students,
  studentMemberships,
  membershipPlans,
} from "@/lib/db/schema"
import { desc, eq, inArray, sql } from "drizzle-orm"
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
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { StudentMembershipsDialog } from "@/components/crm/student-memberships-dialog"
import { parseIdsParam } from "@/lib/utils/url-params"
import { nationalityFlag } from "@/lib/utils/country-flag"
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/actions/students"
import {
  recordStudentMembership,
  deleteStudentMembership,
} from "@/lib/actions/student-memberships"
import { ensureDefaultMembershipPlans } from "@/lib/actions/membership-plans"
import { parsePagination } from "@/lib/utils/pagination"
import { DataTablePagination } from "@/components/crm/data-table-pagination"

export const dynamic = "force-dynamic"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string
    page?: string
    perPage?: string
  }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const params = await searchParams
  const { studentId = "" } = params
  const selectedIds = parseIdsParam(studentId)
  const { page, perPage, offset } = parsePagination(params)

  await ensureDefaultMembershipPlans()

  const plans = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.isActive, true))
    .orderBy(membershipPlans.sortOrder, membershipPlans.name)

  const allMemberships = await db
    .select({
      id: studentMemberships.id,
      studentEmail: studentMemberships.studentEmail,
      planId: studentMemberships.planId,
      planName: membershipPlans.name,
      planColor: membershipPlans.color,
      type: studentMemberships.type,
      startsOn: studentMemberships.startsOn,
      endsOn: studentMemberships.endsOn,
      classesRemaining: studentMemberships.classesRemaining,
      pricePaidThb: studentMemberships.pricePaidThb,
      notes: studentMemberships.notes,
      createdAt: studentMemberships.createdAt,
    })
    .from(studentMemberships)
    .leftJoin(
      membershipPlans,
      eq(membershipPlans.id, studentMemberships.planId),
    )
    .orderBy(desc(studentMemberships.createdAt))

  const membershipsByStudent = new Map<string, typeof allMemberships>()
  for (const m of allMemberships) {
    const list = membershipsByStudent.get(m.studentEmail) ?? []
    list.push(m)
    membershipsByStudent.set(m.studentEmail, list)
  }

  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    priceThb: p.priceThb,
    durationDays: p.durationDays,
    classesIncluded: p.classesIncluded,
    color: p.color,
  }))

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            All students enrolled at the studio.
          </p>
        </div>
        <StudentDialog mode="create" action={createStudent} />
      </div>

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
                <TableHead>Nationality</TableHead>
                <TableHead className="text-right">Memberships</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {total === 0 ? "No students yet." : "No students match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.email}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.passport ?? "—"}</TableCell>
                    <TableCell>
                      {r.nationality ? (
                        <span className="inline-flex items-center gap-2">
                          {nationalityFlag(r.nationality) && (
                            <span
                              className="text-base leading-none"
                              aria-hidden
                            >
                              {nationalityFlag(r.nationality)}
                            </span>
                          )}
                          <span>{r.nationality}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <StudentMembershipsDialog
                        studentEmail={r.email}
                        studentName={r.name}
                        memberships={(membershipsByStudent.get(r.email) ?? []).map(
                          (m) => ({
                            id: m.id,
                            planId: m.planId,
                            planName: m.planName,
                            planColor: m.planColor,
                            type: m.type,
                            startsOn: m.startsOn,
                            endsOn: m.endsOn,
                            classesRemaining: m.classesRemaining,
                            pricePaidThb: m.pricePaidThb,
                            notes: m.notes,
                            createdAt: m.createdAt,
                          }),
                        )}
                        plans={planOptions}
                        recordAction={recordStudentMembership}
                        deleteAction={deleteStudentMembership}
                        trigger={
                          <button className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs hover:bg-secondary/80">
                            <span className="font-medium">
                              {r.membershipCount}
                            </span>
                            <span className="text-muted-foreground">
                              {r.membershipCount === 1 ? "plan" : "plans"}
                            </span>
                          </button>
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <StudentDialog
                          mode="edit"
                          values={{
                            email: r.email,
                            name: r.name,
                            phone: r.phone,
                            passport: r.passport,
                            nationality: r.nationality,
                            notes: r.notes,
                          }}
                          action={updateStudent.bind(null, r.email)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
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
    </div>
  )
}
