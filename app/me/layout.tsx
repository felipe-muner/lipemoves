import Link from "next/link"
import { requireUser } from "@/lib/auth/user"
import { MeUserMenu } from "@/components/me/me-user-menu"

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <Link href="/me" className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xs font-bold">LM</span>
            </div>
            <div className="grid text-left text-sm leading-tight">
              <span className="font-semibold">Lipe Moves</span>
              <span className="text-xs text-muted-foreground">My movement</span>
            </div>
          </Link>
          <MeUserMenu
            isAdmin={user.role === "admin"}
            user={{ name: user.name, email: user.email, image: user.image }}
          />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  )
}
