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
import { ArrowLeft } from "lucide-react"
import { PosPayDialog } from "@/components/crm/pos-pay-dialog"
import { CloseTabButton } from "@/components/crm/close-tab-button"
import { PosProductGrid } from "@/components/crm/pos-product-grid"
import { PosCartItem } from "@/components/crm/pos-cart-item"
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

    // How many of each product are already on the open tab — used to
    // compute "can still add" so we can't oversell.
    const onTabByProduct = new Map<string, number>()
    for (const it of items) {
      if (!it.productId) continue
      onTabByProduct.set(
        it.productId,
        (onTabByProduct.get(it.productId) ?? 0) + it.quantity,
      )
    }

    function servingsLeft(p: { stockQty: number; servingSize: number }) {
      return p.servingSize > 0
        ? Math.floor(p.stockQty / p.servingSize)
        : p.stockQty
    }
    function canAddMoreFor(productId: string, baseProduct: typeof productRows[number] | undefined) {
      const p = baseProduct ?? productRows.find((x) => x.id === productId)
      if (!p) return 0
      return Math.max(0, servingsLeft(p) - (onTabByProduct.get(productId) ?? 0))
    }

    const canAddMoreById: Record<string, number> = {}
    for (const p of productRows) {
      canAddMoreById[p.id] = canAddMoreFor(p.id, p)
    }

    // Defense-in-depth: detect if any cart line already exceeds stock
    // (could happen if stock got adjusted lower elsewhere). Block Pay if so.
    const anyOverstock = items.some((it) => {
      if (!it.productId) return false
      const p = productRows.find((x) => x.id === it.productId)
      if (!p) return false
      return it.quantity > servingsLeft(p)
    })

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
          <CloseTabButton
            itemCount={items.length}
            totalThb={tab.totalThb}
            action={cancelSale.bind(null, tab.id)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Product grid */}
          <div>
            {productRows.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No products yet. Go to{" "}
                  <Link href="/dashboard/products" className="underline">
                    Products
                  </Link>{" "}
                  to add some.
                </CardContent>
              </Card>
            ) : (
              <PosProductGrid
                saleId={tab.id}
                products={productRows.map((p) => ({
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  description: p.description,
                  category: p.category,
                  baseUnit: p.baseUnit,
                  servingSize: p.servingSize,
                  stockQty: p.stockQty,
                  priceThb: p.priceThb,
                  imageUrl: p.imageUrl,
                }))}
                canAddMoreById={canAddMoreById}
              />
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
                    <PosCartItem
                      key={it.id}
                      item={{
                        id: it.id,
                        productName: it.productName,
                        unitPriceThb: it.unitPriceThb,
                        quantity: it.quantity,
                        totalThb: it.totalThb,
                      }}
                      canAddMore={
                        it.productId ? canAddMoreFor(it.productId, undefined) : 0
                      }
                    />
                  ))}
                </div>
              )}

              {anyOverstock && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700">
                  Some items exceed available stock. Reduce quantities before
                  taking payment.
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
                  disabled={anyOverstock}
                  disabledReason="Reduce overstock items first"
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
