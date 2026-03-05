export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { formatISO } from "date-fns"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId || !session.subscription || !session.customer) break

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      const item = stripeSubscription.items.data[0]

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: item?.price.id ?? null,
        status: "active",
        currentPeriodStart: item?.current_period_start
          ? formatISO(new Date(item.current_period_start * 1000))
          : null,
        currentPeriodEnd: item?.current_period_end
          ? formatISO(new Date(item.current_period_end * 1000))
          : null,
      })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const subItem = subscription.items.data[0]

      const statusMap: Record<string, "active" | "canceled" | "past_due" | "trialing" | "incomplete"> = {
        active: "active",
        canceled: "canceled",
        past_due: "past_due",
        trialing: "trialing",
        incomplete: "incomplete",
        incomplete_expired: "incomplete",
        unpaid: "past_due",
        paused: "canceled",
      }

      await db
        .update(subscriptions)
        .set({
          status: statusMap[subscription.status] ?? "incomplete",
          stripePriceId: subItem?.price.id ?? null,
          currentPeriodStart: subItem?.current_period_start
            ? formatISO(new Date(subItem.current_period_start * 1000))
            : null,
          currentPeriodEnd: subItem?.current_period_end
            ? formatISO(new Date(subItem.current_period_end * 1000))
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: formatISO(new Date()),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription

      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          updatedAt: formatISO(new Date()),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      break
    }
  }

  return NextResponse.json({ received: true })
}
