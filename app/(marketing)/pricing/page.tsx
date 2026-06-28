import type { Metadata } from "next"
import PricingContent from "./pricing-content"

export const metadata: Metadata = {
  title: "1-on-1 Coaching — Lipe Moves",
  description:
    "Personal 1-on-1 coaching with Felipe — programming, live form feedback and direct access. A few clients at a time. Message for pricing.",
  alternates: { canonical: "https://lipemoves.com/pricing" },
  openGraph: {
    title: "1-on-1 Coaching — Lipe Moves",
    description:
      "Personal 1-on-1 coaching with Felipe — programming, live form feedback and direct access. A few clients at a time. Message for pricing.",
    images: [{ url: "/og/pricing.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/pricing.jpg"],
  },
}

export default function PricingPage() {
  return <PricingContent />
}
