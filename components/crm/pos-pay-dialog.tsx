"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CreditCard } from "lucide-react"
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

type PaymentMethod = "cash" | "card" | "transfer" | "other"

export function PosPayDialog({
  saleId,
  subtotal,
  initialDiscount,
  initialTip,
  action,
}: {
  saleId: string
  subtotal: number
  initialDiscount: number
  initialTip: number
  action: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [method, setMethod] = React.useState<PaymentMethod>("cash")
  const [discount, setDiscount] = React.useState(initialDiscount)
  const [tip, setTip] = React.useState(initialTip)
  const router = useRouter()

  const total = Math.max(0, subtotal - discount + tip)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <CreditCard className="mr-2 h-4 w-4" />
          Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <form
          action={(formData) => {
            formData.set("paymentMethod", method)
            formData.set("discountThb", String(discount))
            formData.set("tipThb", String(tip))
            startTransition(async () => {
              try {
                await action(formData)
                toast.success("Sale paid")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error((err as Error).message ?? "Payment failed")
              }
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
            <DialogDescription>
              Sale #{saleId.slice(0, 8)} · stock is auto-decremented when paid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="discountThb" className="text-xs">
                  Discount (฿)
                </Label>
                <Input
                  id="discountThb"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tipThb" className="text-xs">
                  Tip (฿)
                </Label>
                <Input
                  id="tipThb"
                  type="number"
                  min={0}
                  value={tip}
                  onChange={(e) => setTip(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="paymentNote" className="text-xs">
                Note (optional)
              </Label>
              <Input id="paymentNote" name="paymentNote" placeholder="Reference, last 4..." />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{subtotal.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{discount.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tip</span>
                <span>+{tip.toLocaleString()} ฿</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{total.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Processing..." : `Charge ${total.toLocaleString()} ฿`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
