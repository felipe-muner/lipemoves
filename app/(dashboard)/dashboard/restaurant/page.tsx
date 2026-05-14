import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import {
  restaurantTables,
  products,
  sales,
  saleItems,
  employees,
  employeeRoles,
  roles,
} from "@/lib/db/schema"
import { and, eq, inArray, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Trash2, X, ArrowLeft } from "lucide-react"
import { PosPayDialog } from "@/components/crm/pos-pay-dialog"
import {
  openOrCreateTab,
  addItemToSale,
  removeSaleItem,
  updateSaleItemQuantity,
  paySale,
  cancelSale,
} from "@/lib/actions/sales"

export const dynamic = "force-dynamic"

const STATUS_TONES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  occupied: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  cleaning: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  closed: "bg-muted text-muted-foreground border-muted",
}

async function pickTable(formData: FormData) {
  "use server"
  const tableId = String(formData.get("tableId") ?? "")
  const employeeId = String(formData.get("employeeId") ?? "") || null
  if (!tableId) return
  await openOrCreateTab(tableId, employeeId)
  redirect(`/dashboard/restaurant?table=${tableId}`)
}

export default async function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role === "teacher") notFound()

  const { table: selectedTableId } = await searchParams

  // Tables grid
  const tables = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.isActive, true))
    .orderBy(restaurantTables.tableNumber)

  // Open tabs per table
  const openTabs =
    tables.length > 0
      ? await db
          .select({
            id: sales.id,
            tableId: sales.tableId,
            totalThb: sales.totalThb,
            openedAt: sales.openedAt,
          })
          .from(sales)
          .where(
            and(
              eq(sales.status, "open"),
              inArray(
                sales.tableId,
                tables.map((t) => t.id),
              ),
            ),
          )
      : []
  const tabByTable = new Map(openTabs.map((s) => [s.tableId!, s]))

  // Waiters: employees with the "waiter" role (fallback: any active employee)
  const waiterRows = await db
    .select({
      id: employees.id,
      name: employees.name,
    })
    .from(employees)
    .innerJoin(employeeRoles, eq(employeeRoles.employeeId, employees.id))
    .innerJoin(roles, eq(roles.id, employeeRoles.roleId))
    .where(and(eq(employees.isActive, true), eq(roles.slug, "waiter")))
    .orderBy(employees.name)
  const waiters =
    waiterRows.length > 0
      ? waiterRows
      : await db
          .select({ id: employees.id, name: employees.name })
          .from(employees)
          .where(eq(employees.isActive, true))
          .orderBy(employees.name)

  // Recent paid sales (compact ribbon)
  const recentPaid = await db
    .select({
      id: sales.id,
      totalThb: sales.totalThb,
      paidAt: sales.paidAt,
      paymentMethod: sales.paymentMethod,
      tableId: sales.tableId,
    })
    .from(sales)
    .where(eq(sales.status, "paid"))
    .orderBy(desc(sales.paidAt))
    .limit(5)

  // Selected-table view
  if (selectedTableId) {
    const [table] = await db
      .select()
      .from(restaurantTables)
      .where(eq(restaurantTables.id, selectedTableId))
      .limit(1)
    if (!table) notFound()

    const [tab] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.tableId, selectedTableId), eq(sales.status, "open")))
      .limit(1)
    if (!tab) {
      // No open tab yet — bounce to the picker to open one
      redirect(`/dashboard/restaurant`)
    }

    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, tab.id))
      .orderBy(saleItems.createdAt)

    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.category, products.name)

    // Group products by category
    const grouped = new Map<string, typeof productRows>()
    for (const p of productRows) {
      const arr = grouped.get(p.category) ?? []
      arr.push(p)
      grouped.set(p.category, arr)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/restaurant">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Back to tables
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Table {table.tableNumber}
                {table.room && (
                  <span className="ml-2 text-base text-muted-foreground">
                    · {table.room}
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                Open tab — items go on the bill until you take payment.
              </p>
            </div>
          </div>
          <form action={cancelSale.bind(null, tab.id)}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              <X className="mr-1 h-3.5 w-3.5" />
              Close tab without paying
            </Button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Product grid */}
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([cat, list]) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {list.map((p) => {
                      const servingsLeft = p.servingSize > 0
                        ? Math.floor(p.stockQty / p.servingSize)
                        : p.stockQty
                      const oos = servingsLeft <= 0
                      return (
                        <form
                          key={p.id}
                          action={async () => {
                            "use server"
                            await addItemToSale(tab.id, p.id, 1)
                          }}
                        >
                          <button
                            type="submit"
                            disabled={oos}
                            className="group flex w-full flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none"
                          >
                            <div className="text-sm font-medium leading-tight">
                              {p.name}
                            </div>
                            <div className="flex w-full items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {oos ? (
                                  <span className="text-red-600 font-medium">Out</span>
                                ) : (
                                  <>
                                    {servingsLeft} left
                                  </>
                                )}
                              </span>
                              <span className="font-semibold">
                                {p.priceThb.toLocaleString()} ฿
                              </span>
                            </div>
                          </button>
                        </form>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {grouped.size === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No products yet. Go to{" "}
                  <Link href="/dashboard/products" className="underline">
                    Products
                  </Link>{" "}
                  to add some.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart */}
          <Card className="self-start">
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Tap a product to add it.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{it.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.unitPriceThb.toLocaleString()} ฿ ea
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <form
                          action={async () => {
                            "use server"
                            await updateSaleItemQuantity(it.id, it.quantity - 1)
                          }}
                        >
                          <Button type="submit" variant="ghost" size="icon" className="h-7 w-7">
                            <Minus className="h-3 w-3" />
                          </Button>
                        </form>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {it.quantity}
                        </span>
                        <form
                          action={async () => {
                            "use server"
                            await updateSaleItemQuantity(it.id, it.quantity + 1)
                          }}
                        >
                          <Button type="submit" variant="ghost" size="icon" className="h-7 w-7">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </form>
                        <form action={removeSaleItem.bind(null, it.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </form>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold">
                        {it.totalThb.toLocaleString()} ฿
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {tab.subtotalThb.toLocaleString()} ฿
                  </span>
                </div>
                {tab.discountThb > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-{tab.discountThb.toLocaleString()} ฿</span>
                  </div>
                )}
                {tab.tipThb > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tip</span>
                    <span>+{tab.tipThb.toLocaleString()} ฿</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{tab.totalThb.toLocaleString()} ฿</span>
                </div>
              </div>

              {items.length > 0 && (
                <PosPayDialog
                  saleId={tab.id}
                  subtotal={tab.subtotalThb}
                  initialDiscount={tab.discountThb}
                  initialTip={tab.tipThb}
                  action={paySale.bind(null, tab.id)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Table picker view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Restaurant</h1>
        <p className="text-sm text-muted-foreground">
          Pick a table to open a tab. Tap products to add them, take payment
          when ready. Stock is decremented at checkout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No tables yet. Go to{" "}
              <Link href="/dashboard/restaurant-tables" className="underline">
                Restaurant tables
              </Link>{" "}
              to add some.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tables.map((t) => {
                const tab = tabByTable.get(t.id)
                const tone = STATUS_TONES[t.status]
                return (
                  <form key={t.id} action={pickTable}>
                    <input type="hidden" name="tableId" value={t.id} />
                    <input
                      type="hidden"
                      name="employeeId"
                      value={waiters[0]?.id ?? ""}
                    />
                    <button
                      type="submit"
                      className={`flex w-full flex-col gap-1 rounded-lg border-2 p-4 text-left transition hover:shadow-md ${tone}`}
                    >
                      <div className="text-lg font-semibold">{t.tableNumber}</div>
                      <div className="text-xs">
                        {t.room ?? "—"} · {t.seats ?? "?"} seats
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <Badge variant="outline" className="capitalize">
                          {t.status}
                        </Badge>
                        {tab && (
                          <span className="font-semibold">
                            {tab.totalThb.toLocaleString()} ฿
                          </span>
                        )}
                      </div>
                    </button>
                  </form>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {recentPaid.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent paid sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {recentPaid.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    #{s.id.slice(0, 8)}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {s.paymentMethod ?? "—"}
                  </span>
                  <span className="font-medium">
                    {s.totalThb.toLocaleString()} ฿
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
