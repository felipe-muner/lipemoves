"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PosProductCard } from "@/components/crm/pos-product-card"

export interface PosProduct {
  id: string
  name: string
  sku: string | null
  description: string | null
  category: string
  baseUnit: string
  servingSize: number
  stockQty: number
  priceThb: number
  imageUrl: string | null
}

export function PosProductGrid({
  saleId,
  products,
  canAddMoreById,
}: {
  saleId: string
  products: PosProduct[]
  canAddMoreById: Record<string, number>
}) {
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()

  const filtered = React.useMemo(() => {
    if (!q) return products
    return products.filter((p) => {
      const hay = [p.name, p.sku ?? "", p.description ?? "", p.category]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [products, q])

  // Group by category, preserving the category order from products array
  const grouped = React.useMemo(() => {
    const map = new Map<string, PosProduct[]>()
    for (const p of filtered) {
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products… (name, SKU, description)"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {q && (
        <div className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? `No products match "${query}"`
            : `${filtered.length} match${filtered.length === 1 ? "" : "es"} for "${query}"`}
        </div>
      )}

      {grouped.length === 0 && !q && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No products yet.
          </CardContent>
        </Card>
      )}

      {grouped.map(([cat, list]) => (
        <Card key={cat}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">{cat}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => (
                <PosProductCard
                  key={p.id}
                  saleId={saleId}
                  product={{
                    id: p.id,
                    name: p.name,
                    priceThb: p.priceThb,
                    baseUnit: p.baseUnit,
                    servingSize: p.servingSize,
                    stockQty: p.stockQty,
                    imageUrl: p.imageUrl,
                  }}
                  canAddMore={canAddMoreById[p.id] ?? 0}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
