"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintFrame({
  title,
  meta,
  children,
}: {
  title: string
  meta: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background">
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          @page { size: A4; margin: 18mm 14mm; }
          body { background: white !important; }
        }
        .report-page { max-width: 920px; margin: 0 auto; padding: 32px 24px; }
        .report-page h1 { font-size: 22px; font-weight: 600; margin: 0; }
        .report-page h2 { font-size: 14px; font-weight: 600; margin: 24px 0 8px; }
        .report-page table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-page th, .report-page td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        .report-page th { background: #f9fafb; font-weight: 600; }
        .report-page .num { text-align: right; font-variant-numeric: tabular-nums; }
      `}</style>

      <div className="print-hide flex items-center justify-between border-b bg-muted/40 px-6 py-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{meta}</div>
        </div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="report-page">{children}</div>
    </div>
  )
}
