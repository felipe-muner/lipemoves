"use client"

import { formatMoney, useCurrency } from "@/components/crm/currency-provider"

export function Money({
  thb,
  className,
}: {
  thb: number | null | undefined
  className?: string
}) {
  const { currency, usdToThb } = useCurrency()
  return (
    <span className={className} suppressHydrationWarning>
      {formatMoney(thb, currency, usdToThb)}
    </span>
  )
}
