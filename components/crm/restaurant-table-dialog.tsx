"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Status = "open" | "occupied" | "cleaning" | "closed"

export interface RestaurantTableValues {
  id?: string
  tableNumber?: string
  room?: string | null
  seats?: number | null
  status?: Status
  isActive?: boolean
  notes?: string | null
}

export function RestaurantTableDialog({
  mode,
  values,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: RestaurantTableValues
  action: (formData: FormData) => Promise<void>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [status, setStatus] = React.useState<Status>(values?.status ?? "open")
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New table
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <form
          action={(formData) => {
            formData.set("status", status)
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(mode === "create" ? "Table created" : "Table saved")
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
              {mode === "create" ? "New restaurant table" : "Edit table"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tableNumber">Number *</Label>
                <Input
                  id="tableNumber"
                  name="tableNumber"
                  required
                  defaultValue={values?.tableNumber ?? ""}
                  placeholder="T1, A2, Room 3..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  name="seats"
                  type="number"
                  min={1}
                  defaultValue={values?.seats ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="room">Room / area</Label>
              <Input
                id="room"
                name="room"
                defaultValue={values?.room ?? ""}
                placeholder="Indoor, terrace, beach..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={values?.notes ?? ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={values?.isActive ?? true}
                className="h-4 w-4 rounded border"
              />
              Active
            </label>
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
