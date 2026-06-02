"use client"

import { useState } from "react"

interface NewsletterFormProps {
  source?: string
}

export default function NewsletterForm({ source = "homepage" }: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage(null)

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name: name || undefined, source }),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setErrorMessage(data?.error ?? "Something went wrong. Please try again.")
      setStatus("error")
      return
    }

    setStatus("ok")
    setEmail("")
    setName("")
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-[#39FF14]/40 bg-[#39FF14]/5 p-6 text-center">
        <p className="text-lg font-semibold text-white">You&apos;re in. Check your inbox.</p>
        <p className="mt-2 text-sm text-white/60">
          The first email is already on its way.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="nl-name" className="sr-only">
            Your name (optional)
          </label>
          <input
            id="nl-name"
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-[#39FF14] focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="nl-email" className="sr-only">
            Email address
          </label>
          <input
            id="nl-email"
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-[#39FF14] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 shrink-0 rounded-full bg-[#39FF14] px-8 text-sm font-semibold text-black transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Get the guide"}
        </button>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-400">{errorMessage}</p>
      ) : (
        <p className="text-xs text-white/35">No spam. Unsubscribe anytime.</p>
      )}
    </form>
  )
}
