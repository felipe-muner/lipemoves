"use client"

import { useState } from "react"

export function EbooksSubscribeForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage(null)

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: "ebooks-page" }),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setErrorMessage(data?.error ?? "Something went wrong. Try again.")
      setStatus("error")
      return
    }

    setStatus("ok")
    setEmail("")
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Thanks — you’re on the list. I’ll be in touch.
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"
    >
      <div className="flex-1 text-sm">
        <p className="font-medium">Want updates from Felipe?</p>
        <p className="text-xs text-muted-foreground">
          Optional. Drop your email if you want occasional notes on movement, food
          and new guides.
        </p>
      </div>
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm sm:w-56"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Subscribe"}
      </button>
      {errorMessage ? (
        <p className="text-xs text-red-500 sm:basis-full">{errorMessage}</p>
      ) : null}
    </form>
  )
}
