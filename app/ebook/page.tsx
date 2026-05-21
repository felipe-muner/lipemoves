import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { EBOOKS } from "@/lib/ebooks"
import { EbookClaimForm } from "@/components/ebook/ebook-claim-form"

export const dynamic = "force-static"

// When there's only one ebook in the catalog, /ebook redirects straight
// into its claim flow. Once a second ebook ships, this turns into a list.
export default function EbookIndex() {
  if (EBOOKS.length === 1) {
    redirect(`/ebook/${EBOOKS[0].slug}`)
  }
  return null
}

export const metadata: Metadata = {
  title: "Free ebook — Lipe Moves",
  description: "Grab a free copy of Felipe's movement & eating guide.",
}
