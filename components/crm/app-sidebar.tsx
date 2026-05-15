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
  ChevronRight,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  Tags,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Role = "admin" | "manager" | "teacher"

interface NavLeaf {
  href: string
  label: string
  icon: React.ElementType
}
interface NavGroup {
  label: string
  icon: React.ElementType
  /** Path used to detect "active" state for the parent (any descendant match). */
  basePath: string
  children: NavLeaf[]
}
type NavItem = NavLeaf | NavGroup

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item
}

const RESTAURANT_GROUP: NavGroup = {
  label: "Restaurant",
  icon: Utensils,
  basePath: "/dashboard/restaurant",
  children: [
    { href: "/dashboard/restaurant", label: "POS", icon: Utensils },
    { href: "/dashboard/restaurant-tables", label: "Tables", icon: Armchair },
    { href: "/dashboard/products", label: "Products", icon: Package },
  ],
}

const FINANCE_GROUP: NavGroup = {
  label: "Finance",
  icon: PieChart,
  basePath: "/dashboard/finance",
  children: [
    { href: "/dashboard/finance", label: "Overview", icon: PieChart },
    { href: "/dashboard/finance/income", label: "Income", icon: TrendingUp },
    {
      href: "/dashboard/finance/expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    {
      href: "/dashboard/finance/categories",
      label: "Categories",
      icon: Tags,
    },
    { href: "/dashboard/payments", label: "Payroll", icon: Wallet },
    {
      href: "/dashboard/finance/reports",
      label: "Reports",
      icon: FileText,
    },
  ],
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "Classes", icon: CalendarDays },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/dashboard/employees", label: "Employees", icon: UserCog },
    { href: "/dashboard/students", label: "Students", icon: Users },
    FINANCE_GROUP,
    { href: "/dashboard/emails", label: "Emails", icon: Mail },
    RESTAURANT_GROUP,
  ],
  manager: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "Classes", icon: CalendarDays },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/dashboard/employees", label: "Employees", icon: UserCog },
    { href: "/dashboard/students", label: "Students", icon: Users },
    FINANCE_GROUP,
    { href: "/dashboard/emails", label: "Emails", icon: Mail },
    RESTAURANT_GROUP,
  ],
  teacher: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/classes", label: "My classes", icon: CalendarDays },
    { href: "/dashboard/payments", label: "My payments", icon: Wallet },
  ],
}

function isActiveLeaf(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  // Exact match OR child path. For /restaurant + /finance overview we want
  // exact match, since deeper paths have their own sub-nav entries.
  if (href === "/dashboard/restaurant") return pathname === href
  if (href === "/dashboard/finance") return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function isActiveGroup(pathname: string, group: NavGroup): boolean {
  return group.children.some((c) => isActiveLeaf(pathname, c.href))
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
              {links.map((item) =>
                isGroup(item) ? (
                  <NavCollapsibleGroup
                    key={item.label}
                    group={item}
                    pathname={pathname}
                  />
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveLeaf(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
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

function NavCollapsibleGroup({
  group,
  pathname,
}: {
  group: NavGroup
  pathname: string
}) {
  const parentActive = isActiveGroup(pathname, group)
  return (
    <Collapsible
      asChild
      defaultOpen={parentActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={group.label}
            isActive={parentActive}
          >
            <group.icon />
            <span>{group.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.children.map((c) => {
              const active = isActiveLeaf(pathname, c.href)
              return (
                <SidebarMenuSubItem key={c.href}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link href={c.href}>
                      <c.icon />
                      <span>{c.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
