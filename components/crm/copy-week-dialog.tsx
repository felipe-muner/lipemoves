"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import { addDays, addWeeks, format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { copyWeek } from "@/lib/actions/bookings"

export function CopyWeekDialog({
  weekStartIso,
}: {
  weekStartIso: string
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const sourceStart = parseISO(weekStartIso)
  const [offset, setOffset] = React.useState(1)
  const targetStart = addWeeks(sourceStart, offset)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy className="mr-2 h-4 w-4" />
          Copy week
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Copy weekly schedule</DialogTitle>
          <DialogDescription>
            Duplicate every class from this week into another week. Existing
            classes at the same slot will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">
              From (this week)
            </Label>
            <div className="text-sm font-medium">
              {format(sourceStart, "MMM dd")} →{" "}
              {format(addDays(sourceStart, 6), "MMM dd, yyyy")}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs uppercase text-muted-foreground">
              Copy to
            </Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={offset === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOffset(n)}
                >
                  +{n} week{n > 1 ? "s" : ""}
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Target: {format(targetStart, "MMM dd")} →{" "}
              {format(addDays(targetStart, 6), "MMM dd, yyyy")}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const result = await copyWeek(
                    weekStartIso,
                    targetStart.toISOString(),
                  )
                  toast.success(
                    `Copied ${result.copied} classes` +
                      (result.skipped
                        ? ` (skipped ${result.skipped} duplicates)`
                        : ""),
                  )
                  setOpen(false)
                  router.refresh()
                } catch (err) {
                  toast.error((err as Error).message ?? "Copy failed")
                }
              })
            }}
          >
            {pending ? "Copying..." : "Copy schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
