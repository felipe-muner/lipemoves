export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { formatISO } from "date-fns"
import { db } from "@/lib/db"
import {
  emailSubscribers,
  emailSequences,
  emailSequenceEnrollments,
} from "@/lib/db/schema"

const subscribeSchema = z.object({
  email: z.email(),
  name: z.string().trim().max(255).optional(),
  source: z.string().max(100).optional(),
  sequenceSlug: z.string().max(100).optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = subscribeSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { email, name, source, sequenceSlug } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.email, normalizedEmail))
    .limit(1)

  let subscriberId: string

  if (existing) {
    subscriberId = existing.id
    if (existing.status !== "active") {
      await db
        .update(emailSubscribers)
        .set({ status: "active", unsubscribedAt: null })
        .where(eq(emailSubscribers.id, existing.id))
    }
  } else {
    const [inserted] = await db
      .insert(emailSubscribers)
      .values({
        email: normalizedEmail,
        name: name ?? null,
        source: source ?? null,
      })
      .returning({ id: emailSubscribers.id })
    subscriberId = inserted.id
  }

  const slug = sequenceSlug ?? "welcome"
  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.slug, slug))
    .limit(1)

  if (sequence && sequence.isActive) {
    const [already] = await db
      .select()
      .from(emailSequenceEnrollments)
      .where(eq(emailSequenceEnrollments.subscriberId, subscriberId))
      .limit(1)

    if (!already) {
      await db.insert(emailSequenceEnrollments).values({
        subscriberId,
        sequenceId: sequence.id,
        currentStep: 0,
        nextSendAt: formatISO(new Date()),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
