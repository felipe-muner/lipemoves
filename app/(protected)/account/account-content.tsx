"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-heading text-3xl">Minha Conta</h1>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-medium">Informa&ccedil;&otilde;es</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nome:</span>{" "}
              {session?.user?.name || "N\u00e3o informado"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {session?.user?.email}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-medium">Assinatura</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie sua assinatura, atualize seu plano ou cancele.
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {loadingPortal ? "Carregando..." : "Gerenciar Assinatura"}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-medium">Sess&atilde;o</h2>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-destructive/10 px-6 text-sm font-medium text-destructive hover:bg-destructive/20"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </main>
  )
}
