import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { digitalProducts } from "@/lib/db/schema"
import Header from "@/components/Header"
import BuyGuideButton from "@/components/BuyGuideButton"

interface PageProps {
  params: Promise<{ slug: string }>
}

function formatPrice(cents: number, currency: string) {
  const value = cents / 100
  const locale = currency.toLowerCase() === "brl" ? "pt-BR" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value)
}

export default async function GuiaPage({ params }: PageProps) {
  const { slug } = await params

  const [product] = await db
    .select()
    .from(digitalProducts)
    .where(eq(digitalProducts.slug, slug))
    .limit(1)

  if (!product || !product.isActive) {
    notFound()
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl">{product.name}</h1>
          {product.description ? (
            <p className="mt-6 whitespace-pre-line text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          ) : null}

          <div className="mt-10 rounded-xl border border-border bg-card p-8">
            <p className="text-4xl font-bold">
              {formatPrice(product.priceCents, product.currency)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Pagamento único. Download imediato após a compra.
            </p>
            <div className="mt-6">
              <BuyGuideButton slug={product.slug} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
