import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpenseCategoryDialog } from "@/components/crm/expense-category-dialog"
import { DeleteRowButton } from "@/components/crm/delete-row-button"
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  ensureDefaultExpenseCategories,
} from "@/lib/actions/expense-categories"
import { listExpenseCategories } from "@/lib/finance/queries"

export const dynamic = "force-dynamic"

export default async function ExpenseCategoriesPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  await ensureDefaultExpenseCategories()
  const rows = await listExpenseCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Expense categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Buckets used when classifying expenses. Add your own — system
            categories can be deactivated but not deleted.
          </p>
        </div>
        <ExpenseCategoryDialog mode="create" action={createExpenseCategory} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Sort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span
                      className="inline-block h-6 w-6 rounded-md border border-black/10"
                      style={{ background: r.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.isSystem && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        System
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <code>{r.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {r.sortOrder}
                  </TableCell>
                  <TableCell>
                    {r.isActive ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ExpenseCategoryDialog
                        mode="edit"
                        values={{
                          name: r.name,
                          color: r.color,
                          description: r.description,
                          isActive: r.isActive,
                          sortOrder: r.sortOrder,
                        }}
                        action={updateExpenseCategory.bind(null, r.id)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      {!r.isSystem && (
                        <DeleteRowButton
                          action={deleteExpenseCategory.bind(null, r.id)}
                          confirmText={`Delete category "${r.name}"? Only works if no expenses use it.`}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
