"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type BaseUnit = "g" | "ml" | "piece"
type Category = "drink" | "food" | "supplement" | "retail" | "other"

export interface ProductDialogValues {
  id?: string
  name?: string
  sku?: string | null
  description?: string | null
  category?: Category
  baseUnit?: BaseUnit
  stockQty?: number
  servingSize?: number
  priceThb?: number
  isActive?: boolean
}

export function ProductDialog({
  mode,
  values,
  action,
  trigger,
}: {
  mode: "create" | "edit"
  values?: ProductDialogValues
  action: (formData: FormData) => Promise<void>
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [category, setCategory] = React.useState<Category>(
    values?.category ?? "drink",
  )
  const [baseUnit, setBaseUnit] = React.useState<BaseUnit>(
    values?.baseUnit ?? "piece",
  )
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await action(formData)
                toast.success(mode === "create" ? "Product created" : "Product saved")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error((err as Error).message ?? "Something went wrong")
              }
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New product" : "Edit product"}
            </DialogTitle>
            <DialogDescription>
              For items you split (1 kg whey → many 30 g shakes), set base unit
              to <code>g</code>, stock to <code>1000</code> and serving size to{" "}
              <code>30</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required defaultValue={values?.name ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={values?.sku ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <input type="hidden" name="category" value={category} />
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drink">Drink</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Base unit</Label>
                <input type="hidden" name="baseUnit" value={baseUnit} />
                <Select
                  value={baseUnit}
                  onValueChange={(v) => setBaseUnit(v as BaseUnit)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="g">gram (g)</SelectItem>
                    <SelectItem value="ml">millilitre (ml)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="servingSize">Serving size</Label>
                <Input
                  id="servingSize"
                  name="servingSize"
                  type="number"
                  min={1}
                  defaultValue={values?.servingSize ?? 1}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceThb">Price (฿)</Label>
                <Input
                  id="priceThb"
                  name="priceThb"
                  type="number"
                  min={0}
                  defaultValue={values?.priceThb ?? 0}
                />
              </div>
            </div>

            {mode === "create" && (
              <div className="grid gap-2">
                <Label htmlFor="stockQty">Opening stock (in base unit)</Label>
                <Input
                  id="stockQty"
                  name="stockQty"
                  type="number"
                  min={0}
                  defaultValue={values?.stockQty ?? 0}
                />
                <p className="text-xs text-muted-foreground">
                  Logged as an &quot;opening&quot; stock movement.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={values?.description ?? ""}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={values?.isActive ?? true}
                className="h-4 w-4 rounded border"
              />
              Active (sellable)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
