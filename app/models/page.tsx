import type { Metadata } from "next"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal"
import { ModelApplicationForm } from "@/components/models/model-application-form"

export const metadata: Metadata = {
  title: "Feature in our videos — Lipe Moves",
  description:
    "Want to appear in Lipe Moves videos? Apply here — movement, yoga and mobility shoots in Koh Phangan.",
}

export default function ModelsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-xl px-6 pb-24 pt-16 sm:pt-24">
        <RevealGroup className="flex flex-col items-center text-center">
          <RevealItem>
            <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">
              Casting · Apply
            </p>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-4xl">
              Be in our <span className="text-[#39FF14]">videos.</span>
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              We&apos;re always looking for movers, yogis and athletes to feature
              in Lipe Moves content. Drop your details and tell us why you&apos;d
              be a great fit.
            </p>
          </RevealItem>
        </RevealGroup>

        <Reveal className="mt-10" delay={0.05}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
            <ModelApplicationForm />
          </div>
        </Reveal>

        <p className="mt-10 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Lipe Moves
        </p>
      </div>
    </main>
  )
}
