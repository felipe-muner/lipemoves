/**
 * StoryReel — 60s narrative pitch for lipemoves, built on the principles
 * studied from MrBeast, Casey Neistat, Johnny Harris, Veritasium, Peter
 * McKinnon, Matti Haapoja, Sam Kolder, Daniel Schiffer:
 *
 *   1. STRONG OPENING HOOK (0–4s)         — a sharp question that promises a
 *      payoff: "What if running your yoga studio was one click?"
 *
 *   2. STAKES / PROBLEM (4–10s)           — flash cards of the chaos:
 *      "5 apps · 12 spreadsheets · 0 sleep" — visualizes the pain.
 *
 *   3. PROMISE / TURN (10–14s)            — "What if it was all… here?"
 *      lands on the dashboard. Camera punches in.
 *
 *   4. RESOLUTION / FEATURE TOUR (14–48s) — 8 features × ~4s each. Every
 *      cut introduces a new visual at <4s edit density. Each carries an
 *      accent color to keep the visual identity coherent.
 *
 *   5. EMOTIONAL CLOSE (48–58s)           — slow zoom on the product,
 *      music builds, "One screen. Everything."
 *
 *   6. CTA (58–60s)                       — logo + tagline. Short.
 *
 * AUDIO DESIGN (the layer most amateurs underestimate):
 *   - Music bed: track-energetic.mp3 (ducked at key moments)
 *   - Section transitions: whoosh + click (already in /music)
 *   - Impact stings: pop / impact (add to /sfx)
 *   - Ambient "room tone" pad under the dashboard reveal
 *
 * COLOR GRADE:
 *   - Black background (#08080c) with a teal/purple tint via overlay
 *   - Accent colors per feature, but always paired with the same off-white
 *   - Subtle vignette + grain across every shot so it reads as one piece
 */
import * as React from "react"
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import {
  useFlash,
  useKenBurns,
  useOutro,
  usePunchIn,
  useShake,
  useSwoop,
} from "./lib/anim"

export const STORY_FPS = 30
export const STORY_TOTAL_FRAMES = 1800 // 60s

const FONT_STACK = "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
const ACCENT = "#a855f7"
const ACCENT_2 = "#10b981"

interface Beat {
  id: string
  from: number
  duration: number
  render: () => React.ReactElement
}

interface FeatureBeat {
  title: string
  body: string
  image: string
  accent: string
}

const FEATURE_TOUR: FeatureBeat[] = [
  { title: "One calendar.",        body: "Drag to schedule. Color-coded by teacher.", image: "presentation/03-classes-calendar.png", accent: "#a855f7" },
  { title: "One source of truth.", body: "Avatars, plans, history — together.",       image: "presentation/21-students-avatars.png", accent: "#0ea5e9" },
  { title: "Payroll, solved.",     body: "Cash-basis. Per teacher. Bulk-paid.",       image: "presentation/11-payments.png",         accent: "#10b981" },
  { title: "Finance, see-able.",   body: "12 months. Seasonal. Real numbers.",        image: "presentation/14-finance-overview.png", accent: "#ef4444" },
  { title: "Plans + memberships.", body: "Yoga · Pool · Ice Bath. Per-student log.",   image: "presentation/19-memberships.png",      accent: "#7e22ce" },
  { title: "POS built-in.",        body: "Smoothies + retail + ice baths.",            image: "presentation/22-restaurant-pos.png",   accent: "#f59e0b" },
  { title: "Reports as PDF.",      body: "Monthly · income statement · payouts.",      image: "presentation/18-pdf-reports.png",      accent: "#06b6d4" },
  { title: "⌘K everything.",       body: "Search every feature in 200ms.",             image: "presentation/23-command-palette.png",  accent: "#22c55e" },
]

/* ─── Top-level composition ───────────────────────────────────── */

