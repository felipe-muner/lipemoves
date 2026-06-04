"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

const plans = [
  {
    name: "Monthly",
    price: "R$97",
    period: "/month",
    priceEnv: "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID",
    features: [
      "Access to all videos",
      "New classes every week",
      "Cancel anytime",
    ],
    highlight: false,
  },
  {
    name: "Annual",
    price: "R$970",
    period: "/year",
    priceEnv: "NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID",
    savings: "Save R$194",
    features: [
      "Everything in the monthly plan",
      "2 months free",
      "Priority access",
    ],
    highlight: true,
  },
]

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
      priceEnv === "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID"
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })

    const data = await res.json()
    setLoading(null)

    if (data.url) {
      router.push(data.url)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-4xl md:text-5xl">Plans &amp; Pricing</h1>
        <p className="mt-4 text-muted-foreground">
          Unlimited access to all videos. Cancel anytime.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-8 ${
                plan.highlight
                  ? "border-2 border-primary bg-card"
                  : "border border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Best value
                </span>
              )}
              <h2 className="font-heading text-2xl">{plan.name}</h2>
              <p className="mt-4 text-4xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-muted-foreground">
                  {plan.period}
                </span>
              </p>
              {plan.savings && (
                <p className="mt-1 text-sm text-primary">{plan.savings}</p>
              )}
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceEnv)}
                disabled={loading === plan.priceEnv}
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading === plan.priceEnv ? "Loading..." : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
