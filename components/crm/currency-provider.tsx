"use client"

import * as React from "react"

type Currency = "thb" | "usd"

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  /** 1 USD in THB (e.g. ~32.5) */
  usdToThb: number
  /** 1 THB in USD (derived). */
  thbToUsd: number
  rateLoadedAt: Date | null
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

// Reasonable fallback close to current real rate.
const FALLBACK_USD_TO_THB = 32.5
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Keys are versioned so old cached fallback values get invalidated.
const STORAGE_RATE = "usd_thb_rate_v2"
const STORAGE_AT = "usd_thb_rate_at_v2"

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<Currency>("thb")
  const [usdToThb, setUsdToThb] = React.useState(FALLBACK_USD_TO_THB)
  const [rateLoadedAt, setRateLoadedAt] = React.useState<Date | null>(null)

  React.useEffect(() => {
    const stored = localStorage.getItem("currency") as Currency | null
    if (stored === "thb" || stored === "usd") setCurrencyState(stored)

    // Clear any stale v1 cached values
    localStorage.removeItem("thb_usd_rate")
    localStorage.removeItem("thb_usd_rate_at")

    const storedRate = localStorage.getItem(STORAGE_RATE)
    const storedAt = localStorage.getItem(STORAGE_AT)
    if (
      storedRate &&
      storedAt &&
      Date.now() - Number(storedAt) < ONE_DAY_MS
    ) {
      const r = Number(storedRate)
      if (r > 0) {
        setUsdToThb(r)
        setRateLoadedAt(new Date(Number(storedAt)))
        return
      }
    }

    fetchRate()
      .then((rate) => {
        if (rate && rate > 0) {
          setUsdToThb(rate)
          const now = Date.now()
          localStorage.setItem(STORAGE_RATE, String(rate))
          localStorage.setItem(STORAGE_AT, String(now))
          setRateLoadedAt(new Date(now))
        }
      })
      .catch(() => {
        // keep fallback
      })
  }, [])

  const setCurrency = React.useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem("currency", c)
  }, [])

  const value = React.useMemo(
    () => ({
      currency,
      setCurrency,
      usdToThb,
      thbToUsd: usdToThb > 0 ? 1 / usdToThb : 0,
      rateLoadedAt,
    }),
    [currency, setCurrency, usdToThb, rateLoadedAt],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

/**
 * Try multiple free endpoints. open.er-api.com is the most reliable
 * (Open Exchange Rates fork, free, no key, includes THB and daily updates).
 * Falls back to frankfurter.app if it fails.
 */
async function fetchRate(): Promise<number | null> {
  // Primary: open.er-api.com
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD")
    const data = await res.json()
    const r = data?.rates?.THB
    if (typeof r === "number" && r > 0) return r
  } catch {
    /* ignore */
  }
  // Fallback: frankfurter (ECB)
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=THB")
    const data = await res.json()
    const r = data?.rates?.THB
    if (typeof r === "number" && r > 0) return r
  } catch {
    /* ignore */
  }
  return null
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider")
  return ctx
}

/** Format a whole-THB amount in the user's selected currency. */
export function formatMoney(
  thb: number | null | undefined,
  currency: Currency,
  usdToThb: number,
) {
  const value = thb ?? 0
  if (currency === "thb") {
    return `${Math.round(value).toLocaleString()} ฿`
  }
  const usd = usdToThb > 0 ? value / usdToThb : 0
  return `$${usd.toFixed(2)}`
}
