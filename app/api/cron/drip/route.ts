export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { and, asc, eq, isNull, lte } from "drizzle-orm"
import { addHours, formatISO } from "date-fns"
import { render } from "@react-email/components"
import { db } from "@/lib/db"
import {
  emailSequenceEnrollments,
  emailSequenceSteps,
  emailSubscribers,
  emailSends,
} from "@/lib/db/schema"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, unsubscribeUrl } from "@/lib/email/resend"
import { SequenceEmail } from "@/lib/email/templates/SequenceEmail"

const BATCH_SIZE = 50

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${expected}`
}

async function processDrip() {
  const now = formatISO(new Date())

  const due = await db
    .select({
      enrollmentId: emailSequenceEnrollments.id,
      subscriberId: emailSequenceEnrollments.subscriberId,
      sequenceId: emailSequenceEnrollments.sequenceId,
      currentStep: emailSequenceEnrollments.currentStep,
    })
    .from(emailSequenceEnrollments)
    .innerJoin(
      emailSubscribers,
      eq(emailSubscribers.id, emailSequenceEnrollments.subscriberId),
    )
    .where(
      and(
        isNull(emailSequenceEnrollments.completedAt),
        lte(emailSequenceEnrollments.nextSendAt, now),
        eq(emailSubscribers.status, "active"),
      ),
    )
    .orderBy(asc(emailSequenceEnrollments.nextSendAt))
    .limit(BATCH_SIZE)

  let sent = 0
  let completed = 0
  let failed = 0

  for (const row of due) {
    const steps = await db
      .select()
      .from(emailSequenceSteps)
      .where(eq(emailSequenceSteps.sequenceId, row.sequenceId))
      .orderBy(asc(emailSequenceSteps.stepOrder))

    const step = steps[row.currentStep]

    if (!step) {
      await db
        .update(emailSequenceEnrollments)
        .set({ completedAt: formatISO(new Date()) })
        .where(eq(emailSequenceEnrollments.id, row.enrollmentId))
      completed += 1
      continue
    }

    const [subscriber] = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.id, row.subscriberId))
      .limit(1)

    if (!subscriber) continue

    const html = await render(
      SequenceEmail({
        preheader: step.preheader ?? undefined,
        bodyMarkdown: step.bodyMarkdown,
        unsubscribeUrl: unsubscribeUrl(subscriber.unsubscribeToken),
      }),
    )

    const [sendRecord] = await db
      .insert(emailSends)
      .values({
        subscriberId: subscriber.id,
        sequenceStepId: step.id,
        subject: step.subject,
        status: "queued",
      })
      .returning({ id: emailSends.id })

    const result = await getResend().emails.send({
      from: EMAIL_FROM,
      to: subscriber.email,
      replyTo: EMAIL_REPLY_TO,
      subject: step.subject,
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
        .where(eq(emailSends.id, sendRecord.id))
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
      .where(eq(emailSends.id, sendRecord.id))

    const nextStepIndex = row.currentStep + 1
    const nextStep = steps[nextStepIndex]
    const completedAt = nextStep ? null : formatISO(new Date())
    const nextSendAt = nextStep
      ? formatISO(addHours(new Date(), nextStep.delayHours))
      : formatISO(new Date())

    await db
      .update(emailSequenceEnrollments)
      .set({ currentStep: nextStepIndex, nextSendAt, completedAt })
      .where(eq(emailSequenceEnrollments.id, row.enrollmentId))

    sent += 1
    if (completedAt) completed += 1
  }

  return { processed: due.length, sent, failed, completed }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await processDrip()
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await processDrip()
  return NextResponse.json(result)
}
