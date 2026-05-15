"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const ALLOWED_PER_PAGE = [10, 25, 50, 100]

export function DataTablePagination({
  total,
  page,
  perPage,
  label = "rows",
}: {
  total: number
  page: number
  perPage: number
  label?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageCount = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, pageCount)
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1
  const to = Math.min(safePage * perPage, total)

  function navigate(p: number, pp = perPage) {
    const params = new URLSearchParams(searchParams)
    if (p <= 1) params.delete("page")
    else params.set("page", String(p))
    if (pp === 25) params.delete("perPage")
    else params.set("perPage", String(pp))
    router.push(`${pathname}?${params.toString()}`)
  }

  function setPerPage(e: React.ChangeEvent<HTMLSelectElement>) {
    const pp = Number(e.target.value)
    // Reset to page 1 when page size changes so we don't fall off the end.
    navigate(1, pp)
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-3 text-sm sm:flex-row">
      <div className="text-muted-foreground">
        {total === 0
          ? `No ${label}.`
          : `${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()} ${label}`}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Rows per page
          <select
            value={perPage}
            onChange={setPerPage}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
          >
            {ALLOWED_PER_PAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted-foreground">
          Page {safePage} of {pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage <= 1}
            onClick={() => navigate(1)}
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage <= 1}
            onClick={() => navigate(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage >= pageCount}
            onClick={() => navigate(safePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage >= pageCount}
            onClick={() => navigate(pageCount)}
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