export const StoryReel: React.FC = () => {
  const tourStart = 14 * STORY_FPS // frame 420
  const tourEach = 4 * STORY_FPS // 120 frames each
  const closeStart = tourStart + tourEach * FEATURE_TOUR.length // 420 + 960 = 1380

  return (
    <AbsoluteFill style={{ background: "#08080c", fontFamily: FONT_STACK }}>
      {/* MUSIC BED — ducked under the hook + close to let the text breathe. */}
      <Audio
        src={staticFile("presentation/music/track-energetic.mp3")}
        volume={(f) => {
          // Build slowly through hook
          if (f < 120) return 0.2
          // Solid through middle
          if (f < closeStart) return 0.55
          // Swell on the close
          if (f < closeStart + 240) return 0.75
          // Settle out
          return 0.4
        }}
      />

      <FilmGrade />

      {/* 1. HOOK (0–120 frames / 0–4s) */}
      <Sequence from={0} durationInFrames={120}>
        <Hook />
      </Sequence>

      {/* 2. STAKES (120–300 / 4–10s) — flash cards of chaos */}
      <Sequence from={120} durationInFrames={180}>
        <Stakes />
      </Sequence>

      {/* 3. PROMISE (300–420 / 10–14s) */}
      <Sequence from={300} durationInFrames={120}>
        <Promise />
      </Sequence>

      {/* 4. TOUR — 8 features × 4s each (420 → 1380) */}
      {FEATURE_TOUR.map((f, i) => (
        <Sequence
          key={f.title}
          from={tourStart + i * tourEach}
          durationInFrames={tourEach}
        >
          <TourBeat feature={f} index={i} />
        </Sequence>
      ))}

      {/* 5. CLOSE (1380 → 1680 / 46–56s) */}
      <Sequence from={closeStart} durationInFrames={300}>
        <Close />
      </Sequence>

      {/* 6. CTA (1680 → 1800 / 56–60s) */}
      <Sequence from={closeStart + 300} durationInFrames={120}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  )
}

/* ─── Film grade (consistent visual identity layer) ───────────── */

const FilmGrade: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        zIndex: 80,
      }}
    />
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background:
          "linear-gradient(135deg, rgba(168,85,247,0.04), transparent 30%, rgba(16,185,129,0.04))",
        zIndex: 81,
      }}
    />
  </>
)

/* ─── 1. Hook ─────────────────────────────────────────────────── */

const Hook: React.FC = () => {
  const punch = usePunchIn(8, 18)
  const out = useOutro(0, 120, 18)
  const shake = useShake(8, 10, 5)
  const flash = useFlash([0], 4)
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
      }}
    >
      <Audio src={staticFile("presentation/music/click.mp3")} />
      <FlashOverlay opacity={flash} />
      <div
        style={{
          opacity: punch.opacity * out.opacity,
          transform: `translate(${shake.x}px, ${shake.y + out.y}px) scale(${punch.scale})`,
          textAlign: "center",
          color: "#fafafa",
          maxWidth: 1500,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 18,
            opacity: 0.5,
            marginBottom: 36,
            textTransform: "uppercase",
            color: "#a3a3a3",
          }}
        >
          A question
        </div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.98,
          }}
        >
          What if running your
          <br />
          yoga studio was
          <br />
          <span style={{ color: ACCENT }}>one click?</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ─── 2. Stakes — fast cuts visualizing the pain ──────────────── */

const PAINS = [
  { text: "5 apps", sub: "to run one studio" },
  { text: "12 spreadsheets", sub: "you don't trust" },
  { text: "0 sleep", sub: "on payroll night" },
]

