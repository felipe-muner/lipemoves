"use client"

import * as React from "react"
import { EntitySearchFilter } from "./entity-search-filter"

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
  return (
    <EntitySearchFilter
      items={employees.map((e) => ({
        id: e.id,
        label: e.name,
        image: e.image ?? null,
        imageType: "avatar",
        description: e.email ?? undefined,
      }))}
      paramName={paramName}
      value={value ?? undefined}
      placeholder={placeholder}
      searchPlaceholder="Search employees..."
      emptyText="No employees match."
      className={className}
    />
  )
}
