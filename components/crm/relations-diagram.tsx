"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void
      run: (opts?: { nodes?: HTMLElement[] }) => Promise<void>
      parse?: (text: string) => void
    }
  }
}

// ───────────────────────────────────────────────────────────
// Diagram source. Grouped by domain. The CRM flow is the star
// of the show — Check-in → Student → Membership → Plan — and
// is highlighted via the `crm` classDef below.
// ───────────────────────────────────────────────────────────
const DIAGRAM = `
flowchart LR
  %% ─── CRM (highlighted flow) ───
  subgraph CRM["🧘 CRM — Yoga center"]
    direction LR
    checkin["membership_checkins<br/>(reception entry log)"]:::crm
    students[("students<br/>email = PK")]:::crm
    memberships["student_memberships<br/>(active plans / credits)"]:::crm
    plans["membership_plans<br/>(templates: Drop-in, Monthly…)"]:::crm
    classes["yoga_classes<br/>(scheduled sessions)"]:::crm
    attendance["class_attendance<br/>(per-class booking)"]:::crm
    locations["locations"]:::crm
  end

  checkin -->|student_email| students
  checkin -->|membership_id| memberships
  memberships -->|student_email| students
  memberships -->|plan_id| plans
  attendance -->|class_id| classes
  attendance -->|student_email| students
  attendance -->|membership_id| memberships
  classes -->|location_id| locations

  %% ─── Team ───
  subgraph TEAM["👥 Team"]
    direction LR
    employees["employees"]:::team
    users["users"]:::team
    roles["roles"]:::team
    teams["teams"]:::team
    employeeRoles["employee_roles"]:::team
    employeeTeams["employee_teams"]:::team
  end

  classes -->|employee_id| employees
  employees -->|user_id| users
  employeeRoles -->|employee_id| employees
  employeeRoles -->|role_id| roles
  employeeTeams -->|employee_id| employees
  employeeTeams -->|team_id| teams

  %% ─── Auth & content ───
  subgraph AUTH["🔐 Auth & content"]
    direction LR
    accounts["accounts"]:::auth
    sessions["sessions"]:::auth
    subscriptions["subscriptions"]:::auth
    videos["videos"]:::auth
    categories["categories"]:::auth
    vtokens["verification_tokens"]:::auth
  end

  accounts -->|user_id| users
  sessions -->|user_id| users
  subscriptions -->|user_id| users
  videos -->|category_id| categories

  %% ─── Restaurant ───
  subgraph RESTAURANT["🍴 Restaurant / POS"]
    direction LR
    tables["restaurant_tables"]:::restaurant
    sales["sales"]:::restaurant
    saleItems["sale_items"]:::restaurant
    products["products"]:::restaurant
    stock["stock_movements"]:::restaurant
  end

  sales -->|table_id| tables
  sales -->|employee_id| employees
  saleItems -->|sale_id| sales
  saleItems -->|product_id| products
  stock -->|product_id| products

  %% ─── Finance ───
  subgraph FINANCE["💰 Finance (business)"]
    direction LR
    expenses["expenses"]:::finance
    expenseCats["expense_categories"]:::finance
  end

  expenses -->|category_id| expenseCats
  expenses -->|employee_id| employees
  expenses -->|created_by_user_id| users

  %% ─── Personal ───
  subgraph PERSONAL["❤️ Personal (Felipe)"]
    direction LR
    pExpenses["personal_expenses"]:::personal
    pExpenseCats["personal_expense_categories"]:::personal
    mEntries["movement_entries"]:::personal
    mCats["movement_categories"]:::personal
  end

  pExpenses -->|user_id| users
  pExpenses -->|category_id| pExpenseCats
  pExpenseCats -->|user_id| users
  mEntries -->|user_id| users
  mEntries -->|category_id| mCats
  mCats -->|user_id| users

  %% ─── Subscribers ───
  subgraph EMAIL["✉️ Subscribers"]
    direction LR
    subscribers["email_subscribers<br/>(newsletter / ebook leads)"]:::email
  end

  %% ─── Digital products ───
  subgraph DIGITAL["📚 Digital products (ebooks)"]
    direction LR
    dProducts["digital_products"]:::digital
    dPurchases["digital_purchases"]:::digital
  end

  dPurchases -->|product_id| dProducts

  classDef crm fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
  classDef team fill:#ede9fe,stroke:#7c3aed,stroke-width:1px,color:#4c1d95
  classDef auth fill:#e0e7ff,stroke:#4f46e5,stroke-width:1px,color:#312e81
  classDef restaurant fill:#fee2e2,stroke:#dc2626,stroke-width:1px,color:#7f1d1d
  classDef finance fill:#dcfce7,stroke:#16a34a,stroke-width:1px,color:#14532d
  classDef personal fill:#fce7f3,stroke:#db2777,stroke-width:1px,color:#831843
  classDef email fill:#cffafe,stroke:#0891b2,stroke-width:1px,color:#164e63
  classDef digital fill:#f3e8ff,stroke:#9333ea,stroke-width:1px,color:#581c87
`

