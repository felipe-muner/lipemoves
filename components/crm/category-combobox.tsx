"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface CategoryOption {
  id: string
  name: string
  color: string
}

interface Props {
  name: string
  categories: CategoryOption[]
  value?: string
  placeholder?: string
  createAction: (formData: FormData) => Promise<{
    id: string
    name: string
    color: string
  }>
  /** Color used as fallback when the user creates a new category. */
  defaultColor?: string
}

export function CategoryCombobox({
  name,
  categories: initial,
  value: initialValue,
  placeholder = "Pick a category",
  createAction,
  defaultColor = "#64748b",
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [list, setList] = React.useState<CategoryOption[]>(initial)
  const [value, setValue] = React.useState<string>(initialValue ?? "")
  const [search, setSearch] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const selected = list.find((c) => c.id === value)

  const exactMatch = list.some(
    (c) => c.name.toLowerCase() === search.trim().toLowerCase(),
  )
  const canCreate = search.trim().length > 0 && !exactMatch

  function handleCreate() {
    const name = search.trim()
    if (!name) return
    const fd = new FormData()
    fd.set("name", name)
    fd.set("color", defaultColor)
    startTransition(async () => {
      try {
        const created = await createAction(fd)
        setList((prev) => [...prev, created])
        setValue(created.id)
        setSearch("")
        setOpen(false)
        toast.success(`Added "${created.name}"`)
      } catch (err) {
        toast.error((err as Error).message ?? "Could not create category")
      }
    })
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: selected.color }}
                />
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search or type new..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {canCreate ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={pending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    Create &quot;{search.trim()}&quot;
                  </button>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No categories.
                  </p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {list.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      setValue(c.id)
                      setOpen(false)
                    }}
                  >
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === c.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {canCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreate}
                      disabled={pending}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create &quot;{search.trim()}&quot;
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
