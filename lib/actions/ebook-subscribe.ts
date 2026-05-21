"use server"

import { db } from "@/lib/db"
import { emailSubscribers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { render } from "@react-email/components"
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, unsubscribeUrl } from "@/lib/email/resend"
import { EbookWelcomeEmail } from "@/lib/email/templates/EbookWelcomeEmail"
import { getEbook, getEdition, LANG_LABEL, type EbookLang } from "@/lib/ebooks"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface SubscribeResult {
  ok: boolean
  /** Absolute or root-relative download URL when the chosen edition is available. */
  downloadUrl?: string
  /** True when we captured the email for a not-yet-released edition. */
  waitlisted?: boolean
  /** Whichever language label we welcomed them in. */
  langLabel?: string
  /** User-facing error message when ok=false. */
  error?: string
}

function siteOrigin(): string {
  // AUTH_URL is set in prod / .env.local for next-auth callbacks — reuse it
  // here so we can craft an absolute download URL in the welcome email.
  return process.env.AUTH_URL ?? "http://localhost:3000"
}

export async function requestEbookDownload(formData: FormData): Promise<SubscribeResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim() || null
  const slug = String(formData.get("slug") ?? "").trim()
  const lang = String(formData.get("lang") ?? "").trim() as EbookLang

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  const ebook = getEbook(slug)
  if (!ebook) return { ok: false, error: "Unknown ebook." }

  const edition = getEdition(ebook, lang)
  if (!edition) return { ok: false, error: "Unknown language." }

  const langLabel = LANG_LABEL[lang]
  const source = edition.available
    ? `ebook:${slug}:${lang}`
    : `waitlist:${slug}:${lang}`

  // Upsert: if subscriber exists, just update source so we know what they
  // wanted most recently; don't change status or token.
  const [existing] = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.email, email))
    .limit(1)

  let subscriber
  if (existing) {
    const [updated] = await db
      .update(emailSubscribers)
      .set({
        source,
        name: existing.name ?? name,
        // Re-activate if they had unsubscribed and then came back via the form.
        status: existing.status === "unsubscribed" ? "active" : existing.status,
        unsubscribedAt:
          existing.status === "unsubscribed" ? null : existing.unsubscribedAt,
      })
      .where(eq(emailSubscribers.id, existing.id))
      .returning()
    subscriber = updated
  } else {
    const [created] = await db
      .insert(emailSubscribers)
      .values({ email, name, source, status: "active" })
      .returning()
    subscriber = created
  }

  // Send welcome email (best-effort — don't fail the form if Resend hiccups).
  if (edition.available && edition.file) {
    const downloadUrl = siteOrigin() + edition.file
    try {
      const resend = getResend()
      const html = await render(
        EbookWelcomeEmail({
          firstName: subscriber.name?.split(" ")[0] ?? null,
          ebookTitle: ebook.title,
          langLabel,
          downloadUrl,
          unsubscribeUrl: unsubscribeUrl(subscriber.unsubscribeToken),
        }),
      )
      await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to: email,
        subject: `${ebook.title} — your copy (${langLabel})`,
        html,
      })
    } catch (err) {
      // Log but don't surface — user still gets instant download.
      console.error("[ebook-subscribe] welcome email failed:", err)
    }
    return { ok: true, downloadUrl: edition.file, langLabel }
  }

  return { ok: true, waitlisted: true, langLabel }
}
