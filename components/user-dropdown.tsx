"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown } from "lucide-react"

interface UserDropdownProps {
  name: string | null | undefined
  image: string | null | undefined
  variant?: "light" | "dark"
}

export function UserDropdown({ name, image, variant = "light" }: UserDropdownProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  const textClass =
    variant === "dark"
      ? "text-white/70 hover:text-white"
      : "text-muted-foreground hover:text-foreground"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center gap-2 text-sm outline-none ${textClass}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={image ?? undefined} alt={name ?? "Usuário"} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/account">Painel</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
