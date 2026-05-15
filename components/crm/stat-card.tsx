import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ElementType
  trend?: { value: number; positive: boolean }
  valueClassName?: string
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card from-35% to-neutral-200 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.04)] dark:to-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-base font-bold tracking-tight text-foreground">
            {label}
          </p>
          {trend ? (
            <p className="text-sm">
              <span
                className={
                  trend.positive
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "font-semibold text-red-600 dark:text-red-400"
                }
              >
                {trend.positive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>{" "}
              <span className="text-muted-foreground">from last month</span>
            </p>
          ) : hint ? (
            <div className="text-sm text-muted-foreground">{hint}</div>
          ) : null}
        </div>
        {Icon && (
          <Icon
            className="h-6 w-6 shrink-0 text-muted-foreground/60"
            strokeWidth={1.75}
            aria-hidden
          />
        )}
      </div>
      <div
        className={cn(
          "mt-1 text-3xl font-semibold tracking-tight text-foreground",
          valueClassName,
        )}
      >
        {value}
      </div>
    </Card>
  )
}
