"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "@/lib/actions/password-reset"

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set("token", token)
    formData.set("password", password)
    const result = await resetPassword(formData)
    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Try again.")
      return
    }

    setDone(true)
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
            New password
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Choose a new password for your account
          </p>
        </div>

        {done ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-[#39FF14]/40 bg-[#39FF14]/10 px-4 py-3 text-sm text-[#39FF14]">
              Password updated. You can sign in with it now.
            </div>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#39FF14] text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Sign in
            </Link>
          </div>
        ) : !token ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              This reset link is invalid or incomplete.
            </div>
            <p className="text-center text-sm text-white/50">
              <Link
                href="/forgot-password"
                className="font-medium text-[#39FF14] hover:underline"
              >
                Request a new link
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
                {error.includes("Request a new one") && (
                  <>
                    {" "}
                    <Link
                      href="/forgot-password"
                      className="font-medium text-[#39FF14] hover:underline"
                    >
                      Request a new link
                    </Link>
                  </>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 flex h-11 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/30"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="text-sm font-medium text-white/80">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 flex h-11 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/30"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#39FF14] text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
