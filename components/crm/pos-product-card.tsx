"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addItemToSale } from "@/lib/actions/sales"
import { ProductAvatar } from "@/components/crm/product-avatar"

export function PosProductCard({
  saleId,
  product,
  /** How many MORE servings of this product can still go on the tab. */
  canAddMore,
}: {
  saleId: string
  product: {
    id: string
    name: string
    priceThb: number
    baseUnit: string
    servingSize: number
    stockQty: number
    imageUrl: string | null
  }
  canAddMore: number
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const oos = canAddMore <= 0
  const servingsLeft = product.servingSize > 0
    ? Math.floor(product.stockQty / product.servingSize)
    : product.stockQty

  return (
    <button
      type="button"
      disabled={oos || pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await addItemToSale(saleId, product.id, 1)
            router.refresh()
          } catch (err) {
            toast.error((err as Error).message ?? "Couldn't add item")
          }
        })
      }}
      className="group flex w-full items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none"
    >
      <ProductAvatar
        name={product.name}
        imageUrl={product.imageUrl}
        size={44}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium leading-tight">
          {product.name}
        </div>
        <div className="mt-0.5 flex w-full items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {oos ? (
              <span className="font-medium text-red-600">
                {servingsLeft === 0 ? "Out" : "All on tab"}
              </span>
            ) : (
              <>{canAddMore} left</>
            )}
          </span>
          <span className="font-semibold">{product.priceThb.toLocaleString()} ฿</span>
        </div>
      </div>
    </button>
  )
}
