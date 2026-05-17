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

type Attempt = {
  id: string
  at: Date
  studentName: string
  result: CheckinResult
}

const MAX_HISTORY = 5
// Most recent first → fades to lighter gray as you scroll down.
const FADE_OPACITY = ["opacity-100", "opacity-90", "opacity-75", "opacity-60", "opacity-45"]

export function CheckinPanel({ students }: { students: EntityComboboxItem[] }) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [attempts, setAttempts] = React.useState<Attempt[]>([])

  function handleCheckIn() {
    if (!selected) {
      toast.error("Pick a student first")
      return
    }
    const item = students.find((s) => s.id === selected)
    const studentName = item?.label ?? selected
    startTransition(async () => {
      const result = await checkInStudent(selected)
      setAttempts((prev) =>
        [
          {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            at: new Date(),
            studentName: result.ok ? result.studentName : studentName,
            result,
          },
          ...prev,
        ].slice(0, MAX_HISTORY),
      )
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
    <div className="space-y-4">
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

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Latest check-ins
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                last {Math.min(attempts.length, MAX_HISTORY)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {attempts.map((a, i) => (
                <li
                  key={a.id}
                  className={`transition-opacity ${FADE_OPACITY[i] ?? "opacity-30"}`}
                >
                  <AttemptRow attempt={a} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AttemptRow({ attempt }: { attempt: Attempt }) {
  const { result } = attempt
  const time = format(attempt.at, "HH:mm:ss")

  if (!result.ok) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-destructive">
              {attempt.studentName}
            </span>
            <Badge
              variant="outline"
              className="border-destructive/40 text-[10px] text-destructive"
            >
              Failed
            </Badge>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {time}
            </span>
          </div>
          <div className="text-xs text-destructive/80">{result.reason}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {result.studentName} — entry allowed
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {time}
          </span>
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
