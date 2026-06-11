import type { Metadata } from "next"
import { Suspense } from "react"
import PricingContent from "./pricing-content"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Membership — Lipe Moves",
  description:
    "Every class, every pillar. $35/month or $250/year — save 40%. No equipment. Cancel anytime.",
  alternates: { canonical: "https://lipemoves.com/pricing" },
  openGraph: {
    title: "Membership — Lipe Moves",
    description:
      "Every class, every pillar. $35/month or $250/year — save 40%. No equipment. Cancel anytime.",
    images: [{ url: "/og/pricing.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/pricing.jpg"],
  },
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}
