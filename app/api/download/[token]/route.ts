export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { eq } from "drizzle-orm"
import { isAfter, parseISO } from "date-fns"
import { db } from "@/lib/db"
import { digitalPurchases, digitalProducts } from "@/lib/db/schema"

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const [purchase] = await db
    .select()
    .from(digitalPurchases)
    .where(eq(digitalPurchases.downloadToken, token))
    .limit(1)

  if (!purchase) {
    return NextResponse.json({ error: "Invalid download link" }, { status: 404 })
  }

  if (isAfter(new Date(), parseISO(purchase.expiresAt))) {
    return NextResponse.json({ error: "Download link expired" }, { status: 410 })
  }

  if (purchase.downloadCount >= purchase.maxDownloads) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 429 },
    )
  }

  const [product] = await db
    .select()
    .from(digitalProducts)
    .where(eq(digitalProducts.id, purchase.productId))
    .limit(1)

  if (!product) {
    return NextResponse.json({ error: "Product not available" }, { status: 404 })
  }

  const absolutePath = path.join(process.cwd(), "private", product.filePath)

  let fileBuffer: Buffer
  try {
    fileBuffer = await readFile(absolutePath)
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  await db
    .update(digitalPurchases)
    .set({ downloadCount: purchase.downloadCount + 1 })
    .where(eq(digitalPurchases.id, purchase.id))

  const downloadFilename = `${product.slug}.pdf`

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${downloadFilename}"`,
      "content-length": String(fileBuffer.byteLength),
      "cache-control": "private, no-store",
    },
  })
}
