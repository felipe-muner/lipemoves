export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { formatISO } from "date-fns"
import { render } from "@react-email/components"
import { db } from "@/lib/db"
import { emailSubscribers, emailSends } from "@/lib/db/schema"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, unsubscribeUrl } from "@/lib/email/resend"
import { SequenceEmail } from "@/lib/email/templates/SequenceEmail"

const broadcastSchema = z.object({
  subject: z.string().min(1).max(255),
  preheader: z.string().max(255).optional(),
  bodyMarkdown: z.string().min(1),
})

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${expected}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = broadcastSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { subject, preheader, bodyMarkdown } = parsed.data

  const subscribers = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.status, "active"))

  let sent = 0
  let failed = 0

  for (const subscriber of subscribers) {
    const html = await render(
      SequenceEmail({
        preheader,
        bodyMarkdown,
        unsubscribeUrl: unsubscribeUrl(subscriber.unsubscribeToken),
      }),
    )

    const [record] = await db
      .insert(emailSends)
      .values({ subscriberId: subscriber.id, subject, status: "queued" })
      .returning({ id: emailSends.id })

    const result = await getResend().emails.send({
      from: EMAIL_FROM,
      to: subscriber.email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(subscriber.unsubscribeToken)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    })

    if (result.error) {
      await db
        .update(emailSends)
        .set({ status: "failed", errorMessage: result.error.message })
        .where(eq(emailSends.id, record.id))
      failed += 1
      continue
    }

    await db
      .update(emailSends)
      .set({
        status: "sent",
        resendId: result.data?.id ?? null,
        sentAt: formatISO(new Date()),
      })
      .where(eq(emailSends.id, record.id))
    sent += 1
  }

  return NextResponse.json({ total: subscribers.length, sent, failed })
}
