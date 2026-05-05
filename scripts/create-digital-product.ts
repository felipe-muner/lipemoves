import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { digitalProducts } from "@/lib/db/schema"

interface Args {
  slug?: string
  name?: string
  description?: string
  priceCents?: number
  currency?: string
  stripePriceId?: string
  filePath?: string
}

function parseArgs(): Args {
  const out: Args = {}
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=")
    const value = rest.join("=")
    switch (key) {
      case "slug":
        out.slug = value
        break
      case "name":
        out.name = value
        break
      case "description":
        out.description = value
        break
      case "price":
        out.priceCents = Number.parseInt(value, 10)
        break
      case "currency":
        out.currency = value
        break
      case "stripe-price-id":
        out.stripePriceId = value
        break
      case "file":
        out.filePath = value
        break
    }
  }
  return out
}

async function main() {
  const args = parseArgs()

  const required: Array<keyof Args> = [
    "slug",
    "name",
    "priceCents",
    "stripePriceId",
    "filePath",
  ]
  const missing = required.filter((k) => args[k] === undefined || args[k] === "")
  if (missing.length > 0) {
    console.error(
      `Missing required args: ${missing.join(", ")}\n\n` +
        `Usage:\n` +
        `  pnpm tsx scripts/create-digital-product.ts \\\n` +
        `    --slug=guia-fundamentos \\\n` +
        `    --name="Guia de Fundamentos" \\\n` +
        `    --description="5 movimentos base..." \\\n` +
        `    --price=4700 \\\n` +
        `    --currency=brl \\\n` +
        `    --stripe-price-id=price_xxx \\\n` +
        `    --file=guides/guia-fundamentos.pdf`,
    )
    process.exit(1)
  }

  const [existing] = await db
    .select()
    .from(digitalProducts)
    .where(eq(digitalProducts.slug, args.slug!))
    .limit(1)

  if (existing) {
    await db
      .update(digitalProducts)
      .set({
        name: args.name!,
        description: args.description ?? null,
        priceCents: args.priceCents!,
        currency: args.currency ?? "brl",
        stripePriceId: args.stripePriceId!,
        filePath: args.filePath!,
        isActive: true,
      })
      .where(eq(digitalProducts.id, existing.id))
    console.log(`Updated product "${args.slug}" (id=${existing.id})`)
  } else {
    const [created] = await db
      .insert(digitalProducts)
      .values({
        slug: args.slug!,
        name: args.name!,
        description: args.description ?? null,
        priceCents: args.priceCents!,
        currency: args.currency ?? "brl",
        stripePriceId: args.stripePriceId!,
        filePath: args.filePath!,
      })
      .returning({ id: digitalProducts.id })
    console.log(`Created product "${args.slug}" (id=${created.id})`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
