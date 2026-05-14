"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Wallet,
  Mail,
  MapPin,
  Command,
  Utensils,
  Package,
  UserCog,
  Armchair,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronUp } from "lucide-react"

type Role = "admin" | "manager" | "teacher"

const NAV: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "Classes", icon: CalendarDays },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/dashboard/employees", label: "Employees", icon: UserCog },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/payments", label: "Payments", icon: Wallet },
    { href: "/dashboard/emails", label: "Emails", icon: Mail },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/restaurant-tables", label: "Tables", icon: Armchair },
    { href: "/dashboard/restaurant", label: "Restaurant", icon: Utensils },
  ],
  manager: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "Classes", icon: CalendarDays },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/dashboard/employees", label: "Employees", icon: UserCog },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/payments", label: "Payments", icon: Wallet },
    { href: "/dashboard/emails", label: "Emails", icon: Mail },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/restaurant-tables", label: "Tables", icon: Armchair },
    { href: "/dashboard/restaurant", label: "Restaurant", icon: Utensils },
  ],
  teacher: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "My classes", icon: CalendarDays },
    { href: "/dashboard/payments", label: "My payments", icon: Wallet },
  ],
}

export function AppSidebar({
  role,
  user,
}: {
  role: Role
  user: { name: string | null; email: string | null; image: string | null }
}) {
  const pathname = usePathname()
  const links = NAV[role]
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Yoga Center</span>
                  <span className="truncate text-xs capitalize text-muted-foreground">
                    {role}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user.name ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-(--radix-popper-anchor-width) min-w-56"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
