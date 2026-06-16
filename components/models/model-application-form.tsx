"use client"

import * as React from "react"
import {
  Instagram,
  Send,
  MessageCircle,
  Music2,
  Youtube,
  Facebook,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/models/phone-input"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import { submitModelApplication } from "@/lib/actions/model-application"

const pillBase =
  "h-12 rounded-full bg-white/5 px-5 text-sm text-white placeholder:text-white/40 dark:bg-white/5"
const pillOk =
  "border-white/15 focus-visible:border-[#39FF14] focus-visible:ring-[#39FF14]/30"
const pillErr =
  "border-red-500/70 focus-visible:border-red-500 focus-visible:ring-red-500/30"
/** Rounded input style; pass `true` for the invalid (red) variant. */
const pill = (error?: boolean) => `${pillBase} ${error ? pillErr : pillOk}`

const block =
  "min-h-28 rounded-2xl border-white/15 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/40 focus-visible:border-[#39FF14] focus-visible:ring-[#39FF14]/30 dark:bg-white/5"

type SocialKey =
  | "whatsapp"
  | "instagram"
  | "telegram"
  | "tiktok"
  | "youtube"
  | "facebook"

const SOCIALS: {
  key: SocialKey
  label: string
  icon: LucideIcon
  placeholder: string
}[] = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "Number or wa.me link" },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "@yourhandle" },
  { key: "telegram", label: "Telegram", icon: Send, placeholder: "@yourusername" },
  { key: "tiktok", label: "TikTok", icon: Music2, placeholder: "@yourhandle" },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "Channel name or link" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "Profile name or link" },
]

const EMPTY: Record<SocialKey, string> = {
  whatsapp: "",
  instagram: "",
  telegram: "",
  tiktok: "",
  youtube: "",
  facebook: "",
}

type FieldKey = "name" | "phone" | "contact"

const ERROR_TEXT: Record<FieldKey, string> = {
  name: "Please add your name",
  phone: "Please add a valid phone number",
  contact: "Add an email or at least one social handle",
}

