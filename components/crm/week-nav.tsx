"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { addDays, addWeeks, format, parseISO, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WeekNav({ weekStartIso }: { weekStartIso: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const start = parseISO(weekStartIso)
  const end = addDays(start, 6)

  function goTo(date: Date) {
    const params = new URLSearchParams(searchParams)
    params.set("week", format(date, "yyyy-MM-dd"))
    router.push(`/dashboard/classes?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => goTo(addWeeks(start, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[180px] rounded-md border bg-card px-3 py-1.5 text-center text-sm font-medium">
        {format(start, "MMM dd")} → {format(end, "MMM dd, yyyy")}
      </div>
      <Button variant="outline" size="icon" onClick={() => goTo(addWeeks(start, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goTo(startOfWeek(new Date(), { weekStartsOn: 1 }))}
      >
        <Calendar className="mr-1 h-4 w-4" />
        Today
      </Button>
    </div>
  )
}
