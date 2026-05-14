"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Package } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function StockAdjustDialog({
  productName,
  baseUnit,
  action,
}: {
  productName: string
  baseUnit: string
  action: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [reason, setReason] = React.useState<"purchase" | "adjustment" | "waste">("purchase")
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="mr-1.5 h-3.5 w-3.5" />
          Adjust stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <form
          action={(formData) => {
            formData.append("reason", reason)
            startTransition(async () => {
              try {
                await action(formData)
                toast.success("Stock updated")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error((err as Error).message ?? "Something went wrong")
              }
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>Adjust stock — {productName}</DialogTitle>
            <DialogDescription>
              Add positive amounts to receive new stock, negative to deduct.
              All changes are logged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="change">Change (in {baseUnit}) *</Label>
              <Input
                id="change"
                name="change"
                type="number"
                required
                placeholder="e.g. 1000 to add 1kg, -50 to remove 50g"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Reason</Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as typeof reason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase (received from supplier)</SelectItem>
                  <SelectItem value="adjustment">Adjustment (recount)</SelectItem>
                  <SelectItem value="waste">Waste / damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" name="note" placeholder="Supplier name, batch, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
