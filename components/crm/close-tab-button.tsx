"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CloseTabButton({
  itemCount,
  totalThb,
  action,
}: {
  itemCount: number
  totalThb: number
  action: () => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  function run() {
    startTransition(async () => {
      try {
        await action()
        toast.success("Tab closed without payment")
        setOpen(false)
        router.refresh()
        router.push("/dashboard/restaurant")
      } catch (err) {
        toast.error((err as Error).message ?? "Could not close tab")
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          if (itemCount === 0) {
            // Empty tab — close without nagging
            run()
          } else {
            setOpen(true)
          }
        }}
      >
        <X className="mr-1 h-3.5 w-3.5" />
        Close tab without paying
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Close tab without payment?</DialogTitle>
            <DialogDescription>
              This tab has{" "}
              <strong>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </strong>{" "}
              totalling{" "}
              <strong>{totalThb.toLocaleString()} ฿</strong>. Closing it now
              cancels the sale — nothing gets charged, stock stays untouched.
              The table becomes available again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep tab open
            </Button>
            <Button variant="destructive" onClick={run} disabled={pending}>
              {pending ? "Closing…" : "Yes, close without paying"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
