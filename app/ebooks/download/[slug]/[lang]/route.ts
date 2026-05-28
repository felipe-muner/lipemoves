import { NextResponse } from "next/server"
import { EBOOKS } from "@/lib/ebooks"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; lang: string }> },
) {
  const { slug, lang } = await params
  const book = EBOOKS.find((b) => b.slug === slug)
  const edition = book?.editions.find((e) => e.lang === lang && e.available)
  if (!book || !edition || !edition.file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const origin = new URL(req.url).origin
  const upstream = await fetch(`${origin}${edition.file}`)
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream missing" }, { status: 502 })
  }

  const filename = `felipe-muner-${slug}-${lang}.pdf`
  return new NextResponse(upstream.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=3600",
    },
  })
}
