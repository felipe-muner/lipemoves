"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/actions/password-reset"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData()
    formData.set("email", email)
    const result = await requestPasswordReset(formData)

    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Try again.")
      return
    }

    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white antialiased">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-extrabold uppercase tracking-[0.04em] text-white"
          >
            Lipe <span className="text-[#39FF14]">Moves</span>
          </Link>
          <h1 className="mt-8 text-3xl font-extrabold uppercase tracking-tight">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-white/55">
            We&apos;ll email you a link to choose a new one
          </p>
        </div>

        {sent ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-[#39FF14]/40 bg-[#39FF14]/10 px-4 py-3 text-sm text-[#39FF14]">
              If an account exists for {email}, a reset link is on its way.
              Check your inbox (and spam) — the link expires in 1 hour.
            </div>
            <p className="text-center text-sm text-white/50">
              <Link href="/login" className="font-medium text-[#39FF14] hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="text-sm font-medium text-white/80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 flex h-11 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/30"
                  placeholder="you@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#39FF14] text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Remembered it?{" "}
              <Link href="/login" className="font-medium text-[#39FF14] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
