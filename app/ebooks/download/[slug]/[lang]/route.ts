import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { NextResponse } from "next/server"
import { EBOOKS } from "@/lib/ebooks"

export const dynamic = "force-static"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; lang: string }> },
) {
  const { slug, lang } = await params
  const book = EBOOKS.find((b) => b.slug === slug)
  const edition = book?.editions.find((e) => e.lang === lang && e.available)
  if (!book || !edition || !edition.file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const filePath = join(process.cwd(), "public", edition.file.replace(/^\//, ""))
  const buffer = await readFile(filePath)
  const filename = `felipe-muner-${slug}-${lang}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=3600",
    },
  })
}
