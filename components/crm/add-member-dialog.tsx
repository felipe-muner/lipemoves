"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { addManualMember } from "@/lib/actions/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntitySelectField } from "@/components/crm/entity-select-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AddMemberDialog() {
  const [open, setOpen] = React.useState(false)

  async function action(formData: FormData) {
    await addManualMember(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add member manually</DialogTitle>
          <DialogDescription>
            For offline members — e.g. a 1×1 coaching client who paid via
            WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <Input name="name" placeholder="Name" />
          <Input name="email" type="email" placeholder="Email" required />
          <EntitySelectField
            name="plan"
            defaultValue="one_to_one"
            searchPlaceholder="Search plan..."
            items={[
              { id: "one_to_one", label: "1×1 Coaching" },
              { id: "monthly", label: "Monthly" },
              { id: "annual", label: "Annual" },
            ]}
          />
          <Input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (e.g. 200)"
            required
          />
          <EntitySelectField
            name="currency"
            defaultValue="usd"
            searchPlaceholder="Search currency..."
            items={[
              { id: "usd", label: "USD" },
              { id: "eur", label: "EUR" },
              { id: "brl", label: "BRL" },
              { id: "thb", label: "THB" },
            ]}
          />
          <EntitySelectField
            name="billingInterval"
            defaultValue="month"
            searchPlaceholder="Search cadence..."
            items={[
              { id: "month", label: "Recurring monthly" },
              { id: "year", label: "Recurring yearly" },
              { id: "one_time", label: "One-time" },
            ]}
          />
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Starts
            <Input name="startsOn" type="date" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Ends (optional)
            <Input name="endsOn" type="date" />
          </label>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto">
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
