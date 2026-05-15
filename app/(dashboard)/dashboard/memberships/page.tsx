import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { membershipPlans } from "@/lib/db/schema"
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
import { MembershipPlanDialog } from "@/components/crm/membership-plan-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { Money } from "@/components/crm/money"
import {
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  ensureDefaultMembershipPlans,
} from "@/lib/actions/membership-plans"

export const dynamic = "force-dynamic"

const TYPE_LABELS: Record<string, string> = {
  drop_in: "Drop-in",
  monthly: "Monthly",
  class_pack: "Class pack",
  free_pass: "Free pass",
  custom: "Custom",
}

export default async function MembershipsPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultMembershipPlans()

  const rows = await db
    .select()
    .from(membershipPlans)
    .orderBy(membershipPlans.sortOrder, membershipPlans.name)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Memberships
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan templates students can purchase: drop-in, class packs, monthly
            unlimited, free intro, ...
          </p>
        </div>
        <MembershipPlanDialog mode="create" action={createMembershipPlan} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Validity</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No plans yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span
                        className="inline-block h-6 w-6 rounded-md border border-black/10"
                        style={{ background: p.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.name}
                      {p.description && (
                        <div className="text-xs font-normal text-muted-foreground">
                          {p.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.durationDays != null
                        ? `${p.durationDays} day${p.durationDays === 1 ? "" : "s"}`
                        : "Unlimited"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.classesIncluded != null
                        ? p.classesIncluded
                        : "Unlimited"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money thb={p.priceThb} />
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
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
                        <MembershipPlanDialog
                          mode="edit"
                          values={{
                            name: p.name,
                            type: p.type,
                            durationDays: p.durationDays,
                            classesIncluded: p.classesIncluded,
                            priceThb: p.priceThb,
                            color: p.color,
                            description: p.description,
                            isActive: p.isActive,
                            sortOrder: p.sortOrder,
                          }}
                          action={updateMembershipPlan.bind(null, p.id)}
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
                          action={deleteMembershipPlan.bind(null, p.id)}
                          confirmText={`Delete plan "${p.name}"? Only works if no student records reference it.`}
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
