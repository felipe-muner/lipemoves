"use client"

import * as React from "react"
import { EntityCombobox, type EntityComboboxItem } from "./entity-combobox"

/**
 * Form-friendly wrapper around EntityCombobox: keeps the selected value in
 * state and mirrors it into a hidden input so it submits with a plain
 * <form action={serverAction}>. Use this anywhere we'd otherwise reach for a
 * native <select>.
 */
export function EntitySelectField({
  name,
  items,
  defaultValue = null,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  required,
}: {
  name: string
  items: EntityComboboxItem[]
  defaultValue?: string | null
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  required?: boolean
}) {
  const [value, setValue] = React.useState<string | null>(defaultValue)

  return (
    <>
      <input type="hidden" name={name} value={value ?? ""} required={required} />
      <EntityCombobox
        items={items}
        value={value}
        onValueChange={setValue}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        className={className}
      />
    </>
  )
}
