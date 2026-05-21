"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CategoryCombobox,
  type CategoryOption,
} from "@/components/crm/category-combobox"

export interface MovementValues {
  categoryId?: string
  performedOn?: string | null
  durationMin?: number | null
  notes?: string | null
}

function toDateTimeInput(iso: string | null | undefined) {
  if (!iso) return ""
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
  } catch {
    return ""
  }
}

export function MovementDialog({
  mode,
  values,
  categories,
  action,
  createCategoryAction,
  trigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  mode: "create" | "edit"
  values?: MovementValues
  categories: CategoryOption[]
  action: (formData: FormData) => Promise<void>
  createCategoryAction: (formData: FormData) => Promise<{
    id: string
    name: string
    color: string
  }>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()
  const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log movement
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[460px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Movement logged" : "Movement updated",
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
              {mode === "create" ? "Log movement" : "Edit movement"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <CategoryCombobox
                name="categoryId"
                categories={categories}
                value={values?.categoryId}
                defaultColor="#22c55e"
                createAction={createCategoryAction}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="performedOn">When</Label>
                <Input
                  id="performedOn"
                  name="performedOn"
                  type="datetime-local"
                  defaultValue={
                    toDateTimeInput(values?.performedOn) || nowLocal
                  }
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="durationMin">Duration (min)</Label>
                <Input
                  id="durationMin"
                  name="durationMin"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5}
                  defaultValue={values?.durationMin ?? ""}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="How it felt, what you worked on..."
                defaultValue={values?.notes ?? ""}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : mode === "create" ? "Log" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
