/**
 * PitchReel — 30s Casey-Neistat-style fast cut for lipemoves.
 *
 * Structure (900 frames @ 30fps):
 *   0–90    Hook: "Run your yoga studio from one screen"
 *   90–750  Feature montage: 8 features × 80 frames (~2.7s each)
 *   750–840 Beat: "All in one screen." (music dip)
 *   840–900 Outro: logo + CTA
 *
 * Audio assets expected (drop into public/presentation/sfx/):
 *   - whoosh.mp3, click.mp3, pop.mp3, impact.mp3, ding.mp3
 * Music: public/presentation/music/track-energetic.mp3
 */
import * as React from "react"
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
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

export const PITCH_FPS = 30
export const PITCH_TOTAL_FRAMES = 900 // 30s
const FEATURE_LEN = 80 // ~2.7s per feature

interface Feature {
  title: string
  tagline: string
  image: string
  accent: string
}

const FEATURES: Feature[] = [
  { title: "SCHEDULE",   tagline: "Drag-and-drop weekly grid",  image: "presentation/03-classes-calendar.png",  accent: "#a855f7" },
  { title: "PAYROLL",    tagline: "Cash-basis teacher payouts", image: "presentation/11-payments.png",          accent: "#10b981" },
  { title: "STUDENTS",   tagline: "Avatars · plans · history",  image: "presentation/21-students-avatars.png",  accent: "#0ea5e9" },
  { title: "FINANCE",    tagline: "Income vs expense, monthly", image: "presentation/14-finance-overview.png",  accent: "#ef4444" },
  { title: "MEMBERSHIPS", tagline: "Yoga · Pool · Ice Bath",     image: "presentation/19-memberships.png",       accent: "#7e22ce" },
  { title: "POS",        tagline: "Restaurant orders + stock",  image: "presentation/22-restaurant-pos.png",    accent: "#f59e0b" },
  { title: "REPORTS",    tagline: "PDF · monthly · payouts",    image: "presentation/18-pdf-reports.png",       accent: "#06b6d4" },
  { title: "⌘K",         tagline: "Search every feature",       image: "presentation/23-command-palette.png",   accent: "#22c55e" },
]

const FONT_STACK = "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"

export const PitchReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: FONT_STACK }}>
      {/* Music bed under the whole thing */}
      <Audio
        src={staticFile("presentation/music/track-energetic.mp3")}
        volume={(f) => {
          // Duck during the "All in one screen" beat
          if (f >= 750 && f < 840) return 0.25
          return 0.55
        }}
      />

      {/* Subtle film grain / vignette for visual identity */}
      <Vignette />

      <Sequence from={0} durationInFrames={90}>
        <Hook />
      </Sequence>

      {FEATURES.map((feature, i) => (
        <Sequence
          key={feature.title}
          from={90 + i * FEATURE_LEN}
          durationInFrames={FEATURE_LEN}
        >
          <FeatureCut feature={feature} index={i} />
        </Sequence>
      ))}

      <Sequence from={750} durationInFrames={90}>
        <Beat />
      </Sequence>

      <Sequence from={840} durationInFrames={60}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  )
}

/** Top-of-frame vignette + grain — keeps a consistent visual identity. */
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
      mixBlendMode: "multiply",
      zIndex: 50,
    }}
  />
)

const Hook: React.FC = () => {
  const punch = usePunchIn(6, 14)
  const outro = useOutro(0, 90, 14)
  const shake = useShake(6, 8, 4)
  const flash = useFlash([0, 60], 5)
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
      }}
    >
      <Audio src={staticFile("presentation/music/click.mp3")} startFrom={0} />
      <FlashOverlay opacity={flash} />
      <div
        style={{
          opacity: punch.opacity * outro.opacity,
          transform: `translate(${shake.x}px, ${shake.y + outro.y}px) scale(${punch.scale})`,
          textAlign: "center",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: 14,
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 28,
            color: "#a3a3a3",
          }}
        >
          lipemoves
        </div>
        <div
          style={{
            fontSize: 130,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.95,
            color: "#fafafa",
          }}
        >
          Run your yoga studio
          <br />
          <span style={{ color: "#a855f7" }}>from one screen.</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const FeatureCut: React.FC<{ feature: Feature; index: number }> = ({
  feature,
  index,
}) => {
  const swoop = useSwoop(4, "left", 12)
  const kb = useKenBurns(0, FEATURE_LEN, index % 2 === 0 ? "in" : "out", {
    x: -3,
    y: 1.5,
  })
  const titleOutro = useOutro(0, FEATURE_LEN, 12)
  const flash = useFlash([0], 4)

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Audio src={staticFile("presentation/music/click.mp3")} startFrom={0} />
      <FlashOverlay opacity={flash} />

      {/* Screenshot — full bleed, near full opacity */}
      <AbsoluteFill
        style={{
          transform: `translate(${kb.x}%, ${kb.y}%) scale(${kb.scale})`,
        }}
      >
        <Img
          src={staticFile(feature.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(1.05) contrast(1.02)",
          }}
        />
      </AbsoluteFill>

      {/* Soft left-side gradient for text contrast */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 35%, transparent 55%)",
        }}
      />

      {/* Title card — always bottom-left, ~half the screen */}
      <AbsoluteFill
        style={{
          padding: 80,
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            transform: `translate(${swoop.x}px, ${swoop.y + titleOutro.y}px)`,
            opacity: swoop.opacity * titleOutro.opacity,
            width: "50%",
            maxWidth: 920,
            background: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${feature.accent}44`,
            borderLeft: `4px solid ${feature.accent}`,
            borderRadius: 16,
            padding: "32px 40px",
            boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: 14,
              letterSpacing: 6,
              fontWeight: 700,
              color: feature.accent,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            0{index + 1} / 0{FEATURES.length} · feature
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.95,
              color: "#fafafa",
            }}
          >
            {feature.title}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#d4d4d4",
              marginTop: 8,
              letterSpacing: -0.3,
            }}
          >
            {feature.tagline}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const Beat: React.FC = () => {
  const punch = usePunchIn(15, 18)
  const outro = useOutro(0, 90, 16)
  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("presentation/music/click.mp3")} startFrom={0} />
      <div
        style={{
          opacity: punch.opacity * outro.opacity,
          transform: `scale(${punch.scale}) translateY(${outro.y}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: -4,
            color: "#fafafa",
            lineHeight: 1,
          }}
        >
          All in one
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: -4,
            color: "#a855f7",
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          screen.
        </div>
      </div>
    </AbsoluteFill>
  )
}

const Outro: React.FC = () => {
  const punch = usePunchIn(4, 18)
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 100%)",
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
            fontSize: 28,
            letterSpacing: 18,
            opacity: 0.5,
            color: "#fafafa",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          lipemoves
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: -1.5,
            lineHeight: 1.05,
          }}
        >
          Built for studios
          <br />
          that <span style={{ color: "#a855f7" }}>move.</span>
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
        opacity: opacity * 0.6,
        zIndex: 100,
        pointerEvents: "none",
      }}
    />
  ) : null
