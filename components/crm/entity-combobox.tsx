"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type EntityComboboxItem = {
  id: string
  label: string
  /** Optional URL for an avatar/logo image. */
  image?: string | null
  /** "avatar" rounds the image; "logo" leaves it square. Default: avatar. */
  imageType?: "avatar" | "logo"
  /** Color for fallback logo background or initial chip tint. */
  color?: string
  /** Optional secondary line below the label (e.g., email, role). */
  description?: string
}

interface EntityComboboxProps {
  items: EntityComboboxItem[]
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  /** "All" / "Any" option — if provided, shown at the top and clears selection. */
  allOption?: { id: string; label: string }
  disabled?: boolean
}

function getInitials(label: string) {
  return label
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ItemImage({
  item,
  size,
}: {
  item: EntityComboboxItem
  size: number
}) {
  const isAvatar = item.imageType !== "logo"

  if (item.image) {
    return (
      <Image
        src={item.image}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn(
          "shrink-0",
          isAvatar ? "rounded-full object-cover" : "rounded object-contain",
        )}
        style={{ width: size, height: size }}
      />
    )
  }

  if (isAvatar) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
        style={{ width: size, height: size }}
      >
        {getInitials(item.label)}
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
        background: item.color ?? "#3b82f6",
      }}
    >
      {item.label.charAt(0).toUpperCase()}
    </div>
  )
}

export function EntityCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  className,
  allOption,
  disabled = false,
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const selected = value ? items.find((i) => i.id === value) ?? null : null

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()) ||
    (i.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
  )

  function pick(id: string | null) {
    onValueChange(id)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-9 w-full justify-between font-normal", className)}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <ItemImage item={selected} size={20} />
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {allOption ? allOption.label : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allOption && (
                <CommandItem
                  value={allOption.label}
                  onSelect={() => pick(null)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="text-muted-foreground">{allOption.label}</span>
                </CommandItem>
              )}
              {filtered.map((item) => {
                const isSelected = selected?.id === item.id
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => pick(item.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <ItemImage item={item} size={24} />
                    <div className="ml-2 flex min-w-0 flex-col">
                      <span className="truncate text-sm">{item.label}</span>
                      {item.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
