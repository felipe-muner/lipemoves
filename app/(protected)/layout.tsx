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
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-xl">
            Lipe Moves
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/videos"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Vídeos
            </Link>
            <UserDropdown name={session.user.name} image={session.user.image} />
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
