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

export interface ExpenseCategoryValues {
  name?: string
  color?: string
  description?: string | null
  isActive?: boolean
  sortOrder?: number
}

export function ExpenseCategoryDialog({
  mode,
  values,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: ExpenseCategoryValues
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
            New category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Category created" : "Category saved",
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
              {mode === "create" ? "New expense category" : "Edit category"}
            </DialogTitle>
            <DialogDescription>
              Buckets used when classifying expenses. Color shows up in charts.
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue={values?.color ?? "#64748b"}
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
                  ? "Create"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
