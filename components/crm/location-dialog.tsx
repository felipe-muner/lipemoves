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
import { ColorPicker } from "@/components/crm/color-picker"

export interface LocationDialogValues {
  id?: string
  name?: string
  description?: string | null
  color?: string
  isDefault?: boolean
  isActive?: boolean
}

export function LocationDialog({
  mode,
  values,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: LocationDialogValues
  action: (formData: FormData) => Promise<void>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [color, setColor] = React.useState(values?.color ?? "#fbbf24")
  const router = useRouter()

  React.useEffect(() => {
    if (open) setColor(values?.color ?? "#fbbf24")
  }, [open, values?.color])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(
                  mode === "create" ? "Location created" : "Location saved",
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
              {mode === "create" ? "New location" : "Edit location"}
            </DialogTitle>
            <DialogDescription>
              A shala or room — pick a color so it&apos;s easy to spot on the
              calendar.
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
                placeholder="Main Shala"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} name="color" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={values?.description ?? ""}
                placeholder="Optional notes (e.g. capacity, ground floor, AC, etc.)"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={values?.isActive ?? true}
                  className="h-4 w-4 rounded border"
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={values?.isDefault ?? false}
                  className="h-4 w-4 rounded border"
                />
                Default (used when a class has no location set)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
