export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { digitalProducts } from "@/lib/db/schema"

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  email: z.email().optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { slug, email } = parsed.data

  const [product] = await db
    .select()
    .from(digitalProducts)
    .where(eq(digitalProducts.slug, slug))
    .limit(1)

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    customer_email: email,
    success_url: `${baseUrl}/guias/${slug}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/guias/${slug}?checkout=canceled`,
    metadata: {
      productType: "pdf",
      productId: product.id,
      productSlug: product.slug,
    },
    payment_intent_data: {
      metadata: {
        productType: "pdf",
        productId: product.id,
        productSlug: product.slug,
      },
    },
  })

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
