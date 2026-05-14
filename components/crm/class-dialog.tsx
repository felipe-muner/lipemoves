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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ClassDialogValues {
  name?: string
  description?: string | null
  scheduledAt?: string
  durationMinutes?: number | null
  dropInPriceCents?: number | null
  capacity?: number | null
  teacherId?: string | null
}

function toLocalDatetimeInput(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ClassDialog({
  mode,
  values,
  action,
  teachers,
  trigger,
}: {
  mode: "create" | "edit"
  values?: ClassDialogValues
  action: (formData: FormData) => Promise<void>
  teachers: { id: string; name: string }[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [teacherId, setTeacherId] = React.useState(values?.teacherId ?? "")
  const router = useRouter()

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setTeacherId(values?.teacherId ?? "")
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(mode === "create" ? "Class created" : "Class saved")
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
              {mode === "create" ? "New class" : "Edit class"}
            </DialogTitle>
            <DialogDescription>
              Schedule a class and assign a teacher.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Class name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={values?.name ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label>Teacher</Label>
              <input type="hidden" name="teacherId" value={teacherId} />
              <Select
                value={teacherId || "none"}
                onValueChange={(v) => setTeacherId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— no teacher —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduledAt">Date / time *</Label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalDatetimeInput(values?.scheduledAt)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="durationMinutes">Duration (min)</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  defaultValue={values?.durationMinutes ?? 60}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dropInPriceThb">Drop-in (THB)</Label>
                <Input
                  id="dropInPriceThb"
                  name="dropInPriceThb"
                  type="number"
                  min="0"
                  step="10"
                  defaultValue={Math.round((values?.dropInPriceCents ?? 0) / 100)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={values?.capacity ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={values?.description ?? ""}
              />
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
