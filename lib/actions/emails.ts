"use server"

import { db } from "@/lib/db"
import { emailCampaigns, emailCampaignSends } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { resolveAudience, type AudienceFilter } from "@/lib/email/audience"
import {
  renderCampaign,
  type CampaignTemplate,
} from "@/lib/email/templates/campaign"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend"

async function requireAdminish() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission to send emails")
  }
  return session
}

export interface SendCampaignInput {
  template: CampaignTemplate
  subject: string
  bodyText: string
  audience: AudienceFilter
}

export interface SendCampaignResult {
  campaignId: string
  recipientCount: number
  sent: number
  failed: number
}

export async function previewAudience(audience: AudienceFilter) {
  await requireAdminish()
  const resolved = await resolveAudience(audience)
  return {
    count: resolved.recipients.length,
    summary: resolved.summary,
    sample: resolved.recipients.slice(0, 5).map((r) => r.email),
  }
}

/** Most recent campaign with the same subject (for "last sent" warning). */
export async function recentSimilarCampaign(subject: string) {
  await requireAdminish()
  const [row] = await db
    .select({
      id: emailCampaigns.id,
      sentAt: emailCampaigns.sentAt,
      recipientCount: emailCampaigns.recipientCount,
      audienceSummary: emailCampaigns.audienceSummary,
    })
    .from(emailCampaigns)
    .where(eq(emailCampaigns.subject, subject))
    .orderBy(desc(emailCampaigns.sentAt))
    .limit(1)
  return row ?? null
}

export async function sendCampaign(
  input: SendCampaignInput,
): Promise<SendCampaignResult> {
  const session = await requireAdminish()
  const { template, subject, bodyText, audience } = input
  if (!subject.trim()) throw new Error("Subject is required")
  if (!bodyText.trim()) throw new Error("Body is required")

  const resolved = await resolveAudience(audience)
  if (resolved.recipients.length === 0) {
    throw new Error("No recipients match the selected audience")
  }

  // Insert campaign in "sending" state
  const [campaign] = await db
    .insert(emailCampaigns)
    .values({
      createdByUserId: session.userId,
      template,
      subject,
      bodyText,
      audience: audience as object,
      audienceSummary: resolved.summary,
      recipientCount: resolved.recipients.length,
      status: "sending",
    })
    .returning()

  // Insert one queued row per recipient
  await db
    .insert(emailCampaignSends)
    .values(
      resolved.recipients.map((r) => ({
        campaignId: campaign.id,
        recipientEmail: r.email,
        recipientName: r.name,
      })),
    )

  // Dispatch (best-effort sequential — Resend has rate limits)
  const resend = getResend()
  let sent = 0
  let failed = 0

  for (const recipient of resolved.recipients) {
    try {
      const rendered = renderCampaign({
        template,
        subject,
        bodyText,
        vars: {
          recipientName: recipient.name,
          recipientEmail: recipient.email,
        },
      })
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        replyTo: EMAIL_REPLY_TO,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })

      if (result.error) {
        failed += 1
        await db
          .update(emailCampaignSends)
          .set({
            status: "failed",
            errorMessage: result.error.message ?? "unknown error",
          })
          .where(
            and(
              eq(emailCampaignSends.campaignId, campaign.id),
              eq(emailCampaignSends.recipientEmail, recipient.email),
            ),
          )
      } else {
        sent += 1
        await db
          .update(emailCampaignSends)
          .set({
            status: "sent",
            resendId: result.data?.id ?? null,
            sentAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(emailCampaignSends.campaignId, campaign.id),
              eq(emailCampaignSends.recipientEmail, recipient.email),
            ),
          )
      }
    } catch (err) {
      failed += 1
      await db
        .update(emailCampaignSends)
        .set({
          status: "failed",
          errorMessage: (err as Error).message ?? "send threw",
        })
        .where(
          and(
            eq(emailCampaignSends.campaignId, campaign.id),
            eq(emailCampaignSends.recipientEmail, recipient.email),
          ),
        )
    }
  }

  await db
    .update(emailCampaigns)
    .set({
      status: failed === resolved.recipients.length ? "failed" : "sent",
      sentCount: sent,
      failedCount: failed,
      sentAt: new Date().toISOString(),
    })
    .where(eq(emailCampaigns.id, campaign.id))

  revalidatePath("/dashboard/emails")

  return {
    campaignId: campaign.id,
    recipientCount: resolved.recipients.length,
    sent,
    failed,
  }
}
