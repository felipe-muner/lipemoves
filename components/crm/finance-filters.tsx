"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface FinanceFiltersProps {
  defaultFrom: string
  defaultTo: string
  categoryId?: string
  categories?: Array<{ id: string; name: string }>
  showCategory?: boolean
  /** Optional extra control rendered inline (e.g. an employee combobox). */
  extraField?: React.ReactNode
}

function fmt(d: Date) {
  return format(d, "yyyy-MM-dd")
}

export function FinanceFilters({
  defaultFrom,
  defaultTo,
  categoryId,
  categories = [],
  showCategory = false,
  extraField,
}: FinanceFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function applyRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams)
    params.set("from", fmt(from))
    params.set("to", fmt(to))
    router.push(`${pathname}?${params.toString()}`)
  }

  const presets = [
    {
      label: "This month",
      run: () => applyRange(startOfMonth(new Date()), endOfMonth(new Date())),
    },
    {
      label: "Last month",
      run: () => {
        const ref = subMonths(new Date(), 1)
        applyRange(startOfMonth(ref), endOfMonth(ref))
      },
    },
    {
      label: "Last 3 months",
      run: () =>
        applyRange(
          startOfMonth(subMonths(new Date(), 2)),
          endOfMonth(new Date()),
        ),
    },
    {
      label: "Year to date",
      run: () => applyRange(startOfYear(new Date()), new Date()),
    },
    {
      label: "Last year",
      run: () => {
        const ref = subMonths(new Date(), 12)
        applyRange(startOfYear(ref), endOfYear(ref))
      },
    },
  ]

  return (
    <div className="space-y-3">
      <form className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="from" className="text-xs">From</Label>
          <Input id="from" type="date" name="from" defaultValue={defaultFrom} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to" className="text-xs">To</Label>
          <Input id="to" type="date" name="to" defaultValue={defaultTo} />
        </div>
        {showCategory && (
          <div className="grid gap-1.5">
            <Label htmlFor="categoryId" className="text-xs">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={categoryId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {extraField}
        <Button type="submit">Filter</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={p.run}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
