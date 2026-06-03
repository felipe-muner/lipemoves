"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { formatISO } from "date-fns"
import { db } from "@/lib/db"
import { users, subscriptions } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden")
  }
}

/**
 * Manually add an offline member (e.g. a 1×1 coaching client who paid via
 * WhatsApp). Creates the user if needed, then a manual subscription row so the
 * member shows up in Members and Finance. When they later log in with the same
 * email (Google), the auth adapter links to this user.
 */
export async function addManualMember(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const plan = String(formData.get("plan") ?? "one_to_one")
  const billingInterval = String(formData.get("billingInterval") ?? "month")
  const amount = Number(formData.get("amount") ?? 0)
  const currency = String(formData.get("currency") ?? "usd").toLowerCase()
  const startsOn = String(formData.get("startsOn") ?? "").trim()
  const endsOn = String(formData.get("endsOn") ?? "").trim()

  if (!email) throw new Error("Email is required")
  if (!amount || amount <= 0) throw new Error("A positive amount is required")

  // Find or create the user by email.
  let [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    ;[user] = await db
      .insert(users)
      .values({ email, name: name || null })
      .returning({ id: users.id })
  } else if (name) {
    await db.update(users).set({ name }).where(eq(users.id, user.id))
  }

  const now = formatISO(new Date())
  await db.insert(subscriptions).values({
    userId: user.id,
    source: "manual",
    plan,
    amountCents: Math.round(amount * 100),
    currency,
    billingInterval,
    status: "active",
    currentPeriodStart: startsOn ? formatISO(new Date(startsOn)) : now,
    currentPeriodEnd: endsOn ? formatISO(new Date(endsOn)) : null,
  })

  revalidatePath("/dashboard/members")
  revalidatePath("/dashboard/finance")
}

/** End a manual membership (sets it canceled). */
export async function cancelMembership(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: formatISO(new Date()) })
    .where(eq(subscriptions.id, id))
  revalidatePath("/dashboard/members")
  revalidatePath("/dashboard/finance")
}
