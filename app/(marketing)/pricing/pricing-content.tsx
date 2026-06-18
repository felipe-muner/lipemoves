"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const MONTHLY_FEATURES = ["Access to all videos", "New classes every week", "Cancel anytime"]
const ANNUAL_FEATURES = ["Everything in the monthly plan", "Save $170 vs monthly", "Priority access"]
const PT_FEATURES = [
  "Personalised programming",
  "Live form feedback",
  "Direct access to me",
]

const MONTHLY_ENV = "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID"
const ANNUAL_ENV = "NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID"
// 1-on-1 coaching is high-touch — booked via WhatsApp/email, not checkout.
const PT_EMAIL = "felipe.muner@gmail.com"
const PT_MAILTO = `mailto:${PT_EMAIL}?subject=${encodeURIComponent(
  "1-on-1 Personal Training with LipeMoves",
)}`
const PT_WHATSAPP = `https://wa.me/5521984852802?text=${encodeURIComponent(
  "Hi Felipe, I'm interested in 1:1 coaching",
)}`

export default function PricingContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(priceEnv: string) {
    if (!session) {
      router.push("/register")
      return
    }

    setLoading(priceEnv)

    const priceId =
      priceEnv === MONTHLY_ENV
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })

    const data = await res.json()
    setLoading(null)

    if (res.status === 409 && data.error === "already_subscribed") {
      // Already a member — manage the plan instead of paying twice.
      router.push("/account")
      return
    }

    if (data.url) {
      router.push(data.url)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Pricing</p>
          <h1 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Choose your <span className="text-[#39FF14]">membership.</span>
          </h1>
          <p className="mt-4 text-white/55">
            Every class, every pillar. No equipment. Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 md:grid-cols-3">
          {/* Annual */}
          <div className="relative rounded-3xl bg-[#39FF14] p-8 text-black">
            <span className="absolute right-8 top-8 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold">
              Best value
            </span>
            <p className="text-base text-black/70">Annual</p>
            <p className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none">$250</span>
              <span className="pb-1 text-base text-black/50">/ year</span>
            </p>
            <span className="mt-5 inline-block rounded-full bg-black/15 px-3 py-1 text-xs font-bold">
              Save 40% · Billed yearly
            </span>
            <ul className="mt-6 space-y-4 text-sm">
              {ANNUAL_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-black/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="ink"
              size="pill-lg"
              className="mt-9 w-full"
              disabled={loading === ANNUAL_ENV}
              onClick={() => handleSubscribe(ANNUAL_ENV)}
            >
              {loading === ANNUAL_ENV ? "Loading…" : "Begin Annual"}
            </Button>
            <p className="mt-4 text-center text-sm text-black/50">Cancel anytime</p>
          </div>

          {/* Monthly */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <p className="text-base text-white/70">Monthly</p>
            <p className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none">$35</span>
              <span className="pb-1 text-base text-white/40">/ month</span>
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {MONTHLY_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="white"
              size="pill-lg"
              className="mt-9 w-full"
              disabled={loading === MONTHLY_ENV}
              onClick={() => handleSubscribe(MONTHLY_ENV)}
            >
              {loading === MONTHLY_ENV ? "Loading…" : "Begin Monthly"}
            </Button>
            <p className="mt-4 text-center text-sm text-white/40">Cancel anytime</p>
          </div>

          {/* 1×1 Personal Training — booked by email, not instant checkout */}
          <div className="relative rounded-3xl border border-[#39FF14]/30 bg-white/[0.02] p-8">
            <span className="absolute right-8 top-8 rounded-full bg-[#39FF14]/15 px-3 py-1 text-xs font-semibold text-[#39FF14]">
              1-on-1
            </span>
            <p className="text-base text-white/70">Personal Training</p>
            <p className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none">1:1</span>
              <span className="pb-1 text-base text-white/40">coaching</span>
            </p>
            <span className="mt-5 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
              Custom plan · email for pricing
            </span>
            <ul className="mt-6 space-y-4 text-sm">
              {PT_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild variant="white" size="pill-lg" className="mt-9 w-full">
              <a href={PT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                Message on WhatsApp →
              </a>
            </Button>
            <p className="mt-4 text-center text-sm text-white/40">
              or{" "}
              <a
                href={PT_MAILTO}
                className="text-white/60 underline-offset-2 hover:text-white hover:underline"
              >
                email me
              </a>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-[#39FF14] hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
