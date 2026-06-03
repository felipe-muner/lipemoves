"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NewsletterFormProps {
  source?: string
}

// Brand pill style shared by both fields (overrides shadcn Input defaults).
const pillInput =
  "h-12 rounded-full border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 focus-visible:border-[#39FF14] focus-visible:ring-[#39FF14]/30 dark:bg-white/5"

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
          <Input
            id="nl-name"
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={pillInput}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="nl-email" className="sr-only">
            Email address
          </label>
          <Input
            id="nl-email"
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInput}
          />
        </div>
        <Button
          type="submit"
          variant="lime"
          size="pill"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending…" : "Get the guide"}
        </Button>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-400">{errorMessage}</p>
      ) : (
        <p className="text-xs text-white/35">No spam. Unsubscribe anytime.</p>
      )}
    </form>
  )
}
