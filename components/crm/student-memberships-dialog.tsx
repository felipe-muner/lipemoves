"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addDays, format, parseISO } from "date-fns"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteRowButton } from "./delete-row-button"
import { EntityCombobox } from "./entity-combobox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

export interface MembershipCheckinDay {
  day: string
  entries: number
  decremented: boolean
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
  checkins: MembershipCheckinDay[]
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
  triggerClassName,
  triggerChildren,
  autoOpenAdd = false,
}: {
  studentEmail: string
  studentName: string
  memberships: MembershipRow[]
  plans: PlanOption[]
  recordAction: (formData: FormData) => Promise<void>
  deleteAction: (id: string) => Promise<void>
  triggerClassName?: string
  triggerChildren: React.ReactNode
  autoOpenAdd?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [adding, setAdding] = React.useState(false)

  React.useEffect(() => {
    if (open && autoOpenAdd && memberships.length === 0) setAdding(true)
  }, [open, autoOpenAdd, memberships.length])
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const today = format(new Date(), "yyyy-MM-dd")
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>(
    plans[0]?.id ?? "",
  )
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const [startsOn, setStartsOn] = React.useState<string>(today)
  const [endsOn, setEndsOn] = React.useState<string>("")

  React.useEffect(() => {
    if (!selectedPlan?.durationDays || !startsOn) {
      setEndsOn("")
      return
    }
    setEndsOn(
      format(
        addDays(parseISO(startsOn), selectedPlan.durationDays),
        "yyyy-MM-dd",
      ),
    )
  }, [selectedPlan, startsOn])

  const planItems = plans.map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.priceThb} ฿`,
    color: p.color,
  }))

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
      <DialogTrigger className={triggerClassName}>
        {triggerChildren}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{studentName}'s memberships</DialogTitle>
          <DialogDescription>
            {memberships.length} purchases · lifetime value{" "}
            <Money thb={lifetimeValue} />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto py-2 pr-1">
          {memberships.length === 0 ? (
            <p className="rounded border border-dashed py-6 text-center text-sm text-muted-foreground">
              No memberships yet.
            </p>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => (
                <MembershipCard
                  key={m.id}
                  membership={m}
                  deleteAction={deleteAction}
                />
              ))}
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
                  <Label className="text-xs">Plan</Label>
                  <EntityCombobox
                    items={planItems}
                    value={selectedPlanId}
                    onValueChange={(v) => setSelectedPlanId(v ?? "")}
                    placeholder="Select a plan..."
                    searchPlaceholder="Search plans..."
                    emptyText="No plans found."
                  />
                  <input type="hidden" name="planId" value={selectedPlanId} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pricePaidThb" className="text-xs">
                    Price (THB)
                  </Label>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          id="pricePaidThb"
                          name="pricePaidThb"
                          type="number"
                          readOnly
                          tabIndex={-1}
                          value={selectedPlan?.priceThb ?? 0}
                          className="cursor-not-allowed bg-muted"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        To change the price, edit the plan on the Memberships
                        page.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    value={startsOn}
                    onChange={(e) => setStartsOn(e.target.value)}
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
                    value={endsOn}
                    onChange={(e) => setEndsOn(e.target.value)}
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

function MembershipCard({
  membership: m,
  deleteAction,
}: {
  membership: MembershipRow
  deleteAction: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = React.useState(false)
  const expired = m.endsOn ? parseISO(m.endsOn) < new Date() : false
  const isUnlimited = m.classesRemaining == null
  // For unlimited plans, every unique check-in day counts. For class-packs,
  // only days that actually decremented a credit count.
  const daysUsed = isUnlimited
    ? m.checkins.length
    : m.checkins.filter((c) => c.decremented).length
  const totalEntries = m.checkins.reduce((sum, c) => sum + c.entries, 0)
  // For class-pack plans we know the cap (used + remaining). For unlimited
  // plans we just show entries.
  const totalDays =
    m.classesRemaining != null ? daysUsed + m.classesRemaining : null

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: m.planColor ?? "#64748b" }}
            />
            <span className="text-sm font-medium">
              {m.planName ?? TYPE_LABELS[m.type] ?? m.type}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {TYPE_LABELS[m.type] ?? m.type}
            </Badge>
            {expired && (
              <Badge
                variant="outline"
                className="text-[10px] text-amber-600"
              >
                Expired
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(parseISO(m.startsOn), "MMM dd, yyyy")}
            {m.endsOn && (
              <> → {format(parseISO(m.endsOn), "MMM dd, yyyy")}</>
            )}
          </div>
          <div className="text-xs">
            {totalDays != null ? (
              <span className="font-medium">
                {daysUsed} / {totalDays} days used
              </span>
            ) : (
              <span className="font-medium">
                {daysUsed} {daysUsed === 1 ? "day" : "days"} attended
              </span>
            )}
            {totalEntries > daysUsed && (
              <span className="text-muted-foreground">
                {" "}
                · {totalEntries} total entries
              </span>
            )}
          </div>
          {m.notes && (
            <div className="text-xs text-muted-foreground">{m.notes}</div>
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

      {m.checkins.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {expanded ? "Hide" : "Show"} check-in history
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 border-t pt-2">
              {m.checkins.map((c) => (
                <li
                  key={c.day}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{format(parseISO(c.day), "EEE, MMM dd, yyyy")}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span>
                      {c.entries} {c.entries === 1 ? "entry" : "entries"}
                    </span>
                    {c.decremented ? (
                      <Badge variant="outline" className="text-[10px]">
                        −1 day
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        no charge
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
