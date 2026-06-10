import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserDropdown } from "@/components/user-dropdown"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/videos"
            className="text-lg font-extrabold uppercase tracking-tight"
          >
            Lipe <span className="text-[#39FF14]">Moves</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/videos"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Videos
            </Link>
            <Link
              href="/account"
              className="hidden text-sm text-white/70 transition-colors hover:text-white sm:inline"
            >
              Account
            </Link>
            <UserDropdown
              name={session.user.name}
              image={session.user.image}
              variant="dark"
              showDashboard={Boolean(session.user.role)}
            />
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
