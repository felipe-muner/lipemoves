/**
 * Lightweight, dependency-free HTML wrapper for one-shot campaigns.
 * For richer layouts we can swap to React Email later.
 */

export type CampaignTemplate =
  | "announcement"
  | "class_reminder"
  | "membership_expiring"
  | "custom"

export interface RenderVars {
  recipientName?: string | null
  recipientEmail?: string
  /** Free-form key/value pairs to interpolate into the body. */
  [key: string]: string | null | undefined
}

const ACCENT = "#0a0a0a"

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Replace {{key}} placeholders. Missing keys are left blank. */
export function interpolate(body: string, vars: RenderVars): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => {
    const v = vars[k]
    return v == null ? "" : String(v)
  })
}

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n\s*\n/) // blank-line paragraph splits
    .map((p) =>
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#111">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("")
}

export function renderCampaign({
  template,
  subject,
  bodyText,
  vars,
}: {
  template: CampaignTemplate
  subject: string
  bodyText: string
  vars: RenderVars
}): { html: string; text: string; subject: string } {
  const interpolatedBody = interpolate(bodyText, vars)
  const interpolatedSubject = interpolate(subject, vars)

  const greeting = vars.recipientName
    ? `Hi ${escapeHtml(vars.recipientName.split(" ")[0])},`
    : "Hello,"

  // Different templates can add little flourishes if desired.
  let footerNote = ""
  if (template === "class_reminder") {
    footerNote = `<p style="margin:24px 0 0;font-size:13px;color:#737373">See you on the mat 🙏</p>`
  } else if (template === "membership_expiring") {
    footerNote = `<p style="margin:24px 0 0;font-size:13px;color:#737373">Reply to this email to renew or extend your membership.</p>`
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(interpolatedSubject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #ececec;border-radius:14px;padding:32px;">
            <tr>
              <td>
                <div style="font-size:12px;letter-spacing:6px;text-transform:uppercase;color:${ACCENT};font-weight:600;margin-bottom:18px;">
                  Yoga Center
                </div>
                <h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;color:${ACCENT};">
                  ${escapeHtml(interpolatedSubject)}
                </h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#111;">
                  ${escapeHtml(greeting)}
                </p>
                ${paragraphsToHtml(interpolatedBody)}
                ${footerNote}
              </td>
            </tr>
          </table>
          <p style="max-width:560px;font-size:11px;color:#999;margin-top:18px;line-height:1.5;">
            You're receiving this because you're part of the Yoga Center community.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  // Plain-text fallback — many clients prefer this when available
  const text = `${greeting}\n\n${interpolatedBody}\n\n— Yoga Center`

  return { html, text, subject: interpolatedSubject }
}
