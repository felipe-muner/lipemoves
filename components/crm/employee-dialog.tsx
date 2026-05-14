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
import { ChipMultiSelect, type ChipOption } from "@/components/crm/chip-multiselect"

export interface EmployeeDialogValues {
  id?: string
  name?: string
  email?: string
  phone?: string | null
  passport?: string | null
  bio?: string | null
  isActive?: boolean
  roleIds?: string[]
  teamIds?: string[]
}

export function EmployeeDialog({
  mode,
  values,
  roles,
  teams,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: EmployeeDialogValues
  roles: ChipOption[]
  teams: ChipOption[]
  action: (formData: FormData) => Promise<void>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [roleIds, setRoleIds] = React.useState<string[]>(values?.roleIds ?? [])
  const [teamIds, setTeamIds] = React.useState<string[]>(values?.teamIds ?? [])
  const router = useRouter()

  React.useEffect(() => {
    if (open) {
      setRoleIds(values?.roleIds ?? [])
      setTeamIds(values?.teamIds ?? [])
    }
  }, [open, values?.roleIds, values?.teamIds])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <form
          action={(formData) => {
            // Embed role + team selections via hidden inputs
            roleIds.forEach((id) => formData.append("roleId", id))
            teamIds.forEach((id) => formData.append("teamId", id))
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(mode === "create" ? "Employee created" : "Employee saved")
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
              {mode === "create" ? "New employee" : "Edit employee"}
            </DialogTitle>
            <DialogDescription>
              One person can hold multiple roles (teacher, waiter, ...) and
              belong to multiple teams.
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Gmail for login) *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={values?.email ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={values?.phone ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passport">Passport</Label>
                <Input
                  id="passport"
                  name="passport"
                  defaultValue={values?.passport ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Roles</Label>
              <ChipMultiSelect
                options={roles}
                value={roleIds}
                onChange={setRoleIds}
                placeholder="No roles assigned"
              />
            </div>
            <div className="grid gap-2">
              <Label>Teams</Label>
              <ChipMultiSelect
                options={teams}
                value={teamIds}
                onChange={setTeamIds}
                placeholder="No teams assigned"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={values?.bio ?? ""}
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
