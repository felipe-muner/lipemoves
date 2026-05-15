"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ChevronsUpDown, X } from "lucide-react"

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
  image?: string | null
  imageType?: "avatar" | "logo"
  /** When set, rendered in the avatar slot instead of an image (e.g. flag emoji). */
  emoji?: string
  color?: string
  description?: string
}

type SingleProps = {
  multiple?: false
  value?: string | null
  onValueChange: (value: string | null) => void
}

type MultiProps = {
  multiple: true
  value?: string[]
  onValueChange: (value: string[]) => void
}

type EntityComboboxProps = (SingleProps | MultiProps) & {
  items: EntityComboboxItem[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
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

  if (item.emoji) {
    return (
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.9),
          lineHeight: 1,
        }}
        aria-hidden
      >
        {item.emoji}
      </div>
    )
  }

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

export function EntityCombobox(props: EntityComboboxProps) {
  const {
    items,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results.",
    className,
    allOption,
    disabled = false,
  } = props
  const multiple = props.multiple === true

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const selectedIds = React.useMemo<string[]>(() => {
    if (multiple) {
      const v = (props as MultiProps).value
      return Array.isArray(v) ? v : []
    }
    const v = (props as SingleProps).value
    return v ? [v] : []
  }, [multiple, props])

  const selectedItems = items.filter((i) => selectedIds.includes(i.id))

  const filtered = items.filter((i) => {
    const q = query.toLowerCase()
    return (
      i.label.toLowerCase().includes(q) ||
      (i.description?.toLowerCase().includes(q) ?? false)
    )
  })

  function emit(ids: string[]) {
    if (multiple) {
      ;(props as MultiProps).onValueChange(ids)
    } else {
      const next = ids[0] ?? null
      ;(props as SingleProps).onValueChange(next)
    }
  }

  function toggle(id: string) {
    if (multiple) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
      emit(next)
    } else {
      emit([id])
      setOpen(false)
      setQuery("")
    }
  }

  function clearAll() {
    emit([])
    if (!multiple) {
      setOpen(false)
      setQuery("")
    }
  }

  function removeOne(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    emit(selectedIds.filter((x) => x !== id))
  }

  const showChips = multiple && selectedItems.length > 0
  const single = !multiple && selectedItems[0]

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={disabled ? undefined : setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-auto min-h-9 w-full justify-between font-normal",
            className,
          )}
        >
          {showChips ? (
            <div className="flex flex-1 flex-wrap items-center gap-1 py-1">
              {selectedItems.map((it) => (
                <span
                  key={it.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-0.5 text-xs text-secondary-foreground"
                >
                  <ItemImage item={it} size={18} />
                  <span>{it.label}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => removeOne(e, it.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted-foreground/20"
                    aria-label={`Remove ${it.label}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
            </div>
          ) : single ? (
            <span className="flex items-center gap-2 truncate">
              <ItemImage item={single} size={20} />
              <span className="truncate">{single.label}</span>
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
          <CommandList className="max-h-[320px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allOption && (
                <CommandItem
                  value={allOption.label}
                  onSelect={() => clearAll()}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.length === 0 ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="text-muted-foreground">
                    {allOption.label}
                  </span>
                </CommandItem>
              )}
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => toggle(item.id)}
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
