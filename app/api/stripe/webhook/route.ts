export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import {
  subscriptions,
  payments,
  users,
  emailSubscribers,
  digitalProducts,
  digitalPurchases,
} from "@/lib/db/schema"
import { planFromPriceId, PLAN_LABEL } from "@/lib/stripe/plans"
import { WelcomeEmail } from "@/lib/email/templates/WelcomeEmail"
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
    subject: `Your ${product.name} is here`,
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

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscriptionId,
        { expand: ["latest_invoice"] },
      )
      const item = stripeSubscription.items.data[0]

      const subscriptionValues = {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: item?.price.id ?? null,
        status: "active" as const,
        currentPeriodStart: item?.current_period_start
          ? formatISO(new Date(item.current_period_start * 1000))
          : null,
        currentPeriodEnd: item?.current_period_end
          ? formatISO(new Date(item.current_period_end * 1000))
          : null,
      }

      const [existingForUser] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      let subscriptionRowId: string
      if (existingForUser) {
        await db
          .update(subscriptions)
          .set({ ...subscriptionValues, updatedAt: formatISO(new Date()) })
          .where(eq(subscriptions.id, existingForUser.id))
        subscriptionRowId = existingForUser.id
      } else {
        const [inserted] = await db
          .insert(subscriptions)
          .values({ userId, ...subscriptionValues })
          .returning({ id: subscriptions.id })
        subscriptionRowId = inserted.id
      }

      const plan = planFromPriceId(item?.price.id)

      // Record the first payment. invoice.payment_succeeded usually arrives
      // before this event, so upsert to enrich that row with plan + links.
      const latestInvoice =
        typeof stripeSubscription.latest_invoice === "object"
          ? stripeSubscription.latest_invoice
          : null
      if (latestInvoice?.id && latestInvoice.status === "paid") {
        await db
          .insert(payments)
          .values({
            userId,
            subscriptionId: subscriptionRowId,
            source: "stripe",
            stripeInvoiceId: latestInvoice.id,
            amountCents: latestInvoice.amount_paid,
            currency: latestInvoice.currency,
            plan,
            paidAt: formatISO(
              new Date(
                (latestInvoice.status_transitions?.paid_at ??
                  latestInvoice.created) * 1000,
              ),
            ),
          })
          .onConflictDoUpdate({
            target: payments.stripeInvoiceId,
            set: { userId, subscriptionId: subscriptionRowId, plan },
          })
      }

      // Welcome email — never fail the webhook over it.
      try {
        const [member] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
        if (member) {
          const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
          const [subscriber] = await db
            .select({ token: emailSubscribers.unsubscribeToken })
            .from(emailSubscribers)
            .where(eq(emailSubscribers.email, member.email))
            .limit(1)
          const html = await render(
            WelcomeEmail({
              name: member.name,
              planLabel:
                plan === "unknown" ? "LipeMoves" : PLAN_LABEL[plan],
              libraryUrl: `${baseUrl}/videos`,
              accountUrl: `${baseUrl}/account`,
              unsubscribeUrl: subscriber
                ? `${baseUrl}/api/unsubscribe?token=${subscriber.token}`
                : `${baseUrl}/account`,
            }),
          )
          await getResend().emails.send({
            from: EMAIL_FROM,
            to: member.email,
            replyTo: EMAIL_REPLY_TO,
            subject: "Welcome to LipeMoves — your membership is active",
            html,
          })
        }
      } catch (error) {
        console.error("welcome email error:", error)
      }
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id

      if (!invoice.id || !customerId) break

      // Resolve the member: subscription row first, then user by email
      // (the first invoice can arrive before checkout.session.completed).
      const [subRow] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, customerId))
        .limit(1)

      let payingUserId = subRow?.userId ?? null
      if (!payingUserId && invoice.customer_email) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, invoice.customer_email.toLowerCase()))
          .limit(1)
        payingUserId = u?.id ?? null
      }
      if (!payingUserId) break

      await db
        .insert(payments)
        .values({
          userId: payingUserId,
          subscriptionId: subRow?.id ?? null,
          source: "stripe",
          stripeInvoiceId: invoice.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          plan: planFromPriceId(subRow?.stripePriceId),
          paidAt: formatISO(
            new Date(
              (invoice.status_transitions?.paid_at ?? invoice.created) * 1000,
            ),
          ),
        })
        .onConflictDoNothing({ target: payments.stripeInvoiceId })
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
