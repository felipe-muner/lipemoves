"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  requestEbookDownload,
  type SubscribeResult,
} from "@/lib/actions/ebook-subscribe"

// Brand pill style shared with NewsletterForm (dark /start theme).
const pillInput =
  "h-12 rounded-full border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 focus-visible:border-[#39FF14] focus-visible:ring-[#39FF14]/30 dark:bg-white/5"

/**
 * Free-guide capture for /start. Delivers the Move Better (English) ebook via
 * the shared `requestEbookDownload` action — upserts the subscriber AND sends
 * the welcome email through Resend.
 */
export function FreeGuideForm() {
  const [pending, startTransition] = React.useTransition()
  const [result, setResult] = React.useState<SubscribeResult | null>(null)

  function onSubmit(formData: FormData) {
    formData.set("slug", "move-better")
    formData.set("lang", "en")
    startTransition(async () => {
      const res = await requestEbookDownload(formData)
      setResult(res)
      if (!res.ok) toast.error(res.error ?? "Something went wrong")
    })
  }

  if (result?.ok && result.downloadUrl) {
    return (
      <div className="rounded-2xl border border-[#39FF14]/40 bg-[#39FF14]/5 p-6 text-center">
        <p className="text-lg font-semibold text-white">
          It&apos;s yours. Check your inbox.
        </p>
        <p className="mt-2 text-sm text-white/60">
          We emailed you the guide too — grab it now below.
        </p>
        <Button asChild variant="lime" size="pill" className="mt-5 w-full">
          <a href={result.downloadUrl} download>
            <Download className="h-4 w-4" /> Download the guide
          </a>
        </Button>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="name"
          type="text"
          placeholder="Your name (optional)"
          autoComplete="given-name"
          className={`${pillInput} flex-1`}
        />
        <Input
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
          className={`${pillInput} flex-1`}
        />
        <Button type="submit" variant="lime" size="pill" disabled={pending}>
          {pending ? "Sending…" : "Get the guide"}
        </Button>
      </div>
      <p className="text-xs text-white/35">No spam. Unsubscribe anytime.</p>
    </form>
  )
}
