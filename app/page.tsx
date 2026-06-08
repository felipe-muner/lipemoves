import Link from "next/link"
import Image from "next/image"
import heroImg from "@/public/ebooks/photos/1SN01213.jpg"
import yogaImg from "@/public/ebooks/photos/z_yoga.jpg"
import felipeImg from "@/public/ebooks/photos/1SN03111.jpg"
import coachingImg from "@/public/ebooks/photos/z_kettlebell_rack.jpg"
import { Check, ArrowRight } from "lucide-react"
import { auth } from "@/lib/auth"
import { LandingNav, type NavItem } from "@/components/landing/LandingNav"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal"
import NewsletterForm from "@/components/NewsletterForm"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const NAV: NavItem[] = [
  { label: "The Program", id: "program" },
  { label: "Who's It For", id: "who" },
  { label: "Felipe", id: "felipe" },
  { label: "Pricing", id: "pricing" },
  { label: "Inner Circle", id: "inner-circle" },
  { label: "FAQ", id: "faq" },
]

const MARQUEE = [
  "Strength",
  "Mobility",
  "Breath",
  "Balance",
  "Longevity",
  "Control",
  "Flexibility",
]

const PILLARS = [
  {
    n: "01",
    title: "Yoga",
    desc: "Vinyasa, hatha and yin to calm the nervous system and win back the range of motion you were born with.",
  },
  {
    n: "02",
    title: "Mobility",
    desc: "Daily routines to free the joints — long spine, open hips, ankles that bend, a body that works with you.",
  },
  {
    n: "03",
    title: "Kettlebell",
    desc: "One weight, the whole body. Ballistic, rotational strength for a body that can catch a slip and bounce back.",
  },
  {
    n: "04",
    title: "Breath",
    desc: "Breath first, eyes next, movement follows. Active meditation that leaves you better than you came in.",
  },
]

const METHOD_POINTS = [
  "Mobility before muscle",
  "Daily practice over intensity",
  "Breath-led movement",
  "Train for real life",
]

const AUDIENCE = [
  {
    title: "Rebuilding after 30",
    desc: "You looked fine in the mirror but couldn't do much in real life. Time to rebuild from the ground up.",
  },
  {
    title: "Travelers & nomads",
    desc: "8 years on the road, routine never broken. A practice that fits hotels, beaches, jungles and airports.",
  },
  {
    title: "Desk-bound bodies",
    desc: "Tight hips, stiff shoulders, a stiff spine. Ten minutes a day to undo what sitting does.",
  },
  {
    title: "Starting over",
    desc: "No equipment, no experience, no pressure. Slow and steady, the kind of change that actually sticks.",
  },
]

const FAQ = [
  {
    q: "Do I need any equipment?",
    a: "No. Everything starts with your body. A single kettlebell is optional and introduced later — never required.",
  },
  {
    q: "How much time per day?",
    a: "As little as 5–10 minutes to start. Consistency beats intensity — the practice grows with you.",
  },
  {
    q: "I'm a total beginner. Is this for me?",
    a: "Especially for you. The whole method is built to ease you in slowly, mobility first, so nothing breaks and it sticks.",
  },
  {
    q: "Is it only yoga?",
    a: "No — yoga, mobility, kettlebell and breath. Four pillars working together for a body built for real life.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Both plans are cancel-anytime, no questions asked.",
  },
]

const MONTHLY_FEATURES = [
  "Personalized adaptive daily practice",
  "Full movement library — yoga, mobility, kettlebell, breath",
  "Strength, mobility, control & longevity tracks",
  "Community access + challenges",
  "New classes every week",
]

const ANNUAL_FEATURES = [
  "Everything in Monthly, plus:",
  "Save 40% vs monthly billing",
  "Priority access to new drops",
  "Early access to new programs",
  "Annual member perks & content",
]

const WA_INNER =
  "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%201%3A1%20coaching"

