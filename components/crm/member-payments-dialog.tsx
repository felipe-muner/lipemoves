"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface MemberPaymentRow {
  id: string
  /** ISO timestamp (UTC) — formatted client-side in the viewer's timezone. */
  paidAt: string
  planLabel: string
  source: string
  amountLabel: string
}

export function MemberPaymentsDialog({
  memberLabel,
  totalLabel,
  payments,
}: {
  memberLabel: string
  totalLabel: string
  payments: MemberPaymentRow[]
}) {
  if (payments.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm font-medium">
          {totalLabel}
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            {payments.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payments — {memberLabel}</DialogTitle>
          <DialogDescription>
            {payments.length} payment{payments.length === 1 ? "" : "s"} ·{" "}
            {totalLabel} total. Times shown in your timezone.
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paid on</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {format(parseISO(p.paidAt), "MMM d, yyyy · HH:mm")}
                </TableCell>
                <TableCell className="text-sm">{p.planLabel}</TableCell>
                <TableCell>
                  <Badge
                    variant={p.source === "manual" ? "secondary" : "outline"}
                    className="text-[10px]"
                  >
                    {p.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {p.amountLabel}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
