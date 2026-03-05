import Link from "next/link"
import { auth } from "@/lib/auth"
import { UserDropdown } from "@/components/user-dropdown"

export default async function Header() {
  const session = await auth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-xl text-white">
          Lipe Moves
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="#about"
            className="hidden text-sm text-white/70 hover:text-white sm:inline"
          >
            Sobre
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm text-white/70 hover:text-white sm:inline"
          >
            Preços
          </Link>
          {session?.user ? (
            <UserDropdown
              name={session.user.name}
              image={session.user.image}
              variant="dark"
            />
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/20 px-5 text-sm text-white/90 hover:bg-white/10"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
