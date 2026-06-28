import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const PT_FEATURES = [
  "Personalised programming",
  "Live form feedback",
  "Direct access to me",
]

// 1-on-1 coaching is high-touch — booked via WhatsApp/email, not checkout.
const PT_EMAIL = "felipe.muner@gmail.com"
const PT_MAILTO = `mailto:${PT_EMAIL}?subject=${encodeURIComponent(
  "1-on-1 Personal Training with LipeMoves",
)}`
const PT_WHATSAPP = `https://wa.me/5521984852802?text=${encodeURIComponent(
  "Hi Felipe, I'm interested in 1:1 coaching",
)}`

export default function PricingContent() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <section className="mx-auto max-w-2xl px-6 py-24 md:py-32">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Coaching</p>
          <h1 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Train <span className="text-[#39FF14]">1-on-1</span> with me.
          </h1>
          <p className="mt-4 text-white/55">
            Personal coaching built around your body and goals. A few clients at a time.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-md">
          {/* 1×1 Personal Training — booked by email, not instant checkout */}
          <div className="relative rounded-3xl border border-[#39FF14]/30 bg-white/[0.02] p-8">
            <span className="absolute right-8 top-8 rounded-full bg-[#39FF14]/15 px-3 py-1 text-xs font-semibold text-[#39FF14]">
              1-on-1
            </span>
            <p className="text-base text-white/70">Personal Training</p>
            <p className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none">1:1</span>
              <span className="pb-1 text-base text-white/40">coaching</span>
            </p>
            <span className="mt-5 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
              Custom plan · email for pricing
            </span>
            <ul className="mt-6 space-y-4 text-sm">
              {PT_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild variant="white" size="pill-lg" className="mt-9 w-full">
              <a href={PT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                Message on WhatsApp →
              </a>
            </Button>
            <p className="mt-4 text-center text-sm text-white/40">
              or{" "}
              <a
                href={PT_MAILTO}
                className="text-white/60 underline-offset-2 hover:text-white hover:underline"
              >
                email me
              </a>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-[#39FF14] hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
