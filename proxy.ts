import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const protectedPaths = ["/videos", "/account"]
  const isProtected = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  )

  const authPaths = ["/login", "/register"]
  const isAuthPage = authPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/videos", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/videos/:path*", "/account/:path*", "/login", "/register"],
}
