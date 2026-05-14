import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { students, studentMemberships } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
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

export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const rows = await db
    .select({
      email: students.email,
      name: students.name,
      passport: students.passport,
      phone: students.phone,
      nationality: students.nationality,
      membershipCount: sql<number>`count(${studentMemberships.id})::int`,
    })
    .from(students)
    .leftJoin(
      studentMemberships,
      eq(studentMemberships.studentEmail, students.email),
    )
    .groupBy(students.email)
    .orderBy(students.name)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          All students enrolled at the studio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead className="text-right">Memberships</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No students yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.email}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.passport ?? "—"}</TableCell>
                    <TableCell>{r.nationality ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{r.membershipCount}</Badge>
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
