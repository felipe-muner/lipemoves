export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailSubscribers } from "@/lib/db/schema"

const subscribeSchema = z.object({
  email: z.email(),
  name: z.string().trim().max(255).optional(),
  source: z.string().max(100).optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = subscribeSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { email, name, source } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.email, normalizedEmail))
    .limit(1)

  if (existing) {
    if (existing.status !== "active") {
      await db
        .update(emailSubscribers)
        .set({ status: "active", unsubscribedAt: null })
        .where(eq(emailSubscribers.id, existing.id))
    }
  } else {
    await db.insert(emailSubscribers).values({
      email: normalizedEmail,
      name: name ?? null,
      source: source ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
