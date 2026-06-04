"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PieChart,
  Film,
  Settings,
  Search,
  ArrowRight,
  PlusCircle,
  Hash,
  BookOpen,
  Inbox,
  Clapperboard,
  Timer,
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

interface Entry {
  label: string
  href: string
  icon: React.ElementType
  /** Extra search terms (synonyms / acronyms). */
  keywords?: string
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
        keywords: "home dashboard summary kpi",
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
    heading: "Manage",
    items: [
      {
        label: "Members",
        href: "/dashboard/members",
        icon: Users,
        keywords: "subscribers customers paying plans stripe",
      },
      {
        label: "Finance",
        href: "/dashboard/finance",
        icon: PieChart,
        keywords: "money revenue mrr churn subscriptions income",
      },
      {
        label: "Videos",
        href: "/dashboard/videos",
        icon: Film,
        keywords: "library kettlebell mobility content bunny upload",
      },
      {
        label: "Subscribers",
        href: "/dashboard/subscribers",
        icon: Inbox,
        keywords: "email list newsletter leads contacts audience",
      },
      {
        label: "Ebooks",
        href: "/dashboard/ebooks",
        icon: BookOpen,
        keywords: "pdf guides books move better download lead magnet",
      },
    ],
  },
  {
    heading: "Content",
    items: [
      {
        label: "Studio",
        href: "/dashboard/studio",
        icon: Clapperboard,
        keywords: "video editor render cover clips reels",
      },
      {
        label: "Captions",
        href: "/dashboard/captions",
        icon: Hash,
        keywords: "hashtags instagram tiktok youtube social posts copy",
      },
      {
        label: "Timer",
        href: "/dashboard/timer",
        icon: Timer,
        keywords: "emom interval beep minute countdown workout stopwatch",
      },
    ],
  },
]

const QUICK_ACTIONS: Entry[] = [
  {
    label: "Add video",
    href: "/dashboard/videos",
    icon: PlusCircle,
    keywords: "create upload new clip library",
  },
]

export function CommandPalette() {
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

          <CommandGroup heading="Quick actions">
            {QUICK_ACTIONS.map((a) => (
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

          {NAV_GROUPS.map((g, idx) => (
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
              {idx < NAV_GROUPS.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
