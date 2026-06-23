import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { EBOOKS } from "@/lib/ebooks"

export const dynamic = "force-static"

// /ebook is the lead-capture funnel — it redirects straight into the primary
// ebook's claim flow. The full multi-title catalog lives at /ebooks (and /books).
// TODO: turn this into a picker if we ever want each title to have its own funnel.
export default function EbookIndex() {
  redirect(`/ebook/${EBOOKS[0].slug}`)
}

export const metadata: Metadata = {
  title: "Free ebook — Lipe Moves",
  description: "Grab a free copy of Felipe's movement & eating guide.",
}
