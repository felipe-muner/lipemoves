"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  EntityCombobox,
  EntityComboboxItem,
} from "./entity-combobox"
import { checkInStudent, CheckinResult } from "@/lib/actions/checkins"

export function CheckinPanel({ students }: { students: EntityComboboxItem[] }) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [lastResult, setLastResult] = React.useState<CheckinResult | null>(null)

  function handleCheckIn() {
    if (!selected) {
      toast.error("Pick a student first")
      return
    }
    startTransition(async () => {
      const result = await checkInStudent(selected)
      setLastResult(result)
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
      <CardContent className="space-y-4">
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

        {lastResult && <ResultBanner result={lastResult} />}
      </CardContent>
    </Card>
  )
}

function ResultBanner({ result }: { result: CheckinResult }) {
  if (!result.ok) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="font-medium text-destructive">{result.reason}</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
      <div className="space-y-1">
        <div className="font-medium">
          {result.studentName} — entry allowed
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{result.planLabel}</Badge>
          {result.classesRemaining != null ? (
            <span>{result.classesRemaining} days left</span>
          ) : (
            <span>Unlimited plan</span>
          )}
          {result.endsOn && (
            <span>
              · expires {format(parseISO(result.endsOn), "MMM dd, yyyy")}
            </span>
          )}
          <span>
            ·{" "}
            {result.decremented
              ? "1 day decremented"
              : "same day, no decrement"}
          </span>
        </div>
      </div>
    </div>
  )
}