export function ModelApplicationForm() {
  const [pending, startTransition] = React.useTransition()
  const [done, setDone] = React.useState(false)

  const [name, setName] = React.useState("")
  const [country, setCountry] = React.useState<Country>(DEFAULT_COUNTRY)
  const [number, setNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [socials, setSocials] = React.useState<Record<SocialKey, string>>(EMPTY)
  const [notes, setNotes] = React.useState("")
  const [whyChooseUs, setWhyChooseUs] = React.useState("")

  // Inline field validation: red border + shake + smooth-scroll to the first.
  const [errors, setErrors] = React.useState<Set<FieldKey>>(new Set())
  // Separate from `errors` so the shake can replay on each submit (cleared,
  // then re-applied next frame) without re-triggering on every keystroke.
  const [shaking, setShaking] = React.useState<Set<FieldKey>>(new Set())
  const nameRef = React.useRef<HTMLDivElement>(null)
  const phoneRef = React.useRef<HTMLDivElement>(null)
  const contactRef = React.useRef<HTMLDivElement>(null)
  const refFor = (key: FieldKey) =>
    key === "name" ? nameRef : key === "phone" ? phoneRef : contactRef

  function clearError(key: FieldKey) {
    setErrors((prev) => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  function setSocial(key: SocialKey, value: string) {
    setSocials((s) => ({ ...s, [key]: value }))
    clearError("contact")
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = number.replace(/[^\d]/g, "")
    const next = new Set<FieldKey>()
    if (!name.trim()) next.add("name")
    if (digits.length < 5) next.add("phone")
    if (!email.trim() && !SOCIALS.some((s) => socials[s.key].trim()))
      next.add("contact")

    if (next.size > 0) {
      setErrors(next)
      // Scroll to the first invalid field (top-to-bottom order), shake all.
      const order: FieldKey[] = ["name", "phone", "contact"]
      const first = order.find((k) => next.has(k))
      if (first) {
        refFor(first).current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
      // Replay the shake: clear it this render, then re-apply next frame so
      // the CSS animation restarts even if the same fields failed last time.
      setShaking(new Set())
      requestAnimationFrame(() => setShaking(new Set(next)))
      return
    }

    setErrors(new Set())
    startTransition(async () => {
      const res = await submitModelApplication({
        name: name.trim(),
        phone: `${country.dial}${digits}`,
        phoneCountry: country.iso2,
        whatsapp: socials.whatsapp.trim() || undefined,
        instagram: socials.instagram.trim() || undefined,
        telegram: socials.telegram.trim() || undefined,
        tiktok: socials.tiktok.trim() || undefined,
        youtube: socials.youtube.trim() || undefined,
        facebook: socials.facebook.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        whyChooseUs: whyChooseUs.trim() || undefined,
      })
      if (res.ok) setDone(true)
      else toast.error(res.error)
    })
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[#39FF14]/40 bg-[#39FF14]/5 p-8 text-center">
        <p className="text-xl font-semibold text-white">You&apos;re in. 🙌</p>
        <p className="mt-2 text-sm text-white/60">
          Thanks for applying. If you&apos;re a fit to feature in a video,
          we&apos;ll reach out on one of the channels you shared.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <Field
        ref={nameRef}
        label="Your name"
        error={errors.has("name") ? ERROR_TEXT.name : undefined}
        shake={shaking.has("name")}
      >
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            clearError("name")
          }}
          placeholder="Full name"
          autoComplete="name"
          className={pill(errors.has("name"))}
        />
      </Field>

      {/* Phone */}
      <Field
        ref={phoneRef}
        label="Phone number"
        error={errors.has("phone") ? ERROR_TEXT.phone : undefined}
        shake={shaking.has("phone")}
      >
        <PhoneInput
          country={country}
          onCountryChange={setCountry}
          number={number}
          onNumberChange={(v) => {
            setNumber(v)
            clearError("phone")
          }}
          pillClassName={pill(errors.has("phone"))}
        />
      </Field>

      {/* Email */}
      <Field
        ref={contactRef}
        label="Email"
        optional
        error={errors.has("contact") ? ERROR_TEXT.contact : undefined}
        shake={shaking.has("contact")}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            clearError("contact")
          }}
          placeholder="you@email.com"
          autoComplete="email"
          className={pill(errors.has("contact"))}
        />
      </Field>

      {/* Socials */}
      <Field label="Where can we find you?" optional="add any you have">
        <div className="flex flex-col gap-2">
          {SOCIALS.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-4 text-white/50">
                <Icon className="h-4 w-4" />
                <span className="w-20 text-sm">{label}</span>
              </div>
              <Input
                value={socials[key]}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className={`${pill()} pl-32`}
              />
            </div>
          ))}
        </div>
      </Field>

      {/* Notes */}
      <Field label="Notes" optional>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything we should know — location, availability, experience…"
          className={block}
        />
      </Field>

      {/* Pitch */}
      <Field label="Why should we choose you to feature in our videos?" optional>
        <Textarea
          value={whyChooseUs}
          onChange={(e) => setWhyChooseUs(e.target.value)}
          placeholder="Tell us something great about yourself…"
          className={block}
        />
      </Field>

      <Button
        type="submit"
        variant="lime"
        size="pill"
        disabled={pending}
        className="mt-1 w-full"
      >
        {pending ? "Sending…" : "Submit application"}
      </Button>
      <p className="text-center text-xs text-white/35">
        We only use this to get in touch about featuring you.
      </p>
    </form>
  )
}

const Field = React.forwardRef<
  HTMLDivElement,
  {
    label: string
    optional?: boolean | string
    error?: string
    shake?: boolean
    children: React.ReactNode
  }
>(function Field({ label, optional, error, shake, children }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 scroll-mt-24", shake && "animate-shake")}
    >
      <label className="px-1 text-sm font-medium text-white/80">
        {label}
        {optional && (
          <span className="ml-1 text-white/30">
            ({typeof optional === "string" ? optional : "optional"})
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="px-1 text-xs font-medium text-red-400">{error}</p>
      ) : null}
    </div>
  )
})