const Stakes: React.FC = () => {
  const each = 60 // 2s each
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {PAINS.map((p, i) => (
        <Sequence key={p.text} from={i * each} durationInFrames={each}>
          <PainCard pain={p} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

const PainCard: React.FC<{ pain: { text: string; sub: string } }> = ({ pain }) => {
  const swoop = useSwoop(2, "up", 10)
  const out = useOutro(0, 60, 8)
  const flash = useFlash([0], 4)
  const shake = useShake(2, 8, 8)
  return (
    <AbsoluteFill
      style={{
        background: "#1a0a0a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("presentation/music/click.mp3")} />
      <FlashOverlay opacity={flash} />
      <div
        style={{
          opacity: swoop.opacity * out.opacity,
          transform: `translate(${swoop.x + shake.x}px, ${swoop.y + shake.y + out.y}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 280,
            fontWeight: 900,
            letterSpacing: -8,
            color: "#ef4444",
            lineHeight: 0.85,
            textShadow: "0 0 80px rgba(239,68,68,0.4)",
          }}
        >
          {pain.text}
        </div>
        <div
          style={{
            fontSize: 48,
            color: "#fafafa",
            marginTop: 24,
            fontWeight: 500,
            opacity: 0.85,
          }}
        >
          {pain.sub}
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ─── 3. Promise — the turn ───────────────────────────────────── */

const Promise: React.FC = () => {
  const punch = usePunchIn(4, 16)
  const out = useOutro(0, 120, 14)
  const kb = useKenBurns(40, 80, "in", { x: -2, y: 1 })
  const flash = useFlash([0], 5)
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Audio src={staticFile("presentation/music/click.mp3")} />
      <FlashOverlay opacity={flash} />

      <AbsoluteFill
        style={{
          transform: `translate(${kb.x}%, ${kb.y}%) scale(${kb.scale})`,
        }}
      >
        <Img
          src={staticFile("presentation/14-finance-overview.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
            filter: "saturate(1.1) contrast(1.05)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity: punch.opacity * out.opacity,
            transform: `scale(${punch.scale}) translateY(${out.y}px)`,
            textAlign: "center",
            color: "#fafafa",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            What if it was
            <br />
            <span style={{ color: ACCENT_2 }}>all… here?</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── 4. Tour beats (8 features) ──────────────────────────────── */

const TourBeat: React.FC<{ feature: FeatureBeat; index: number }> = ({
  feature,
  index,
}) => {
  const swoop = useSwoop(4, "left", 12)
  const titleOut = useOutro(0, 120, 14)
  const kb = useKenBurns(0, 120, index % 2 === 0 ? "in" : "out", {
    x: -3,
    y: 1.2,
  })
  const flash = useFlash([0], 3)

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Audio src={staticFile("presentation/music/click.mp3")} />
      <FlashOverlay opacity={flash} />

      {/* Screenshot stays the hero — full bleed, full opacity */}
      <AbsoluteFill
        style={{ transform: `translate(${kb.x}%, ${kb.y}%) scale(${kb.scale})` }}
      >
        <Img
          src={staticFile(feature.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(1.08) contrast(1.04)",
          }}
        />
      </AbsoluteFill>

      {/* Soft left gradient so text is always readable */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, transparent 55%)",
        }}
      />

      {/* Glass info card — always bottom-left, half-screen wide */}
      <AbsoluteFill
        style={{
          padding: 80,
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            transform: `translate(${swoop.x}px, ${swoop.y + titleOut.y}px)`,
            opacity: swoop.opacity * titleOut.opacity,
            width: "50%",
            maxWidth: 920,
            background: "rgba(8,8,12,0.88)",
            backdropFilter: "blur(14px)",
            border: `1px solid ${feature.accent}44`,
            borderLeft: `4px solid ${feature.accent}`,
            borderRadius: 18,
            padding: "36px 44px",
            boxShadow: `0 25px 80px rgba(0,0,0,0.55)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              letterSpacing: 6,
              fontWeight: 600,
              color: feature.accent,
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 28,
                height: 1,
                background: feature.accent,
              }}
            />
            0{index + 1} / 0{FEATURE_TOUR.length}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1,
              color: "#fafafa",
            }}
          >
            {feature.title}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "#d4d4d4",
              marginTop: 12,
              letterSpacing: -0.2,
            }}
          >
            {feature.body}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── 5. Close — slow zoom, "One screen. Everything." ─────────── */

const Close: React.FC = () => {
  const punch = usePunchIn(20, 22)
  const out = useOutro(0, 300, 30)
  const kb = useKenBurns(0, 300, "in", { x: -1, y: 0.5 })
  const flash = useFlash([0], 6)
  return (
    <AbsoluteFill style={{ background: "#08080c" }}>
      <Audio src={staticFile("presentation/music/click.mp3")} />
      <FlashOverlay opacity={flash} />
      <AbsoluteFill
        style={{ transform: `translate(${kb.x}%, ${kb.y}%) scale(${kb.scale})` }}
      >
        <Img
          src={staticFile("presentation/14-finance-overview.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            filter: "saturate(1.15) contrast(1.1)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,12,0.3) 0%, rgba(8,8,12,0.85) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${punch.scale}) translateY(${out.y}px)`,
            opacity: punch.opacity * out.opacity,
            textAlign: "center",
            color: "#fafafa",
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 0.95,
            }}
          >
            One screen.
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 0.95,
              color: ACCENT,
              marginTop: 8,
            }}
          >
            Everything.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── 6. CTA ──────────────────────────────────────────────────── */

const CTA: React.FC = () => {
  const punch = usePunchIn(6, 18)
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #08080c 0%, #1a0a2e 100%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: punch.opacity,
          transform: `scale(${punch.scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 22,
            opacity: 0.55,
            color: "#fafafa",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          lipemoves
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: -1.5,
            lineHeight: 1.05,
          }}
        >
          Built for studios
          <br />
          that <span style={{ color: ACCENT }}>move.</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const FlashOverlay: React.FC<{ opacity: number }> = ({ opacity }) =>
  opacity > 0 ? (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        opacity: opacity * 0.55,
        zIndex: 95,
        pointerEvents: "none",
      }}
    />
  ) : null
