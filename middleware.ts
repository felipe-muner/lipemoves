import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^\/ebooks\/(move-better)-([a-z]{2})\.pdf$/)
  if (!m) return NextResponse.next()
  const [, slug, lang] = m
  const res = NextResponse.next()
  res.headers.set(
    "content-disposition",
    `attachment; filename="felipe-muner-${slug}-${lang}.pdf"`,
  )
  return res
}

export const config = {
  matcher: "/ebooks/move-better-:lang.pdf",
}
