import { createHash, timingSafeEqual } from "crypto"

// Access to the paid Open Hips program page (/hips/program).
//
// Buyers pay by direct transfer, so there is no checkout to hang access on.
// Instead Felipe sends each buyer (or each group) an access code after the
// payment arrives. Valid codes live in the HIPS_ACCESS_CODES env var,
// comma-separated. Remove a code from the list and it stops working.
//
// The cookie never holds the code itself, only a hash of it, so it can be
// checked on every request and revoked by removing the code.

export const HIPS_COOKIE = "hips_access"
export const HIPS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

function validCodes(): string[] {
  return (process.env.HIPS_ACCESS_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
}

function normalize(code: string): string {
  return code.trim().toLowerCase()
}

function tokenFor(code: string): string {
  return createHash("sha256")
    .update(`${normalize(code)}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex")
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Returns the cookie value for a code, or null if the code is not valid. */
export function tokenForCode(code: string | null | undefined): string | null {
  if (!code) return null
  const wanted = normalize(code)
  const match = validCodes().find((c) => same(normalize(c), wanted))
  return match ? tokenFor(match) : null
}

/** True if the cookie value belongs to a code that is still valid. */
export function hasHipsAccess(cookieValue: string | null | undefined): boolean {
  if (!cookieValue) return false
  return validCodes().some((c) => same(tokenFor(c), cookieValue))
}

export const hipsCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/hips",
  maxAge: HIPS_COOKIE_MAX_AGE,
}
