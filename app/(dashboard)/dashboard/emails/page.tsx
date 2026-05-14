import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { yogaClasses, emailCampaigns, users } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { format } from "date-fns"
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
import { EmailComposer } from "@/components/crm/email-composer"

export const dynamic = "force-dynamic"

export default async function EmailsPage() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const classRows = await db
    .select({
      id: yogaClasses.id,
      name: yogaClasses.name,
      scheduledAt: yogaClasses.scheduledAt,
    })
    .from(yogaClasses)
    .orderBy(desc(yogaClasses.scheduledAt))
    .limit(50)

  const classes = classRows.map((c) => ({
    id: c.id,
    label: `${c.name} · ${format(new Date(c.scheduledAt), "MMM dd, HH:mm")}`,
  }))

  const history = await db
    .select({
      id: emailCampaigns.id,
      subject: emailCampaigns.subject,
      template: emailCampaigns.template,
      audienceSummary: emailCampaigns.audienceSummary,
      recipientCount: emailCampaigns.recipientCount,
      sentCount: emailCampaigns.sentCount,
      failedCount: emailCampaigns.failedCount,
      status: emailCampaigns.status,
      sentAt: emailCampaigns.sentAt,
      createdAt: emailCampaigns.createdAt,
      createdByName: users.name,
    })
    .from(emailCampaigns)
    .leftJoin(users, eq(users.id, emailCampaigns.createdByUserId))
    .orderBy(desc(emailCampaigns.createdAt))
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Compose a message, pick an audience, and send.
        </p>
      </div>

      <EmailComposer classes={classes} />

      <Card>
        <CardHeader>
          <CardTitle>Recent campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No campaigns yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {c.sentAt
                        ? format(new Date(c.sentAt), "MMM dd, HH:mm")
                        : format(new Date(c.createdAt), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/emails/${c.id}`}
                        className="hover:underline"
                      >
                        {c.subject}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.audienceSummary}
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {c.sentCount}/{c.recipientCount}
                      {c.failedCount > 0 && (
                        <span className="ml-1 text-red-600">
                          · {c.failedCount} failed
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === "sent" ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600"
                        >
                          Sent
                        </Badge>
                      ) : c.status === "failed" ? (
                        <Badge
                          variant="secondary"
                          className="bg-red-500/10 text-red-600"
                        >
                          Failed
                        </Badge>
                      ) : c.status === "sending" ? (
                        <Badge variant="secondary">Sending…</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.createdByName ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
