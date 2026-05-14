import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

const FPS = 30
const BG = "#fafaf7" // warm cream, App-Store aesthetic
const INK = "#0a0a0a"
const ACCENT = "#737373"

/** A scene = big phrase + a screenshot (or pure-text hero). */
interface Scene {
  /** Slug used to find the screenshot file in public/presentation/<image>.png */
  image: string | null
  /** Big bold phrase shown beside or over the screenshot */
  headline: string
  /** Smaller supporting line */
  sub?: string
  durationSec: number
  /** Layout variant */
  layout?: "hero" | "left-text" | "right-text" | "below"
}

const SCENES: Scene[] = [
  // Hook
  {
    image: null,
    headline: "Run your yoga studio.",
    sub: "From one beautiful dashboard.",
    durationSec: 3,
    layout: "hero",
  },
  // Calendar
  {
    image: "03-classes-calendar.png",
    headline: "Schedule classes\nin seconds.",
    sub: "Click. Done.",
    durationSec: 4.5,
    layout: "left-text",
  },
  // New class
  {
    image: "04-new-class-dialog.png",
    headline: "Set the price.\nSet the teacher's share.",
    durationSec: 4.5,
    layout: "right-text",
  },
  // Import
  {
    image: "05-import-dialog.png",
    headline: "Bulk import\nfrom Excel.",
    sub: "Every line validated.",
    durationSec: 4.5,
    layout: "left-text",
  },
  // Copy week
  {
    image: "06-copy-week-dialog.png",
    headline: "Copy a whole week.\nOne click.",
    durationSec: 4,
    layout: "right-text",
  },
  // Teachers
  {
    image: "08-teachers.png",
    headline: "Teachers, students,\nand payments —",
    sub: "all in one place.",
    durationSec: 4.5,
    layout: "left-text",
  },
  // Payments
  {
    image: "11-payments.png",
    headline: "Payouts calculated\nautomatically.",
    sub: "By date. By teacher. By share %.",
    durationSec: 5,
    layout: "right-text",
  },
  // Currency
  {
    image: "12-account.png",
    headline: "THB or USD.\nLive rate.",
    durationSec: 4,
    layout: "left-text",
  },
  // CTA / outro
  {
    image: null,
    headline: "Yoga Center",
    sub: "Built for yoga studios.",
    durationSec: 3.5,
    layout: "hero",
  },
]

const TOTAL_FRAMES = SCENES.reduce(
  (acc, s) => acc + Math.round(s.durationSec * FPS),
  0,
)

function SceneView({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Spring-in for the whole scene
  const enter = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 140, mass: 0.8 },
  })
  // Fade out near the end
  const exit = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )
  const opacity = Math.min(enter, exit)

  // Subtle Ken Burns
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.04], {
    extrapolateRight: "clamp",
  })

  if (scene.layout === "hero" || scene.image === null) {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            opacity,
            transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          }}
        >
          <Headline text={scene.headline} fontSize={130} />
          {scene.sub && <SubLine text={scene.sub} fontSize={42} />}
        </div>
      </AbsoluteFill>
    )
  }

  const textOnLeft = scene.layout === "left-text"

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "0 100px",
        gap: 80,
        opacity,
      }}
    >
      {/* Text side */}
      <div
        style={{
          flex: "0 0 38%",
          order: textOnLeft ? 0 : 1,
          transform: `translateX(${textOnLeft ? interpolate(enter, [0, 1], [-60, 0]) : interpolate(enter, [0, 1], [60, 0])}px)`,
        }}
      >
        <Headline text={scene.headline} fontSize={86} />
        {scene.sub && <SubLine text={scene.sub} fontSize={32} />}
      </div>

      {/* Screenshot side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: textOnLeft ? "flex-start" : "flex-end",
          order: textOnLeft ? 1 : 0,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)",
            transform: `scale(${scale * interpolate(enter, [0, 1], [0.94, 1])})`,
            width: "100%",
            maxWidth: 1100,
            background: "white",
          }}
        >
          <Img
            src={staticFile(`presentation/${scene.image}`)}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Headline({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <h1
      style={{
        margin: 0,
        fontSize,
        lineHeight: 1.02,
        letterSpacing: -2,
        color: INK,
        fontWeight: 700,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </h1>
  )
}

function SubLine({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <p
      style={{
        margin: "20px 0 0",
        fontSize,
        color: ACCENT,
        fontWeight: 400,
        letterSpacing: -0.5,
      }}
    >
      {text}
    </p>
  )
}

export const Reel: React.FC = () => {
  let cursor = 0
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "Outfit, -apple-system, sans-serif" }}>
      {/* Background music underneath everything, ducked a bit */}
      <Audio src={staticFile("presentation/music/track.mp3")} volume={0.65} />

      {SCENES.map((s, i) => {
        const dur = Math.round(s.durationSec * FPS)
        const from = cursor
        cursor += dur
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SceneView scene={s} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

export const REEL_FPS = FPS
export const REEL_TOTAL_FRAMES = TOTAL_FRAMES
