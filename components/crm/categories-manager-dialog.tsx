"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tags, Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
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

export interface CategoryRow {
  id: string
  name: string
  color: string
  isActive: boolean
}

const PRESET_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#0ea5e9",
  "#22c55e",
  "#84cc16",
  "#64748b",
]

export function CategoriesManagerDialog({
  title = "Categories",
  itemLabel = "category",
  categories,
  createAction,
  updateAction,
  deleteAction,
}: {
  title?: string
  itemLabel?: string
  categories: CategoryRow[]
  createAction: (formData: FormData) => Promise<{
    id: string
    name: string
    color: string
  }>
  updateAction: (id: string, formData: FormData) => Promise<void>
  deleteAction: (id: string) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const [newName, setNewName] = React.useState("")
  const [newColor, setNewColor] = React.useState(PRESET_COLORS[0])

  function handleCreate() {
    if (!newName.trim()) {
      toast.error("Name is required")
      return
    }
    const fd = new FormData()
    fd.set("name", newName.trim())
    fd.set("color", newColor)
    startTransition(async () => {
      try {
        await createAction(fd)
        toast.success("Category added")
        setNewName("")
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message ?? "Could not create")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tags className="mr-2 h-4 w-4" />
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Rename, recolor, deactivate, or delete. Categories with existing
            entries can&apos;t be deleted — deactivate instead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Create row */}
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Add new
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Groceries"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
              <Button onClick={handleCreate} disabled={pending} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="relative h-6 w-6 rounded-full border-2"
                  style={{
                    background: c,
                    borderColor: newColor === c ? c : "transparent",
                    boxShadow:
                      newColor === c
                        ? `0 0 0 2px white, 0 0 0 4px ${c}`
                        : undefined,
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* List of categories */}
          <div className="max-h-[360px] space-y-1 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No categories yet.
              </p>
            ) : (
              categories.map((cat) => (
                <CategoryRowEditor
                  key={cat.id}
                  cat={cat}
                  onSave={(fd) =>
                    new Promise<void>((resolve, reject) => {
                      startTransition(async () => {
                        try {
                          await updateAction(cat.id, fd)
                          toast.success("Saved")
                          router.refresh()
                          resolve()
                        } catch (err) {
                          toast.error((err as Error).message ?? "Failed")
                          reject(err)
                        }
                      })
                    })
                  }
                  onDelete={() => deleteAction(cat.id)}
                  pending={pending}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryRowEditor({
  cat,
  onSave,
  onDelete,
  pending,
}: {
  cat: CategoryRow
  onSave: (fd: FormData) => Promise<void>
  onDelete: () => Promise<void>
  pending: boolean
}) {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(cat.name)
  const [color, setColor] = React.useState(cat.color)
  const [isActive, setIsActive] = React.useState(cat.isActive)

  function save() {
    const fd = new FormData()
    fd.set("name", name)
    fd.set("color", color)
    if (isActive) fd.set("isActive", "on")
    onSave(fd).then(() => setEditing(false))
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: cat.color }}
        />
        <span className={cat.isActive ? "flex-1" : "flex-1 text-muted-foreground line-through"}>
          {cat.name}
        </span>
        {!cat.isActive && (
          <span className="text-[10px] uppercase text-muted-foreground">
            Inactive
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          Edit
        </Button>
        <DeleteRowButton
          action={onDelete}
          confirmText={`Delete category "${cat.name}"? Only works if no entries use it.`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-md border bg-card p-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={save} disabled={pending}>
          <Check className="mr-1 h-4 w-4" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setName(cat.name)
            setColor(cat.color)
            setIsActive(cat.isActive)
            setEditing(false)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="relative h-5 w-5 rounded-full border-2"
            style={{
              background: c,
              borderColor: color === c ? c : "transparent",
              boxShadow:
                color === c
                  ? `0 0 0 2px white, 0 0 0 3px ${c}`
                  : undefined,
            }}
            aria-label={`Color ${c}`}
          />
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
      </div>
    </div>
  )
}
