"use client"

import { useCurrency } from "@/components/crm/currency-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function CurrencySwitch() {
  const { currency, setCurrency, usdToThb, rateLoadedAt } = useCurrency()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <span className="text-base leading-none">
            {currency === "thb" ? "🇹🇭" : "🇺🇸"}
          </span>
          <span className="font-medium uppercase">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Display currency</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setCurrency("thb")}>
          <span className="mr-1 text-base leading-none">🇹🇭</span>
          <span className="flex-1">Thai baht (฿)</span>
          {currency === "thb" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("usd")}>
          <span className="mr-1 text-base leading-none">🇺🇸</span>
          <span className="flex-1">US dollar ($)</span>
          {currency === "usd" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div>$1 ≈ {usdToThb.toFixed(2)} ฿</div>
          {rateLoadedAt ? (
            <div className="text-[10px]">
              Updated {rateLoadedAt.toLocaleDateString()}
            </div>
          ) : (
            <div className="text-[10px]">Live rate unavailable — using fallback</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
