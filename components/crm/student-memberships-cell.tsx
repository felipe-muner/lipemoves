import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  const isEmpty = memberships.length === 0
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
      autoOpenAdd={isEmpty}
      triggerClassName={cn(
        buttonVariants({
          variant: isEmpty ? "outline" : "secondary",
          size: "sm",
        }),
        "h-8 px-3 text-xs",
        isEmpty ? "gap-1 border-dashed" : "gap-1.5",
      )}
      triggerChildren={
        isEmpty ? (
          <>
            <Plus className="h-3.5 w-3.5" />
            Add plan
          </>
        ) : (
          <>
            <Badge
              variant="default"
              className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {memberships.length}
            </Badge>
            {memberships.length === 1 ? "plan" : "plans"}
          </>
        )
      }
    />
  )
}
