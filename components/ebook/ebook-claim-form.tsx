"use client"

import * as React from "react"
import { Download, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LANG_FLAG,
  LANG_LABEL,
  type Ebook,
  type EbookLang,
} from "@/lib/ebooks"
import {
  requestEbookDownload,
  type SubscribeResult,
} from "@/lib/actions/ebook-subscribe"
import { cn } from "@/lib/utils"

export function EbookClaimForm({ ebook }: { ebook: Ebook }) {
  const defaultLang =
    (ebook.editions.find((e) => e.available)?.lang as EbookLang | undefined) ??
    ebook.editions[0].lang

  const [lang, setLang] = React.useState<EbookLang>(defaultLang)
  const [pending, startTransition] = React.useTransition()
  const [result, setResult] = React.useState<SubscribeResult | null>(null)

  const selectedEdition = ebook.editions.find((e) => e.lang === lang)!

  function onSubmit(formData: FormData) {
    formData.set("slug", ebook.slug)
    formData.set("lang", lang)
    startTransition(async () => {
      const res = await requestEbookDownload(formData)
      setResult(res)
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong")
      }
    })
  }

  if (result?.ok && result.downloadUrl) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <div>
          <h3 className="text-lg font-semibold">It&apos;s yours.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your inbox — we sent the {result.langLabel} edition there too.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <a href={result.downloadUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download {ebook.title}
          </a>
        </Button>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-muted-foreground underline"
        >
          Pick a different language
        </button>
      </div>
    )
  }

  if (result?.ok && result.waitlisted) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="text-lg font-semibold">You&apos;re on the list.</h3>
        <p className="text-sm text-muted-foreground">
          The {result.langLabel} edition isn&apos;t out yet — we&apos;ll email
          you the moment it is.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-muted-foreground underline"
        >
          Pick a different language
        </button>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded-xl border bg-card p-6">
      <div>
        <Label className="text-sm">Choose your language</Label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {ebook.editions.map((ed) => {
            const active = ed.lang === lang
            return (
              <button
                key={ed.lang}
                type="button"
                onClick={() => setLang(ed.lang)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:bg-accent",
                  !ed.available && "opacity-70",
                )}
                aria-label={LANG_LABEL[ed.lang]}
              >
                <span className="text-2xl leading-none">
                  {LANG_FLAG[ed.lang]}
                </span>
                <span className="font-medium">{LANG_LABEL[ed.lang]}</span>
                {!ed.available && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="name" className="text-sm">
          Your name <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="name" name="name" placeholder="Felipe" autoComplete="given-name" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
        />
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : selectedEdition.available ? (
          <>
            <Download className="mr-2 h-4 w-4" />
            Get the {LANG_LABEL[lang]} edition
          </>
        ) : (
          <>Notify me when {LANG_LABEL[lang]} is ready</>
        )}
      </Button>

      <p className="text-center text-[11px] leading-tight text-muted-foreground">
        I&apos;ll send weekly notes on movement, breathing, and eating.
        Unsubscribe anytime in one click.
      </p>
    </form>
  )
}