export default async function HomePage() {
  const session = await auth()
  const user = session?.user
    ? { name: session.user.name, image: session.user.image }
    : null

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNav items={NAV} user={user} />

      {/* ===== Hero ===== */}
      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-36 md:flex-row md:items-center md:pt-44">
        <RevealGroup className="flex-1">
          <RevealItem>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Movement · Mobility · Breath
            </p>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-6 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              A body
              <br />
              <span className="text-[#39FF14]">built for life.</span>
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mt-7 max-w-md text-base leading-relaxed text-white/60">
              Daily yoga, mobility, kettlebell and breath — practice at your own
              pace, anywhere. Years in motion, distilled into one simple practice.
            </p>
          </RevealItem>

          <RevealItem className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70">
              No equipment needed
            </span>
            <span className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70">
              New classes weekly
            </span>
          </RevealItem>

          <RevealItem className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="lime" size="pill">
              <a href="#pricing">Start practicing</a>
            </Button>
            <Button asChild variant="glass" size="pill">
              <a href="#program">See the program</a>
            </Button>
          </RevealItem>
        </RevealGroup>

        <Reveal className="flex-1" delay={0.15}>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl md:ml-auto md:max-w-sm">
            <Image
              src={heroImg}
              alt="Felipe Muner — movement practice"
              fill
              priority
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* ===== Marquee band ===== */}
      <div className="overflow-hidden border-y border-white/10 py-5">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
              {Array.from({ length: 3 }).flatMap((_, rep) =>
                MARQUEE.map((word, w) => (
                  <span
                    key={`${dup}-${rep}-${w}`}
                    className="flex items-center text-sm font-semibold uppercase tracking-[0.3em] text-white/80"
                  >
                    <span className="px-6">{word}</span>
                    <span className="text-[#39FF14]">✦</span>
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== The Program ===== */}
      <section id="program" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
            <Image
              src={yogaImg}
              alt="Movement practice"
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
          <RevealGroup>
            <RevealItem>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                The program
              </p>
            </RevealItem>
            <RevealItem>
              <h2 className="mt-5 text-4xl font-extrabold uppercase leading-tight tracking-tight md:text-5xl">
                Built for life,
                <br />
                <span className="text-[#39FF14]">not the mirror.</span>
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="mt-6 max-w-md leading-relaxed text-white/60">
                Mobility first, then flexibility, then stability and balance — and
                only then muscle. Rebuilt from the ground up, the kind of body that
                sits on the floor, lifts, twists, falls and gets back up.
              </p>
            </RevealItem>
            <RevealItem className="mt-8 space-y-3">
              {METHOD_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-3 text-white/80">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#39FF14] text-[11px] font-bold text-black">
                    ✓
                  </span>
                  {point}
                </div>
              ))}
            </RevealItem>
          </RevealGroup>
        </div>

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <RevealItem
              key={pillar.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-white/30"
            >
              <span className="text-2xl font-extrabold text-[#39FF14]">
                {pillar.n}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {pillar.desc}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ===== Who's It For ===== */}
      <section id="who" className="border-t border-white/10 scroll-mt-20 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Who's it for
            </p>
            <h2 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
              Built for real bodies.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2">
            {AUDIENCE.map((item) => (
              <RevealItem
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/30"
              >
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-white/55">{item.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ===== Felipe (about) ===== */}
      <section id="felipe" className="border-t border-white/10 scroll-mt-20 px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <RevealGroup>
            <RevealItem>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Felipe Muner
              </p>
            </RevealItem>
            <RevealItem>
              <h2 className="mt-5 text-4xl font-extrabold uppercase leading-tight tracking-tight md:text-5xl">
                Years in motion.
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="mt-6 max-w-md leading-relaxed text-white/60">
                Until I was 28 I lived the typical loop — desk, gym, mirror — with
                a body that looked fine but couldn't do much. Everything changed
                after 30: mobility, then flexibility, then strength. I'm going to
                hit 40 feeling better than I did in my 20s — and I'm here to help
                you get there too.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="mt-8 text-2xl font-extrabold uppercase leading-snug tracking-tight">
                “Build a body <span className="text-[#39FF14]">for life</span>,
                <br />
                not the mirror.”
              </p>
            </RevealItem>
          </RevealGroup>
          <Reveal className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl md:order-first">
            <Image
              src={felipeImg}
              alt="Felipe Muner"
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="border-t border-white/10 scroll-mt-20 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Pricing
            </p>
            <h2 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
              Choose your membership.
            </h2>
            <p className="mt-4 text-white/55">
              Every class, every pillar. No equipment. Cancel anytime.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid items-start gap-6 sm:grid-cols-2">
            {/* Monthly */}
            <RevealItem className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <p className="text-base text-white/70">Monthly</p>
              <p className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-extrabold leading-none">$35</span>
                <span className="pb-1 text-base text-white/40">/ month</span>
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                {MONTHLY_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={3} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild variant="white" size="pill-lg" className="mt-9 w-full">
                <Link href="/register">
                  Begin Monthly <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-center text-sm text-white/40">Cancel anytime</p>
            </RevealItem>

            {/* Annual */}
            <RevealItem className="relative rounded-3xl bg-[#39FF14] p-8 text-black">
              <span className="absolute right-8 top-8 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold">
                Best value
              </span>
              <p className="text-base text-black/70">Annual</p>
              <p className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-extrabold leading-none">$250</span>
                <span className="pb-1 text-base text-black/50">/ year</span>
              </p>
              <span className="mt-5 inline-block rounded-full bg-black/15 px-3 py-1 text-xs font-bold">
                Save 40% · Billed yearly
              </span>
              <ul className="mt-6 space-y-4 text-sm">
                {ANNUAL_FEATURES.map((feature, i) => (
                  <li key={feature} className="flex items-start gap-3 text-black/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" strokeWidth={3} />
                    <span className={i === 0 ? "font-bold text-black" : undefined}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="ink" size="pill-lg" className="mt-9 w-full">
                <Link href="/register">
                  Begin Annual <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-center text-sm text-black/50">Cancel anytime</p>
            </RevealItem>
          </RevealGroup>
          <p className="mt-8 text-center text-sm text-white/40">
            No equipment · Cancel any time
          </p>
        </div>
      </section>

      {/* ===== Inner Circle ===== */}
      <section
        id="inner-circle"
        className="relative scroll-mt-20 overflow-hidden border-t border-white/10"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <RevealGroup>
            <RevealItem>
              <h2 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-6xl">
                Inner circle.
                <br />
                <span className="text-[#39FF14]">1:1 coaching.</span>
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="mt-7 max-w-md leading-relaxed text-white/60">
                The highest tier — personal and hands-on. A few clients each month.
                We build your movement, nutrition, fasting, rest and breath into one
                plan that fits your body and goals, tracked with you daily.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="mt-4 max-w-md leading-relaxed text-white/60">
                By application only, for those ready to make a serious commitment to
                long-term transformation.
              </p>
            </RevealItem>
            <RevealItem>
              <Button asChild variant="lime" size="pill" className="mt-9">
                <a href={WA_INNER} target="_blank" rel="noopener noreferrer">
                  Apply on WhatsApp →
                </a>
              </Button>
            </RevealItem>
          </RevealGroup>
          <Reveal className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl">
            <Image
              src={coachingImg}
              alt="1:1 coaching"
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-t border-white/10 scroll-mt-20 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              FAQ
            </p>
            <h2 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
              Questions, answered.
            </h2>
          </Reveal>
          <Accordion
            type="single"
            collapsible
            className="mt-12 border-y border-white/10"
          >
            {FAQ.map((item, i) => (
              <Reveal
                key={item.q}
                delay={i * 0.08}
                className="border-b border-white/10 last:border-b-0"
              >
                <AccordionItem value={item.q} className="border-b-0">
                  <AccordionTrigger className="py-5 text-lg font-medium text-white hover:no-underline [&>svg]:text-[#39FF14] [&>svg]:size-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-white/55">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== Guide / Newsletter ===== */}
      <section className="border-t border-white/10 px-6 py-24 md:py-32">
        <RevealGroup className="mx-auto max-w-2xl text-center">
          <RevealItem>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Free guide
            </p>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-5 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
              Start with the foundations.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-white/55">
              Five base movements that free the hips, shoulders and spine in 10
              minutes a day. Free, straight to your inbox.
            </p>
          </RevealItem>
          <RevealItem className="mt-8">
            <NewsletterForm source="homepage" />
          </RevealItem>
        </RevealGroup>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative overflow-hidden border-t border-white/10">
        {/* tagline + legal + social, constrained */}
        <div className="mx-auto max-w-6xl px-6 pt-16">
          <Reveal>
            <p className="text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-5xl">
              Move better.{" "}
              <br className="md:hidden" />
              <span className="whitespace-nowrap text-[#39FF14]">For life.</span>
            </p>
          </Reveal>
          <div className="mt-12 flex flex-col justify-between gap-8 border-t border-white/10 pb-14 pt-8 md:flex-row md:items-center">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Lipe Moves. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-white/60">
              <a
                href="https://instagram.com/felipeenjoylife"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                Instagram
              </a>
              <a
                href="https://wa.me/5521984852802"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                WhatsApp
              </a>
              <a
                href="mailto:felipe.muner@gmail.com"
                className="transition-colors hover:text-white"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        {/* giant full-bleed faded wordmark (micro1-style), bleeding off both edges */}
        <div className="relative">
          {/* neon-green glow rising from the bottom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_120%_at_50%_115%,rgba(57,255,20,0.28),transparent_70%)]"
          />
          <h2
            aria-label="Lipe Moves"
            className="-mb-[0.14em] block select-none whitespace-nowrap bg-gradient-to-b from-[#39FF14]/0 via-[#39FF14]/25 to-[#39FF14] bg-clip-text text-center text-[17vw] font-black uppercase leading-none tracking-tighter text-transparent"
          >
            Lipe Moves
          </h2>
        </div>
      </footer>
    </main>
  )
}
