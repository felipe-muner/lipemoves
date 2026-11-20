export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { HIPS_COOKIE, hipsCookieOptions, tokenForCode } from "@/lib/hips-access"

// One-tap link Felipe sends on WhatsApp after a payment arrives:
//   https://lipemoves.com/hips/unlock?code=THE-CODE
// A valid code sets the access cookie and lands the buyer on the program.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = tokenForCode(url.searchParams.get("code"))

  if (!token) {
    return NextResponse.redirect(new URL("/hips/program?error=1", url))
  }

  const res = NextResponse.redirect(new URL("/hips/program", url))
  res.cookies.set(HIPS_COOKIE, token, hipsCookieOptions)
  return res
}
