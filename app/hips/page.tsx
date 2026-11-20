import type { Metadata } from "next"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import coachImg from "@/public/ebooks/photos/GAB00148.jpg"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal"
import { FreeGuideForm } from "@/components/start/free-guide-form"
import { Button } from "@/components/ui/button"

// ─────────────────────────────────────────────────────────────────────────
// The offer. Edit these and the whole page follows.
// Keep them TRUE: spots and founding spots are a real limit (your feedback
// time), so lower the numbers as people join.
// ─────────────────────────────────────────────────────────────────────────
const OFFER = {
  price: 149, // USD, full price
  foundingPrice: 99, // USD, first group only
  spots: 10, // total places in this group
  foundingSpotsLeft: 5, // places still open at the founding price (0 = hide)
  startLabel: "", // e.g. "Starts Monday 7 December". Empty = "starts when the group is full"
}

// People join by messaging you on WhatsApp; you send payment details there
// and confirm the spot once the transfer arrives. No online checkout.
const WA_HIPS =
  "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%20want%20a%20spot%20in%20Open%20Hips"

export const metadata: Metadata = {
  title: "Open Hips — 4-week coached hip mobility program | Lipe Moves",
  description:
    "Open your hips in 4 weeks. Three short sessions a week, a clear progression and weekly video feedback from Felipe. Small group, limited spots.",
}

const PROBLEMS = [
  "You sit most of the day and stand up feeling stiff and locked.",
  "Your heels lift or your back rounds when you try to squat deep.",
  "Sitting cross-legged on the floor is uncomfortable after a minute.",
  "You stretch now and then, and nothing really changes.",
]

const WEEKS = [
  { n: "01", name: "Groove", desc: "Learn the positions. 30-second holds, easy range, good form." },
  { n: "02", name: "Open", desc: "More range and one-leg work. 40-second holds." },
  { n: "03", name: "End range", desc: "Strength where you are tightest. 45-second holds and isometrics." },
  { n: "04", name: "Own it", desc: "Deepest positions, held for 60 seconds. Range you keep." },
]

const INCLUDED = [
  {
    title: "The 4-week plan",
    desc: "12 sessions, 3 a week, about 15–20 minutes each. Every exercise shown on video, plus a printable version.",
  },
  {
    title: "Weekly video feedback from me",
    desc: "You send a short clip of your practice each week. I send back exactly what to fix.",
  },
  {
    title: "Hip test on day 1 and day 28",
    desc: "The same simple test, filmed twice, so you can see the change instead of guessing.",
  },
  {
    title: "Small group chat",
    desc: "Questions answered daily, and the people next to you keep you showing up.",
  },
]

const FAQ = [
  {
    q: "I'm very stiff. Is this for me?",
    a: "Yes. Week 1 starts with short holds in an easy range and builds from there. Stiff beginners are who it was written for.",
  },
  {
    q: "Do I need equipment?",
    a: "No. A mat or a towel on the floor is enough.",
  },
  {
    q: "How much time does it take?",
    a: "Three sessions a week of about 15–20 minutes, plus a few minutes to film one clip for me each week.",
  },
  {
    q: "How does the feedback work?",
    a: "You film one or two exercises on your phone and send them on WhatsApp. I reply with corrections for your body, usually within a day or two.",
  },
  {
    q: "I have a hip, knee or back injury. Can I join?",
    a: "This is training, not treatment. If you have pain or a diagnosed injury, check with your doctor or physio first and message me before you sign up so we can see if it fits.",
  },
  {
    q: "How do I join and pay?",
    a: "Message me on WhatsApp. I confirm there is a spot and send you the payment details for a direct transfer. Your place is reserved once the payment arrives.",
  },
  {
    q: "When does it start?",
    a: OFFER.startLabel
      ? `${OFFER.startLabel}. Everyone starts together.`
      : "As soon as the group is full. Everyone starts together and I'll confirm the date with you on WhatsApp.",
  },
]

