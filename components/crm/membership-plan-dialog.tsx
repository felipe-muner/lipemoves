"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export interface MembershipPlanValues {
  name?: string
  type?: string
  durationDays?: number | null
  classesIncluded?: number | null
  priceThb?: number
  color?: string
  description?: string | null
  isActive?: boolean
  sortOrder?: number
}

const TYPE_OPTIONS = [
  { value: "drop_in", label: "Drop-in" },
  { value: "class_pack", label: "Class pack" },
  { value: "monthly", label: "Monthly / period" },
  { value: "free_pass", label: "Free pass" },
  { value: "custom", label: "Custom" },
]

export function MembershipPlanDialog({
  mode,
  values,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: MembershipPlanValues
  action: (formData: FormData) => Promise<void>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Plan created" : "Plan saved",
                )
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error((err as Error).message ?? "Something went wrong")
              }
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New membership plan" : "Edit plan"}
            </DialogTitle>
            <DialogDescription>
              Plan templates make it fast and consistent to record student
              purchases.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={values?.name ?? ""}
                placeholder="e.g. 10 Class Pack"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={values?.type ?? "custom"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceThb">Price (THB)</Label>
                <Input
                  id="priceThb"
                  name="priceThb"
                  type="number"
                  min={0}
                  defaultValue={values?.priceThb ?? 0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="durationDays">Validity (days)</Label>
                <Input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  min={0}
                  defaultValue={values?.durationDays ?? ""}
                  placeholder="Blank = unlimited time"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="classesIncluded">Classes included</Label>
                <Input
                  id="classesIncluded"
                  name="classesIncluded"
                  type="number"
                  min={0}
                  defaultValue={values?.classesIncluded ?? ""}
                  placeholder="Blank = unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue={values?.color ?? "#0ea5e9"}
                  className="h-10 p-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={values?.sortOrder ?? 50}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={values?.description ?? ""}
              />
            </div>

            {mode === "edit" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={values?.isActive ?? true}
                  className="h-4 w-4 rounded border"
                />
                Active
              </label>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : mode === "create"
                  ? "Create plan"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
