import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FinanceReportsPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const now = new Date()
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd")
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd")
  const qs = `?from=${defaultFrom}&to=${defaultTo}`

  const reports = [
    {
      slug: "monthly-summary",
      title: "Monthly summary",
      description:
        "KPIs (income, expenses, net, margin) + category breakdown. Great for sharing or filing.",
    },
    {
      slug: "income-statement",
      title: "Detailed income statement",
      description:
        "Every transaction line — restaurant, memberships, drop-ins. Multi-page, for accounting.",
    },
    {
      slug: "expense-report",
      title: "Expense report",
      description: "All expenses in the range, totaled by category.",
    },
    {
      slug: "teacher-payouts",
      title: "Teacher payout statements",
      description:
        "Per-teacher report: classes taught, attendees, share %, payout. Send to teachers.",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PDF reports</h1>
        <p className="text-sm text-muted-foreground">
          Pick a report. Each opens a print-ready page — use{" "}
          <kbd className="rounded border px-1.5 text-xs">⌘P</kbd> /{" "}
          <kbd className="rounded border px-1.5 text-xs">Ctrl+P</kbd> →{" "}
          <em>Save as PDF</em> for a clean export.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.slug}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {r.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/finance/reports/${r.slug}${qs}`}>
                  Open report
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
