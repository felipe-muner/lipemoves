import { requireDashboardSession } from "@/lib/auth/dashboard"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { emailCampaigns, emailCampaignSends } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") notFound()

  const { id } = await params
  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, id))
    .limit(1)
  if (!campaign) notFound()

  const sends = await db
    .select()
    .from(emailCampaignSends)
    .where(eq(emailCampaignSends.campaignId, id))
    .orderBy(emailCampaignSends.recipientEmail)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/emails"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to emails
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {campaign.subject}
        </h1>
        <p className="text-sm text-muted-foreground">
          {campaign.sentAt
            ? format(new Date(campaign.sentAt), "MMM dd, yyyy HH:mm")
            : "Not sent yet"}{" "}
          · {campaign.audienceSummary}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{campaign.recipientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {campaign.sentCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {campaign.failedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
          <CardDescription>What was sent (before per-recipient placeholders)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {campaign.bodyText}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent at</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.recipientEmail}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.recipientName ?? "—"}
                  </TableCell>
                  <TableCell>
                    {s.status === "sent" ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600"
                      >
                        Sent
                      </Badge>
                    ) : s.status === "failed" ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-600"
                      >
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="outline">Queued</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.sentAt
                      ? format(new Date(s.sentAt), "MMM dd, HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-red-600">
                    {s.errorMessage ?? ""}
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
