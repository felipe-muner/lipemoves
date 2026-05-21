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

export interface PersonalExpenseValues {
  categoryId?: string
  amountThb?: number
  spentOn?: string | null
  notes?: string | null
}

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  try {
    return format(parseISO(iso), "yyyy-MM-dd")
  } catch {
    return ""
  }
}

export function PersonalExpenseDialog({
  mode,
  values,
  categories,
  action,
  createCategoryAction,
  trigger,
}: {
  mode: "create" | "edit"
  values?: PersonalExpenseValues
  categories: CategoryOption[]
  action: (formData: FormData) => Promise<void>
  createCategoryAction: (formData: FormData) => Promise<{
    id: string
    name: string
    color: string
  }>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()
  const today = format(new Date(), "yyyy-MM-dd")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Expense added" : "Expense updated",
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
              {mode === "create" ? "Log expense" : "Edit expense"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <CategoryCombobox
                name="categoryId"
                categories={categories}
                value={values?.categoryId}
                createAction={createCategoryAction}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="amountThb">Amount (THB)</Label>
                <Input
                  id="amountThb"
                  name="amountThb"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  defaultValue={values?.amountThb ?? ""}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="spentOn">Date</Label>
                <Input
                  id="spentOn"
                  name="spentOn"
                  type="date"
                  defaultValue={toDateInput(values?.spentOn) || today}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Optional"
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
              {pending ? "Saving..." : mode === "create" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
