"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/components/crm/currency-provider"

export function AccountPreferences() {
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency, usdToThb } = useCurrency()

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        <Row label="Theme" description="How the dashboard looks.">
          <div className="inline-flex rounded-md border p-0.5">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.value
              return (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "ghost"}
                  onClick={() => setTheme(opt.value)}
                  className="h-8 gap-1.5 px-2.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{opt.label}</span>
                </Button>
              )
            })}
          </div>
        </Row>

        <Row
          label="Currency"
          description={`How prices display. $1 ≈ ${usdToThb.toFixed(2)} ฿`}
        >
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={currency === "thb" ? "default" : "ghost"}
              onClick={() => setCurrency("thb")}
              className="h-8 gap-1.5 px-2.5"
            >
              <span className="text-sm leading-none">🇹🇭</span>
              <span className="text-xs">THB</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={currency === "usd" ? "default" : "ghost"}
              onClick={() => setCurrency("usd")}
              className="h-8 gap-1.5 px-2.5"
            >
              <span className="text-sm leading-none">🇺🇸</span>
              <span className="text-xs">USD</span>
            </Button>
          </div>
        </Row>
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