function DiagramSkeleton() {
  // A subtle ER-shaped placeholder: a few boxes + connector lines, animated.
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-12">
      <svg
        viewBox="0 0 600 280"
        className="w-full max-w-2xl animate-pulse text-muted-foreground/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {/* Boxes */}
        <rect x="20" y="20" width="140" height="60" rx="8" fill="currentColor" fillOpacity="0.15" />
        <rect x="230" y="20" width="140" height="60" rx="8" fill="currentColor" fillOpacity="0.15" />
        <rect x="440" y="20" width="140" height="60" rx="8" fill="currentColor" fillOpacity="0.15" />
        <rect x="125" y="200" width="140" height="60" rx="8" fill="currentColor" fillOpacity="0.15" />
        <rect x="335" y="200" width="140" height="60" rx="8" fill="currentColor" fillOpacity="0.15" />
        {/* Connectors */}
        <path d="M160 50 L230 50" />
        <path d="M370 50 L440 50" />
        <path d="M90 80 L195 200" />
        <path d="M300 80 L300 200" />
        <path d="M510 80 L405 200" />
      </svg>
      <p className="text-sm text-muted-foreground">Drawing diagram…</p>
    </div>
  )
}

const LEGEND: { label: string; bg: string; border: string }[] = [
  { label: "CRM (core flow)", bg: "#fef3c7", border: "#d97706" },
  { label: "Team", bg: "#ede9fe", border: "#7c3aed" },
  { label: "Auth & content", bg: "#e0e7ff", border: "#4f46e5" },
  { label: "Restaurant", bg: "#fee2e2", border: "#dc2626" },
  { label: "Finance", bg: "#dcfce7", border: "#16a34a" },
  { label: "Personal", bg: "#fce7f3", border: "#db2777" },
  { label: "Subscribers", bg: "#cffafe", border: "#0891b2" },
  { label: "Digital products", bg: "#f3e8ff", border: "#9333ea" },
]

export function RelationsDiagram() {
  const ref = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scriptLoaded || !ref.current || !window.mermaid) return
    let cancelled = false
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: { htmlLabels: true, curve: "basis", padding: 16 },
      })
      window.mermaid
        .run({ nodes: [ref.current] })
        .then(() => {
          if (!cancelled) setRendered(true)
        })
        .catch((e: unknown) => {
          if (!cancelled)
            setError(e instanceof Error ? e.message : "Failed to render diagram")
        })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to render diagram")
    }
    return () => {
      cancelled = true
    }
  }, [scriptLoaded])

  return (
    <div className="flex flex-col gap-4">
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="flex flex-wrap gap-2">
        {LEGEND.map((l) => (
          <div
            key={l.label}
            className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
            style={{ backgroundColor: l.bg, borderColor: l.border }}
          >
            <span style={{ color: l.border }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="relative rounded-lg border bg-white p-4 overflow-auto min-h-[420px]">
        {error ? (
          <p className="text-sm text-destructive">Error: {error}</p>
        ) : (
          <>
            {/* Skeleton overlay shown until mermaid finishes painting */}
            {!rendered ? <DiagramSkeleton /> : null}
            <div
              ref={ref}
              className="mermaid w-full"
              key="relations-diagram"
              style={{
                visibility: rendered ? "visible" : "hidden",
                position: rendered ? "static" : "absolute",
                pointerEvents: rendered ? "auto" : "none",
              }}
            >
              {DIAGRAM}
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">How to read the CRM flow</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            A student walks in → reception logs a row in{" "}
            <code className="rounded bg-background px-1">membership_checkins</code>.
          </li>
          <li>
            The check-in points to a{" "}
            <code className="rounded bg-background px-1">students</code> row (by
            email) and the active{" "}
            <code className="rounded bg-background px-1">student_memberships</code>{" "}
            row (the plan they're using).
          </li>
          <li>
            That membership was created from a{" "}
            <code className="rounded bg-background px-1">membership_plans</code>{" "}
            template (Drop-in, 10-pack, Monthly…).
          </li>
          <li>
            If the visit was for a specific scheduled class, a row is also added to{" "}
            <code className="rounded bg-background px-1">class_attendance</code>{" "}
            linking the student + membership + the{" "}
            <code className="rounded bg-background px-1">yoga_classes</code> row.
          </li>
        </ol>
      </div>
    </div>
  )
}
