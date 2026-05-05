import { Resend } from "resend"

let client: Resend | null = null

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      throw new Error("RESEND_API_KEY is not set")
    }
    client = new Resend(key)
  }
  return client
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Lipe <lipe@lipemoves.com>"
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO ?? "lipe@lipemoves.com"

export function unsubscribeUrl(token: string) {
  const base = process.env.AUTH_URL ?? "http://localhost:3000"
  return `${base}/api/unsubscribe?token=${token}`
}
