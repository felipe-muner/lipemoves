"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { UserDropdown } from "@/components/user-dropdown"
import { Button } from "@/components/ui/button"

export type NavItem = { label: string; id: string }

export function LandingNav({
  items,
  user,
}: {
  items: NavItem[]
  user: { name?: string | null; image?: string | null } | null
}) {
  const [active, setActive] = useState<string>("")

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    // The active section is whichever crosses the upper-middle of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [items])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-[0.25em] text-white"
        >
          Lipe Moves
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={
                active === item.id
                  ? "text-sm font-semibold text-[#39FF14] transition-colors"
                  : "text-sm font-medium text-white/60 transition-colors hover:text-white"
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserDropdown name={user.name} image={user.image} variant="dark" />
          ) : (
            <Link
              href="/login"
              className="hidden text-sm text-white/70 transition-colors hover:text-white sm:inline"
            >
              Log in
            </Link>
          )}
          <Button asChild variant="lime" size="pill-sm">
            <a href="#pricing">Find Your Program</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
