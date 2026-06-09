import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import felipeImg from "@/public/ebooks/photos/1SN03111.jpg"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal"
import { FreeGuideForm } from "@/components/start/free-guide-form"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Start here — Lipe Moves",
  description:
    "Free movement guide, membership and 1:1 coaching with Felipe. Build a body for life — yoga, mobility, kettlebell and breath.",
}

const WA_COACHING =
  "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%201%3A1%20coaching"

const MEMBERSHIP_POINTS = [
  "Daily adaptive practice — yoga, mobility, kettlebell, breath",
  "Full movement library + new classes weekly",
  "Community access & challenges",
]

const LINKS = [
  { label: "Instagram", href: "https://instagram.com/felipeenjoylife" },
  { label: "WhatsApp", href: "https://wa.me/5521984852802" },
  { label: "Email", href: "mailto:felipe.muner@gmail.com" },
]

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-xl px-6 pb-24 pt-16 sm:pt-24">
        {/* ===== Hero ===== */}
        <RevealGroup className="flex flex-col items-center text-center">
          <RevealItem>
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full ring-2 ring-[#39FF14]/40">
              <Image
                src={felipeImg}
                alt="Felipe Muner"
                fill
                priority
                placeholder="blur"
                sizes="112px"
                className="object-cover"
              />
            </div>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-6 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-4xl">
              A body <span className="text-[#39FF14]">built for life.</span>
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Yoga, mobility, kettlebell and breath — practiced daily from Koh
              Phangan. Start free, then go as deep as you like.
            </p>
          </RevealItem>
        </RevealGroup>

        {/* ===== Primary: Free guide (email capture) ===== */}
        <Reveal className="mt-12" delay={0.05}>
          <div className="rounded-3xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">
              Start here · Free
            </p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
              The 5 foundations
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Five base movements that free the hips, shoulders and spine in 10
              minutes a day. Straight to your inbox.
            </p>
            <div className="mt-6">
              <FreeGuideForm />
            </div>
          </div>
        </Reveal>

        {/* ===== Membership ===== */}
        <Reveal className="mt-6" delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Membership
            </p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
              Train every day
            </h2>
            <ul className="mt-5 space-y-3">
              {MEMBERSHIP_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild variant="lime" size="pill" className="mt-7 w-full">
              <Link href="/pricing">
                See membership <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* ===== 1:1 Coaching ===== */}
        <Reveal className="mt-6" delay={0.15}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              1:1 Coaching
            </p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
              Inner circle
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Personal, hands-on coaching — movement, nutrition, breath and rest
              built around your body. A few clients each month, by application.
            </p>
            <Button asChild variant="glass" size="pill" className="mt-7 w-full">
              <a href={WA_COACHING} target="_blank" rel="noopener noreferrer">
                Apply on WhatsApp →
              </a>
            </Button>
          </div>
        </Reveal>

        {/* ===== Social links ===== */}
        <RevealGroup className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {LINKS.map((link) => (
            <RevealItem key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-10 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Lipe Moves
        </p>
      </div>
    </main>
  )
}
