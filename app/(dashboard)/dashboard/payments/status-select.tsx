"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type StatusFilter = "unpaid" | "paid" | "all"

export function StatusSelect({ defaultValue }: { defaultValue: StatusFilter }) {
  const [value, setValue] = useState<StatusFilter>(defaultValue)

  return (
    <>
      <input type="hidden" name="status" value={value} />
      <Select
        value={value}
        onValueChange={(v) => setValue(v as StatusFilter)}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unpaid">Unpaid only</SelectItem>
          <SelectItem value="paid">Paid only</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
