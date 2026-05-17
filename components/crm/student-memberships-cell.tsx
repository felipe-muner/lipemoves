import {
  StudentMembershipsDialog,
  type PlanOption,
} from "@/components/crm/student-memberships-dialog"
import {
  recordStudentMembership,
  deleteStudentMembership,
} from "@/lib/actions/student-memberships"
import type { CheckinDay } from "@/lib/db/queries/student-memberships"

type Membership = {
  id: string
  planId: string | null
  planName: string | null
  planColor: string | null
  type: string
  startsOn: string
  endsOn: string | null
  classesRemaining: number | null
  pricePaidThb: number
  notes: string | null
  createdAt: string
}

export function StudentMembershipsCell({
  studentEmail,
  studentName,
  memberships,
  plans,
  checkinsByMembership,
}: {
  studentEmail: string
  studentName: string
  memberships: Membership[]
  plans: PlanOption[]
  checkinsByMembership: Map<string, CheckinDay[]>
}) {
  return (
    <StudentMembershipsDialog
      studentEmail={studentEmail}
      studentName={studentName}
      memberships={memberships.map((m) => ({
        ...m,
        checkins: checkinsByMembership.get(m.id) ?? [],
      }))}
      plans={plans}
      recordAction={recordStudentMembership}
      deleteAction={deleteStudentMembership}
      trigger={
        <button className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs hover:bg-secondary/80">
          <span className="font-medium">{memberships.length}</span>
          <span className="text-muted-foreground">
            {memberships.length === 1 ? "plan" : "plans"}
          </span>
        </button>
      }
    />
  )
}
