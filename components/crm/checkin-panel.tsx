"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  EntityCombobox,
  EntityComboboxItem,
} from "./entity-combobox"
import { checkInStudent } from "@/lib/actions/checkins"

export function CheckinPanel({ students }: { students: EntityComboboxItem[] }) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  function handleCheckIn() {
    if (!selected) {
      toast.error("Pick a student first")
      return
    }
    startTransition(async () => {
      const result = await checkInStudent(selected)
      if (result.ok) {
        toast.success(
          `${result.studentName} checked in${
            result.decremented ? " · 1 day used" : " (same day, no charge)"
          }`,
        )
        setSelected(null)
        router.refresh()
      } else {
        toast.error(result.reason)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reception check-in</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <EntityCombobox
              items={students}
              value={selected}
              onValueChange={(v) => setSelected(v)}
              placeholder="Search by name, email or passport..."
              searchPlaceholder="Type a name, email or passport..."
              emptyText="No student matches."
            />
          </div>
          <Button
            onClick={handleCheckIn}
            disabled={!selected || pending}
            size="lg"
            className="sm:w-40"
          >
            {pending ? "Checking in..." : "Check in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
