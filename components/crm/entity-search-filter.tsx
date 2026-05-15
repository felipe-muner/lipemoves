"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  EntityCombobox,
  EntityComboboxItem,
} from "./entity-combobox"

export interface EntitySearchFilterProps {
  items: EntityComboboxItem[]
  paramName: string
  /** Comma-separated string of currently selected ids (from server-side searchParams). */
  value?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  allLabel?: string
  /** Default false — single select. Set true to allow picking multiple entities. */
  multiple?: boolean
}

export function EntitySearchFilter({
  items,
  paramName,
  value,
  placeholder = "All",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  className,
  allLabel,
  multiple = false,
}: EntitySearchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const ids = (value ?? "").split(",").map((s) => s.trim()).filter(Boolean)

  function applyMulti(next: string[]) {
    const params = new URLSearchParams(searchParams)
    if (next.length === 0) params.delete(paramName)
    else params.set(paramName, next.join(","))
    router.push(`${pathname}?${params.toString()}`)
  }

  function applySingle(next: string | null) {
    const params = new URLSearchParams(searchParams)
    if (next) params.set(paramName, next)
    else params.delete(paramName)
    router.push(`${pathname}?${params.toString()}`)
  }

  const allOption = { id: "__all__", label: allLabel ?? placeholder }

  if (multiple) {
    return (
      <EntityCombobox
        multiple
        items={items}
        value={ids}
        onValueChange={applyMulti}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        allOption={allOption}
        className={className}
      />
    )
  }

  return (
    <EntityCombobox
      items={items}
      value={ids[0] ?? null}
      onValueChange={applySingle}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      allOption={allOption}
      className={className}
    />
  )
}

