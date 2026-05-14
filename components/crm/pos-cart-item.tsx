"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Minus, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  updateSaleItemQuantity,
  removeSaleItem,
} from "@/lib/actions/sales"

export function PosCartItem({
  item,
  /** How many MORE units of this product can still go on the bill (can be 0). */
  canAddMore,
}: {
  item: {
    id: string
    productName: string
    unitPriceThb: number
    quantity: number
    totalThb: number
  }
  canAddMore: number
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const atMax = canAddMore <= 0

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message ?? "Couldn't update item")
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.productName}</div>
        <div className="text-xs text-muted-foreground">
          {item.unitPriceThb.toLocaleString()} ฿ ea
        </div>
        {atMax && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Max in stock
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={pending}
          onClick={() => run(() => updateSaleItemQuantity(item.id, item.quantity - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">
          {item.quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={pending || atMax}
          onClick={() => run(() => updateSaleItemQuantity(item.id, item.quantity + 1))}
          title={atMax ? "No more stock available" : undefined}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600"
          disabled={pending}
          onClick={() => run(() => removeSaleItem(item.id))}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="w-20 text-right text-sm font-semibold">
        {item.totalThb.toLocaleString()} ฿
      </div>
    </div>
  )
}
