"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteRowButton } from "./delete-row-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Money } from "./money"

export interface PlanOption {
  id: string
  name: string
  type: string
  priceThb: number
  durationDays: number | null
  classesIncluded: number | null
  color: string
}

export interface MembershipRow {
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

const TYPE_LABELS: Record<string, string> = {
  drop_in: "Drop-in",
  monthly: "Monthly",
  class_pack: "Class pack",
  free_pass: "Free pass",
  custom: "Custom",
}

export function StudentMembershipsDialog({
  studentEmail,
  studentName,
  memberships,
  plans,
  recordAction,
  deleteAction,
  trigger,
}: {
  studentEmail: string
  studentName: string
  memberships: MembershipRow[]
  plans: PlanOption[]
  recordAction: (formData: FormData) => Promise<void>
  deleteAction: (id: string) => Promise<void>
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const today = format(new Date(), "yyyy-MM-dd")
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>(
    plans[0]?.id ?? "",
  )
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  const lifetimeValue = memberships.reduce((a, m) => a + m.pricePaidThb, 0)

  function onAdd(formData: FormData) {
    formData.set("studentEmail", studentEmail)
    startTransition(async () => {
      try {
        await recordAction(formData)
        toast.success("Membership recorded")
        setAdding(false)
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message ?? "Something went wrong")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{studentName}'s memberships</DialogTitle>
          <DialogDescription>
            {memberships.length} purchases · lifetime value{" "}
            <Money thb={lifetimeValue} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {memberships.length === 0 ? (
            <p className="rounded border border-dashed py-6 text-center text-sm text-muted-foreground">
              No memberships yet.
            </p>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => {
                const expired =
                  m.endsOn && parseISO(m.endsOn) < new Date()
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            background: m.planColor ?? "#64748b",
                          }}
                        />
                        <span className="text-sm font-medium">
                          {m.planName ?? TYPE_LABELS[m.type] ?? m.type}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[m.type] ?? m.type}
                        </Badge>
                        {expired && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(m.startsOn), "MMM dd, yyyy")}
                        {m.endsOn && (
                          <> → {format(parseISO(m.endsOn), "MMM dd, yyyy")}</>
                        )}
                        {m.classesRemaining != null && (
                          <> · {m.classesRemaining} class
                            {m.classesRemaining === 1 ? "" : "es"} left</>
                        )}
                      </div>
                      {m.notes && (
                        <div className="text-xs text-muted-foreground">
                          {m.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm font-medium">
                        <Money thb={m.pricePaidThb} />
                      </div>
                      <DeleteRowButton
                        action={() => deleteAction(m.id)}
                        confirmText={`Delete this ${
                          m.planName ?? m.type
                        } membership? This won't refund the student.`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!adding ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding(true)}
              disabled={plans.length === 0}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add membership
            </Button>
          ) : (
            <form
              action={onAdd}
              className="space-y-3 rounded-md border bg-muted/30 p-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="planId" className="text-xs">
                    Plan
                  </Label>
                  <select
                    id="planId"
                    name="planId"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceThb} ฿
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pricePaidThb" className="text-xs">
                    Price (THB)
                  </Label>
                  <Input
                    id="pricePaidThb"
                    name="pricePaidThb"
                    type="number"
                    min={0}
                    defaultValue={selectedPlan?.priceThb ?? 0}
                    key={selectedPlanId + "-price"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="startsOn" className="text-xs">
                    Starts on
                  </Label>
                  <Input
                    id="startsOn"
                    name="startsOn"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="endsOn" className="text-xs">
                    Ends on
                  </Label>
                  <Input
                    id="endsOn"
                    name="endsOn"
                    type="date"
                    placeholder="Auto from plan"
                  />
                </div>
              </div>

              {selectedPlan?.classesIncluded != null && (
                <div className="grid gap-1.5">
                  <Label htmlFor="classesRemaining" className="text-xs">
                    Classes remaining
                  </Label>
                  <Input
                    id="classesRemaining"
                    name="classesRemaining"
                    type="number"
                    min={0}
                    defaultValue={selectedPlan.classesIncluded}
                    key={selectedPlanId + "-classes"}
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="notes" className="text-xs">
                  Notes
                </Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>

              <input type="hidden" name="type" value={selectedPlan?.type ?? "custom"} />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Saving..." : "Save membership"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
