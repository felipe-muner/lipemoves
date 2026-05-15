"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Wallet,
  Mail,
  MapPin,
  Utensils,
  Package,
  UserCog,
  Armchair,
  PieChart,
  TrendingUp,
  TrendingDown,
  Tags,
  FileText,
  Settings,
  Search,
  ArrowRight,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

type Role = "admin" | "manager" | "teacher"

interface Entry {
  label: string
  href: string
  icon: React.ElementType
  /** Extra search terms (synonyms / acronyms). */
  keywords?: string
  /** Roles that can see this entry. Empty = all. */
  roles?: Role[]
}

interface Group {
  heading: string
  items: Entry[]
}

const NAV_GROUPS: Group[] = [
  {
    heading: "Navigation",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        keywords: "home dashboard summary",
      },
      {
        label: "My account",
        href: "/dashboard/account",
        icon: Settings,
        keywords: "profile preferences sign-out",
      },
    ],
  },
  {
    heading: "Yoga",
    items: [
      {
        label: "Classes",
        href: "/dashboard/classes",
        icon: CalendarDays,
        keywords: "schedule calendar week",
      },
      {
        label: "Teachers",
        href: "/dashboard/teachers",
        icon: GraduationCap,
        keywords: "instructors staff",
        roles: ["admin", "manager"],
      },
      {
        label: "Students",
        href: "/dashboard/students",
        icon: Users,
        keywords: "members customers",
        roles: ["admin", "manager"],
      },
      {
        label: "Locations",
        href: "/dashboard/locations",
        icon: MapPin,
        keywords: "shala room studio",
        roles: ["admin", "manager"],
      },
      {
        label: "Memberships",
        href: "/dashboard/memberships",
        icon: Tags,
        keywords: "plans drop-in pass packs subscription",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    heading: "Finance",
    items: [
      {
        label: "Finance overview",
        href: "/dashboard/finance",
        icon: PieChart,
        keywords: "money kpi summary profit revenue",
        roles: ["admin", "manager"],
      },
      {
        label: "Income",
        href: "/dashboard/finance/income",
        icon: TrendingUp,
        keywords: "revenue sales in earnings",
        roles: ["admin", "manager"],
      },
      {
        label: "Expenses",
        href: "/dashboard/finance/expenses",
        icon: TrendingDown,
        keywords: "out spending cost rent utilities",
        roles: ["admin", "manager"],
      },
      {
        label: "Expense categories",
        href: "/dashboard/finance/categories",
        icon: Tags,
        keywords: "buckets classification",
        roles: ["admin", "manager"],
      },
      {
        label: "Payroll / Payments",
        href: "/dashboard/payments",
        icon: Wallet,
        keywords: "teacher payouts salary",
      },
      {
        label: "PDF reports",
        href: "/dashboard/finance/reports",
        icon: FileText,
        keywords: "print pdf export statement",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    heading: "Restaurant",
    items: [
      {
        label: "POS",
        href: "/dashboard/restaurant",
        icon: Utensils,
        keywords: "point of sale checkout cart tab",
      },
      {
        label: "Tables",
        href: "/dashboard/restaurant-tables",
        icon: Armchair,
        keywords: "booth seating rooms",
        roles: ["admin", "manager"],
      },
      {
        label: "Products",
        href: "/dashboard/products",
        icon: Package,
        keywords: "stock inventory menu items",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    heading: "People",
    items: [
      {
        label: "Employees",
        href: "/dashboard/employees",
        icon: UserCog,
        keywords: "staff roles teams",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    heading: "Communication",
    items: [
      {
        label: "Emails",
        href: "/dashboard/emails",
        icon: Mail,
        keywords: "campaign newsletter broadcast",
        roles: ["admin", "manager"],
      },
    ],
  },
]

const QUICK_ACTIONS: Entry[] = [
  {
    label: "New expense",
    href: "/dashboard/finance/expenses",
    icon: PlusCircle,
    keywords: "create add log spend",
    roles: ["admin", "manager"],
  },
  {
    label: "New student",
    href: "/dashboard/students",
    icon: PlusCircle,
    keywords: "create add register",
    roles: ["admin", "manager"],
  },
  {
    label: "New class",
    href: "/dashboard/classes",
    icon: PlusCircle,
    keywords: "create schedule add",
    roles: ["admin", "manager"],
  },
  {
    label: "Open POS",
    href: "/dashboard/restaurant",
    icon: PlusCircle,
    keywords: "take order sale checkout",
  },
]

function visibleFor(role: Role, items: Entry[]) {
  return items.filter((i) => !i.roles || i.roles.includes(role))
}

export function CommandPalette({ role }: { role: Role }) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  const groups = NAV_GROUPS.map((g) => ({
    heading: g.heading,
    items: visibleFor(role, g.items),
  })).filter((g) => g.items.length > 0)

  const quickActions = visibleFor(role, QUICK_ACTIONS)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 w-full max-w-sm justify-between gap-2 px-3 text-sm font-normal text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Search...
        </span>
        <kbd className="pointer-events-none ml-auto flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a page or run a quick action"
        showCloseButton={false}
      >
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {quickActions.length > 0 && (
            <>
              <CommandGroup heading="Quick actions">
                {quickActions.map((a) => (
                  <CommandItem
                    key={`qa-${a.label}`}
                    value={`${a.label} ${a.keywords ?? ""}`}
                    onSelect={() => go(a.href)}
                  >
                    <a.icon className="text-muted-foreground" />
                    <span>{a.label}</span>
                    <ArrowRight className="ml-auto text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {groups.map((g, idx) => (
            <React.Fragment key={g.heading}>
              <CommandGroup heading={g.heading}>
                {g.items.map((it) => (
                  <CommandItem
                    key={it.href + it.label}
                    value={`${it.label} ${it.keywords ?? ""} ${g.heading}`}
                    onSelect={() => go(it.href)}
                  >
                    <it.icon className="text-muted-foreground" />
                    <span>{it.label}</span>
                    <CommandShortcut className="font-mono text-[10px] tracking-normal">
                      {it.href.replace("/dashboard", "") || "/"}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              {idx < groups.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
