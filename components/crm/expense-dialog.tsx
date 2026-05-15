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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface CategoryOption {
  id: string
  name: string
  color: string
}

export interface EmployeeOption {
  id: string
  name: string
}

export interface ExpenseValues {
  categoryId?: string
  amountThb?: number
  incurredOn?: string | null
  vendor?: string | null
  description?: string | null
  employeeId?: string | null
  paymentMethod?: string | null
  paidAt?: string | null
  receiptUrl?: string | null
}

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  try {
    return format(parseISO(iso), "yyyy-MM-dd")
  } catch {
    return ""
  }
}

export function ExpenseDialog({
  mode,
  values,
  categories,
  employees,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: ExpenseValues
  categories: CategoryOption[]
  employees: EmployeeOption[]
  action: (formData: FormData) => Promise<void>
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
      <DialogContent className="sm:max-w-[520px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Expense recorded" : "Expense saved",
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
              {mode === "create" ? "New expense" : "Edit expense"}
            </DialogTitle>
            <DialogDescription>
              Track money the center spent: rent, utilities, supplies, salaries, ...
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue={values?.categoryId ?? categories[0]?.id ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amountThb">Amount (THB) *</Label>
                <Input
                  id="amountThb"
                  name="amountThb"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={values?.amountThb ?? ""}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="incurredOn">Date *</Label>
                <Input
                  id="incurredOn"
                  name="incurredOn"
                  type="date"
                  required
                  defaultValue={toDateInput(values?.incurredOn) || today}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paidAt">Paid on</Label>
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  defaultValue={toDateInput(values?.paidAt)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor / payee</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  defaultValue={values?.vendor ?? ""}
                  placeholder="e.g., PEA, landlord"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment method</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  defaultValue={values?.paymentMethod ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">—</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee (for salaries)</Label>
              <select
                id="employeeId"
                name="employeeId"
                defaultValue={values?.employeeId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">—</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description / notes</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={values?.description ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receiptUrl">Receipt URL</Label>
              <Input
                id="receiptUrl"
                name="receiptUrl"
                type="url"
                defaultValue={values?.receiptUrl ?? ""}
                placeholder="https://..."
              />
            </div>
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
                  ? "Save expense"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
