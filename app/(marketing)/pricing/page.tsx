"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

const plans = [
  {
    name: "Mensal",
    price: "R$49",
    period: "/m\u00eas",
    priceEnv: "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID",
    features: [
      "Acesso a todos os v\u00eddeos",
      "Novas aulas toda semana",
      "Cancele quando quiser",
    ],
    highlight: false,
  },
  {
    name: "Anual",
    price: "R$490",
    period: "/ano",
    priceEnv: "NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID",
    savings: "Economia de R$98",
    features: [
      "Tudo do plano mensal",
      "2 meses gr\u00e1tis",
      "Acesso priorit\u00e1rio",
    ],
    highlight: true,
  },
]

export default function PricingPage() {
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
        <h1 className="font-heading text-4xl md:text-5xl">Planos e Pre&ccedil;os</h1>
        <p className="mt-4 text-muted-foreground">
          Acesso ilimitado a todos os v&iacute;deos. Cancele quando quiser.
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
                  Melhor valor
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
                {loading === plan.priceEnv ? "Carregando..." : "Assinar"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          J&aacute; tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
