"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ReactivateRowButton({
  action,
  confirmText,
  label = "Reactivate",
}: {
  action: () => Promise<void>
  confirmText?: string
  label?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
        title={label}
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirm reactivate</DialogTitle>
            <DialogDescription>
              {confirmText ??
                "They'll be active again and reappear in default lists."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await action()
                    toast.success("Reactivated")
                    setOpen(false)
                    router.refresh()
                  } catch (err) {
                    toast.error((err as Error).message ?? "Failed")
                  }
                })
              }}
            >
              {pending ? "Reactivating..." : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
