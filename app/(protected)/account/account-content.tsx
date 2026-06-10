"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const LIME = "#39FF14"

export default function AccountContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loadingPortal, setLoadingPortal] = useState(false)

  async function handleManageSubscription() {
    setLoadingPortal(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    setLoadingPortal(false)

    if (data.url) {
      router.push(data.url)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.35em] text-white/40">
        Account
      </p>
      <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
        My <span style={{ color: LIME }}>account.</span>
      </h1>

      <div className="mt-10 space-y-5">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Information
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-white/50">Name:</span>{" "}
              {session?.user?.name || "Not provided"}
            </p>
            <p>
              <span className="text-white/50">Email:</span>{" "}
              {session?.user?.email}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Subscription
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Change your plan, update your card or cancel — anytime.
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#39FF14] px-7 text-sm font-semibold text-black transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            {loadingPortal ? "Loading..." : "Manage subscription"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Session
          </h2>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-7 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  )
}
