import { format, parseISO } from "date-fns"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailSubscribers } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { PageHeader } from "@/components/crm/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function SubscribersPage() {
  await requireDashboardSession()

  const rows = await db
    .select()
    .from(emailSubscribers)
    .orderBy(desc(emailSubscribers.subscribedAt))

  const active = rows.filter((r) => r.status === "active").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscribers"
        subtitle={`${rows.length} total · ${active} active — captured from /ebook landing pages.`}
      />

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No subscribers yet. Share{" "}
              <code>https://lipemoves.vercel.app/ebook/move-better</code> to
              start capturing emails.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.email}
                    </TableCell>
                    <TableCell className="text-sm">{r.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.source ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "active"
                            ? "default"
                            : r.status === "unsubscribed"
                            ? "outline"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(parseISO(r.subscribedAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
