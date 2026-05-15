"use client"

import * as React from "react"
import { EntityCombobox } from "./entity-combobox"
import { NATIONALITIES_SORTED } from "@/lib/utils/nationalities"
import { countryCodeToFlag } from "@/lib/utils/country-flag"

/**
 * Searchable nationality picker rendered as an EntityCombobox with flag
 * emojis. Stores the demonym (e.g. "Brazilian") as the form value so the DB
 * representation stays readable.
 */
export function NationalityPicker({
  name = "nationality",
  defaultValue,
  className,
  placeholder = "Select nationality...",
}: {
  name?: string
  defaultValue?: string | null
  className?: string
  placeholder?: string
}) {
  const [value, setValue] = React.useState<string>(defaultValue ?? "")

  const items = React.useMemo(
    () =>
      NATIONALITIES_SORTED.map((n) => ({
        // Use the demonym as the id so we store the name (not the code) in DB.
        id: n.name,
        label: n.name,
        emoji: countryCodeToFlag(n.code),
        description: n.code,
      })),
    [],
  )

  // Allow legacy free-form values (e.g. data typed before this picker existed)
  // to remain selectable: if `value` isn't in our canonical list, expose it as
  // a one-off option so it still shows in the trigger.
  const merged = React.useMemo(() => {
    if (!value) return items
    if (items.some((i) => i.id === value)) return items
    return [{ id: value, label: value, description: "Custom" }, ...items]
  }, [items, value])

  return (
    <>
      <EntityCombobox
        items={merged}
        value={value || null}
        onValueChange={(v) => setValue(v ?? "")}
        placeholder={placeholder}
        searchPlaceholder="Type to search (e.g. brazi…)"
        emptyText="No match. Tip: try the country name."
        allOption={{ id: "__none__", label: "— None —" }}
        className={className}
      />
      <input type="hidden" name={name} value={value} />
    </>
  )
}
