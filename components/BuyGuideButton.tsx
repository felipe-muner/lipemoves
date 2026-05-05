"use client"

import { useState } from "react"

interface BuyGuideButtonProps {
  slug: string
}

export default function BuyGuideButton({ slug }: BuyGuideButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/stripe/checkout-pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    })

    const data = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null

    if (!response.ok || !data?.url) {
      setError(data?.error ?? "Não foi possível abrir o checkout.")
      setLoading(false)
      return
    }

    window.location.href = data.url
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Abrindo checkout..." : "Comprar agora"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
