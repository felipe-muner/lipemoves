export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import {
  subscriptions,
  digitalProducts,
  digitalPurchases,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { addHours, formatISO } from "date-fns"
import { render } from "@react-email/components"
import type Stripe from "stripe"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend"
import { DeliveryEmail } from "@/lib/email/templates/DeliveryEmail"

const DOWNLOAD_TTL_HOURS = 48

async function handlePdfPurchase(session: Stripe.Checkout.Session) {
  const productId = session.metadata?.productId
  const email = session.customer_details?.email ?? session.customer_email
  if (!productId || !email) return

  const [existing] = await db
    .select()
    .from(digitalPurchases)
    .where(eq(digitalPurchases.stripeSessionId, session.id))
    .limit(1)
  if (existing) return

  const [product] = await db
    .select()
    .from(digitalProducts)
    .where(eq(digitalProducts.id, productId))
    .limit(1)
  if (!product) return

  const expiresAt = formatISO(addHours(new Date(), DOWNLOAD_TTL_HOURS))
  const name = session.customer_details?.name ?? null
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const [purchase] = await db
    .insert(digitalPurchases)
    .values({
      productId: product.id,
      email: email.toLowerCase().trim(),
      name,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      amountPaidCents: session.amount_total ?? product.priceCents,
      currency: session.currency ?? product.currency,
      expiresAt,
    })
    .returning()

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const downloadUrl = `${baseUrl}/api/download/${purchase.downloadToken}`

  const html = await render(
    DeliveryEmail({
      productName: product.name,
      downloadUrl,
      expiresInHours: DOWNLOAD_TTL_HOURS,
      unsubscribeUrl: `${baseUrl}/api/unsubscribe?token=${purchase.downloadToken}`,
    }),
  )

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    replyTo: EMAIL_REPLY_TO,
    subject: `Seu ${product.name} está aqui`,
    html,
  })

  await db
    .update(digitalPurchases)
    .set({ deliveredAt: formatISO(new Date()) })
    .where(eq(digitalPurchases.id, purchase.id))
}

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

      if (session.metadata?.productType === "pdf") {
        await handlePdfPurchase(session)
        break
      }

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
