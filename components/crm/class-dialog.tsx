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
  priceThb?: number | null
  teacherSharePercent?: number | null
  capacity?: number | null
  teacherId?: string | null
  locationId?: string | null
}

export interface LocationOption {
  id: string
  name: string
  color: string
  isDefault: boolean
}

function toLocalDatetimeInput(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface BaseProps {
  mode: "create" | "edit"
  values?: ClassDialogValues
  action: (formData: FormData) => Promise<void>
  teachers: { id: string; name: string }[]
  locations: LocationOption[]
}

interface ControlledProps extends BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: never
}

interface UncontrolledProps extends BaseProps {
  trigger?: React.ReactNode
  open?: never
  onOpenChange?: never
}

export function ClassDialog(props: ControlledProps | UncontrolledProps) {
  const { mode, values, action, teachers, locations } = props
  const defaultLocationId =
    locations.find((l) => l.isDefault)?.id ?? locations[0]?.id ?? ""
  const isControlled = "open" in props && props.open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = isControlled ? (props as ControlledProps).open : internalOpen
  const setOpen = isControlled
    ? (props as ControlledProps).onOpenChange
    : setInternalOpen

  const [pending, startTransition] = React.useTransition()
  const [teacherId, setTeacherId] = React.useState(values?.teacherId ?? "")
  const [locationId, setLocationId] = React.useState(
    values?.locationId ?? defaultLocationId,
  )
  const router = useRouter()

  React.useEffect(() => {
    setTeacherId(values?.teacherId ?? "")
    setLocationId(values?.locationId ?? defaultLocationId)
  }, [values?.teacherId, values?.locationId, defaultLocationId, open])

  const trigger = !isControlled
    ? (props as UncontrolledProps).trigger ?? (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New class
        </Button>
      )
    : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Teacher / host</Label>
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
              <div className="grid gap-2">
                <Label>Location</Label>
                <input type="hidden" name="locationId" value={locationId} />
                <Select
                  value={locationId || "none"}
                  onValueChange={(v) => setLocationId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— no location —</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded"
                            style={{ background: l.color }}
                          />
                          {l.name}
                          {l.isDefault && (
                            <span className="text-xs text-muted-foreground">
                              (default)
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  key={values?.scheduledAt ?? ""}
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
                  key={`d-${values?.durationMinutes ?? ""}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priceThb">Price</Label>
                <Input
                  id="priceThb"
                  name="priceThb"
                  type="number"
                  min="0"
                  step="10"
                  defaultValue={values?.priceThb ?? 0}
                  key={`p-${values?.priceThb ?? ""}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="teacherSharePercent">Teacher share</Label>
                <Input
                  id="teacherSharePercent"
                  name="teacherSharePercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={values?.teacherSharePercent ?? 0}
                  key={`sh-${values?.teacherSharePercent ?? ""}`}
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
                  key={`c-${values?.capacity ?? ""}`}
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
                key={`desc-${values?.description ?? ""}`}
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
