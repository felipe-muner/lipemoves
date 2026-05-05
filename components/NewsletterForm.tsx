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
      setErrorMessage(data?.error ?? "Algo deu errado. Tente de novo.")
      setStatus("error")
      return
    }

    setStatus("ok")
    setEmail("")
    setName("")
  }

  if (status === "ok") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-heading text-lg">Pronto. Confere seu email.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          O primeiro email já está a caminho.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        placeholder="Seu nome (opcional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm"
      />
      <input
        type="email"
        required
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Receber"}
      </button>
      {errorMessage ? (
        <p className="text-sm text-red-500 sm:w-full">{errorMessage}</p>
      ) : null}
    </form>
  )
}
