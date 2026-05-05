export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { formatISO } from "date-fns"
import { db } from "@/lib/db"
import { emailSubscribers } from "@/lib/db/schema"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const [subscriber] = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.unsubscribeToken, token))
    .limit(1)

  if (!subscriber) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 })
  }

  if (subscriber.status !== "unsubscribed") {
    await db
      .update(emailSubscribers)
      .set({ status: "unsubscribed", unsubscribedAt: formatISO(new Date()) })
      .where(eq(emailSubscribers.id, subscriber.id))
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:sans-serif;padding:48px;text-align:center;"><h1>Inscrição cancelada</h1><p>Você não receberá mais emails do Lipe Moves.</p></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  )
}
