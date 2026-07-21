"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow transition hover:bg-white/90"
    >
      <Printer className="h-4 w-4" />
      Save as PDF
    </button>
  )
}
