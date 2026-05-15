"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { EntityCombobox, EntityComboboxItem } from "./entity-combobox"

export function EmployeeFilter({
  employees,
  value,
  paramName = "employeeId",
  className,
  placeholder = "All employees",
}: {
  employees: Array<{
    id: string
    name: string
    image?: string | null
    email?: string | null
  }>
  value?: string | null
  paramName?: string
  className?: string
  placeholder?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const items: EntityComboboxItem[] = employees.map((e) => ({
    id: e.id,
    label: e.name,
    image: e.image ?? null,
    imageType: "avatar",
    description: e.email ?? undefined,
  }))

  function apply(id: string | null) {
    const params = new URLSearchParams(searchParams)
    if (id) params.set(paramName, id)
    else params.delete(paramName)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <EntityCombobox
      items={items}
      value={value ?? null}
      onValueChange={apply}
      allOption={{ id: "__all__", label: placeholder }}
      placeholder={placeholder}
      searchPlaceholder="Search employees..."
      emptyText="No employees match."
      className={className}
    />
  )
}