function PrimaryCta({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Button asChild variant="lime" size="pill">
        <a href={WA_HIPS} target="_blank" rel="noopener noreferrer">
          Get a spot on WhatsApp <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}

export default function HipsOfferPage() {
  const founding = OFFER.foundingSpotsLeft > 0

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-16 sm:pt-24">
        {/* ===== Hero ===== */}
        <RevealGroup className="flex flex-col items-center text-center">
          <RevealItem>
            <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">
              4-week coached program · {OFFER.spots} spots
            </p>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-5 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Open your hips <span className="text-[#39FF14]">in 4 weeks.</span>
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/60">
              Three short sessions a week, a progression that gets deeper every
              week, and me checking your form on video. No equipment.
            </p>
          </RevealItem>
          <RevealItem>
            <PrimaryCta className="mt-8" />
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-sm text-white/45">
              {founding ? (
                <>
                  First group: <span className="text-white">${OFFER.foundingPrice}</span>{" "}
                  <span className="line-through">${OFFER.price}</span> ·{" "}
                  {OFFER.foundingSpotsLeft} founding spots
                </>
              ) : (
                <>
                  <span className="text-white">${OFFER.price}</span> · {OFFER.spots} spots per group
                </>
              )}
            </p>
          </RevealItem>
        </RevealGroup>

        {/* ===== Is this you? ===== */}
        <Reveal className="mt-20">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Is this you?</p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-3xl">
            Tight hips don&apos;t fix themselves
          </h2>
          <ul className="mt-6 space-y-4">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39FF14]" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 leading-relaxed text-white/60">
            Random stretching doesn&apos;t work because nothing builds on the day
            before. Hips open when you load the same positions a little deeper
            each week, and when someone corrects what you can&apos;t see yourself.
          </p>
        </Reveal>

        {/* ===== The 4 weeks ===== */}
        <Reveal className="mt-20">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">The plan</p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-3xl">
            Four weeks, one step deeper each
          </h2>
        </Reveal>
        <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2">
          {WEEKS.map((w) => (
            <RevealItem key={w.n}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-xs tracking-[0.3em] text-[#39FF14]">WEEK {w.n}</p>
                <h3 className="mt-2 text-xl font-extrabold uppercase tracking-tight">{w.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{w.desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* ===== What you get ===== */}
        <Reveal className="mt-20">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">What you get</p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-3xl">
            A plan, and a coach watching
          </h2>
          <ul className="mt-6 space-y-5">
            {INCLUDED.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ===== Coach ===== */}
        <Reveal className="mt-20">
          <div className="grid items-center gap-8 sm:grid-cols-[2fr_3fr]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl">
              <Image
                src={coachImg}
                alt="Felipe Muner in dancer pose by the sea"
                fill
                placeholder="blur"
                sizes="(max-width: 640px) 100vw, 260px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">Your coach</p>
              <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
                I&apos;m Felipe
              </h2>
              <p className="mt-4 leading-relaxed text-white/60">
                I teach yoga, mobility and acrobatics, and I practice every day
                from Koh Phangan. I keep this group small on purpose: I watch
                every video myself, so I can only take {OFFER.spots} people at a
                time.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ===== Guarantee ===== */}
        <Reveal className="mt-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">My guarantee</p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
              Do the work, see the change
            </h2>
            <p className="mt-4 leading-relaxed text-white/70">
              Complete the 12 sessions and send me your weekly videos. If your
              day-28 hip test doesn&apos;t look clearly better than day 1, I keep
              coaching you for free until it does.
            </p>
          </div>
        </Reveal>

        {/* ===== Price ===== */}
        <Reveal className="mt-6">
          <div className="rounded-3xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-7 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-[#39FF14]">
              {founding ? "Founding group" : "Join the next group"}
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight">
              ${founding ? OFFER.foundingPrice : OFFER.price}
              {founding ? (
                <span className="ml-3 text-2xl font-semibold text-white/35 line-through">
                  ${OFFER.price}
                </span>
              ) : null}
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              {founding
                ? `One payment, 4 weeks. The first ${OFFER.foundingSpotsLeft} people pay the founding price; in return I ask for honest feedback and your before and after clip.`
                : `One payment, 4 weeks. ${OFFER.spots} spots per group.`}
            </p>
            <PrimaryCta className="mt-7" />
            <p className="mt-4 text-xs text-white/40">
              Message me, I send the payment details, your spot is reserved
              when the transfer arrives.{" "}
              {OFFER.startLabel || "Starts as soon as the group is full."}
            </p>
          </div>
        </Reveal>

        {/* ===== FAQ ===== */}
        <Reveal className="mt-20">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Questions</p>
          <dl className="mt-6 space-y-7">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-white">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/60">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ===== Not ready: free guide ===== */}
        <Reveal className="mt-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Not ready yet?</p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
              Start with the free guide
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

        <p className="mt-12 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Lipe Moves
        </p>
      </div>
    </main>
  )
}
