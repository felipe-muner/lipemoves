import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { ProductDialog } from "@/components/crm/product-dialog"
import { StockAdjustDialog } from "@/components/crm/stock-adjust-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import { Money } from "@/components/crm/money"
import { ProductAvatar } from "@/components/crm/product-avatar"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addStockFromForm,
} from "@/lib/actions/products"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const rows = await db.select().from(products).orderBy(products.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Sellable items + stock. Split items (1 kg whey → 30 g shakes) work
            via base unit + serving size.
          </p>
        </div>
        <ProductDialog mode="create" action={createProduct} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Servings left</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => {
                  const servingsLeft = p.servingSize > 0
                    ? Math.floor(p.stockQty / p.servingSize)
                    : p.stockQty
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductAvatar
                            name={p.name}
                            imageUrl={p.imageUrl}
                            size={36}
                          />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            {p.sku && (
                              <div className="text-xs text-muted-foreground">
                                <code>{p.sku}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-medium">{p.stockQty}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {p.baseUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            servingsLeft <= 0
                              ? "text-red-600 font-medium"
                              : servingsLeft <= 5
                                ? "text-amber-600 font-medium"
                                : ""
                          }
                        >
                          {servingsLeft}
                        </span>
                        {p.servingSize !== 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (× {p.servingSize}{p.baseUnit})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money thb={p.priceThb} />
                      </TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <StockAdjustDialog
                            productName={p.name}
                            baseUnit={p.baseUnit}
                            action={addStockFromForm.bind(null, p.id)}
                          />
                          <ProductDialog
                            mode="edit"
                            values={{
                              name: p.name,
                              sku: p.sku,
                              description: p.description,
                              category: p.category,
                              baseUnit: p.baseUnit,
                              servingSize: p.servingSize,
                              priceThb: p.priceThb,
                              imageUrl: p.imageUrl,
                              isActive: p.isActive,
                              stockQty: p.stockQty,
                            }}
                            action={updateProduct.bind(null, p.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DeleteRowButton
                            action={deleteProduct.bind(null, p.id)}
                            confirmText={`Delete "${p.name}"?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
