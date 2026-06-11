"use server"

import { createHash, randomBytes } from "crypto"
import { addHours, isBefore } from "date-fns"
import { and, eq, like, lt } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { render } from "@react-email/components"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend"
import { PasswordResetEmail } from "@/lib/email/templates/PasswordResetEmail"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Reset tokens live in the next-auth verification_tokens table, namespaced so
// they can never collide with email-verification tokens. Only the sha256 hash
// of the token is stored — the raw value exists solely in the emailed link.
const RESET_PREFIX = "password-reset:"

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

function siteOrigin(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000"
}

export interface ForgotPasswordResult {
  ok: boolean
  error?: string
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  // Opportunistic cleanup of expired reset tokens.
  await db
    .delete(verificationTokens)
    .where(
      and(
        like(verificationTokens.identifier, `${RESET_PREFIX}%`),
        lt(verificationTokens.expires, new Date()),
      ),
    )

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  // Always report success so the form can't be used to probe which emails
  // have accounts. Google-only users get a link too — resetting simply sets
  // a password alongside their Google login.
  if (user) {
    const identifier = `${RESET_PREFIX}${email}`
    const rawToken = randomBytes(32).toString("base64url")

    // One active token per email: replace any previous request.
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier))
    await db.insert(verificationTokens).values({
      identifier,
      token: hashToken(rawToken),
      expires: addHours(new Date(), 1),
    })

    const resetUrl = `${siteOrigin()}/reset-password?token=${rawToken}`
    try {
      const resend = getResend()
      const html = await render(
        PasswordResetEmail({
          firstName: user.name?.split(" ")[0] ?? null,
          resetUrl,
        }),
      )
      // Resend reports failures in the response object, not by throwing.
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to: email,
        subject: "Reset your Lipe Moves password",
        html,
      })
      if (error) {
        console.error("[password-reset] email rejected:", error)
        return { ok: false, error: "Could not send the email. Try again in a minute." }
      }
    } catch (err) {
      console.error("[password-reset] email threw:", err)
      return { ok: false, error: "Could not send the email. Try again in a minute." }
    }
  }

  return { ok: true }
}

export interface ResetPasswordResult {
  ok: boolean
  error?: string
}

export async function resetPassword(
  formData: FormData,
): Promise<ResetPasswordResult> {
  const rawToken = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!rawToken) {
    return { ok: false, error: "This reset link is invalid. Request a new one." }
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." }
  }

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, hashToken(rawToken)))
    .limit(1)

  if (!row || !row.identifier.startsWith(RESET_PREFIX)) {
    return { ok: false, error: "This reset link is invalid. Request a new one." }
  }
  if (isBefore(row.expires, new Date())) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, row.identifier))
    return { ok: false, error: "This reset link has expired. Request a new one." }
  }

  const email = row.identifier.slice(RESET_PREFIX.length)
  const hashedPassword = await bcrypt.hash(password, 12)

  const updated = await db
    .update(users)
    .set({ hashedPassword })
    .where(eq(users.email, email))
    .returning({ id: users.id })

  // Single-use: burn the token whether or not the user still exists.
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, row.identifier))

  if (updated.length === 0) {
    return { ok: false, error: "This reset link is invalid. Request a new one." }
  }

  return { ok: true }
}
