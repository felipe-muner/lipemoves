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
const BG = "#fafaf7"
const INK = "#0a0a0a"
const ACCENT = "#737373"

type Layout =
  | "hero"
  | "left-text"
  | "right-text"
  | "text-top-img-bottom"
  | "text-bottom-img-top"
  | "search"
  | "class-form"
  | "delete-confirm"
  | "import-results"

interface Scene {
  image: string | null
  headline: string
  sub?: string
  durationSec: number
  layout: Layout
  typed?: string
}

const SCENES: Scene[] = [
  {
    image: null,
    headline: "",
    durationSec: 3.4,
    layout: "search",
    typed: "running a yoga studio shouldn't be hard.",
  },
  {
    image: "03-classes-calendar.png",
    headline: "Schedule your week.",
    sub: "Drag, click, done.",
    durationSec: 2.4,
    layout: "text-top-img-bottom",
  },
  {
    image: null,
    headline: "Set the price.\nSet the share.",
    durationSec: 5.5,
    layout: "class-form",
  },
  {
    image: "05-import-dialog.png",
    headline: "Excel in.",
    sub: "Drag and drop.",
    durationSec: 2,
    layout: "text-bottom-img-top",
  },
  {
    image: null,
    headline: "Every line validated.",
    sub: "Bad rows flagged — with the reason.",
    durationSec: 4,
    layout: "import-results",
  },
  {
    image: "06-copy-week-dialog.png",
    headline: "Copy a whole week.",
    sub: "One click.",
    durationSec: 2.2,
    layout: "left-text",
  },
  {
    image: null,
    headline: "Safe deletes.",
    sub: "Always confirmed.",
    durationSec: 3.6,
    layout: "delete-confirm",
  },
  {
    image: "08-teachers.png",
    headline: "Manage every teacher.",
    durationSec: 2.2,
    layout: "text-top-img-bottom",
  },
  {
    image: "11-payments.png",
    headline: "Payouts. Automatic.",
    sub: "Price × share. By teacher. By date.",
    durationSec: 2.6,
    layout: "right-text",
  },
  {
    image: "10-students.png",
    headline: "Track every student.",
    durationSec: 2,
    layout: "text-bottom-img-top",
  },
  {
    image: "12-account.png",
    headline: "THB or USD.",
    sub: "Live rate.",
    durationSec: 2,
    layout: "left-text",
  },
  {
    image: null,
    headline: "Built for\nyoga studios.",
    durationSec: 2.6,
    layout: "hero",
  },
]

const REEL_V2_TOTAL_FRAMES = SCENES.reduce(
  (acc, s) => acc + Math.round(s.durationSec * FPS),
  0,
)

// ─── Typing search scene ────────────────────────────────────
function SearchScene({ typed, durationInFrames }: { typed: string; durationInFrames: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const typeEndFrame = Math.floor(durationInFrames * 0.7)
  const charsToShow = Math.min(
    typed.length,
    Math.floor(
      interpolate(frame, [fps * 0.4, typeEndFrame], [0, typed.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  )
  const shown = typed.slice(0, charsToShow)
  const cursorOn = Math.floor(frame / 15) % 2 === 0

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 220 } })

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {Array.from({ length: typed.length }).map((_, i) => {
        const charFrame = Math.floor(
          interpolate(i, [0, typed.length], [fps * 0.4, typeEndFrame]),
        )
        return (
          <Sequence key={i} from={charFrame} durationInFrames={2} layout="none">
            <Audio src={staticFile("presentation/music/click.mp3")} volume={0.5} />
          </Sequence>
        )
      })}

      <div
        style={{
          width: "min(1500px, 90%)",
          padding: "44px 48px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 22,
          boxShadow: "0 30px 80px rgba(0,0,0,0.12)",
          transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])}) translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: ACCENT,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Yoga Center
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            minHeight: 90,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>{shown}</span>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 78,
              background: INK,
              marginLeft: 6,
              opacity: cursorOn ? 1 : 0,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Dynamic class-form scene ───────────────────────────────
interface TypedField {
  id: string
  value: string
  startSec: number
  perCharSec: number
}

function ClassFormScene({
  headline,
  durationInFrames,
}: {
  headline: string
  durationInFrames: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Sequence of field typing actions
  const FIELDS: TypedField[] = [
    { id: "name", value: "Vinyasa Flow", startSec: 0.3, perCharSec: 0.05 },
    { id: "teacher", value: "Anna Beck", startSec: 1.05, perCharSec: 0.0 },
    { id: "duration", value: "75", startSec: 1.35, perCharSec: 0.1 },
    { id: "price", value: "350", startSec: 1.75, perCharSec: 0.14 },
    { id: "share", value: "70", startSec: 2.45, perCharSec: 0.14 },
  ]

  function fieldState(f: TypedField) {
    const startFrame = Math.floor(f.startSec * fps)
    const totalChars = f.value.length
    const totalTypingFrames = Math.max(1, Math.floor(f.perCharSec * fps) * totalChars)
    const charsTyped =
      frame < startFrame
        ? 0
        : f.perCharSec === 0
          ? totalChars
          : Math.min(
              totalChars,
              Math.floor((frame - startFrame) / Math.max(1, Math.floor(f.perCharSec * fps))) + 1,
            )
    const focused =
      frame >= startFrame - 4 && frame < startFrame + totalTypingFrames + 4
    return {
      visible: charsTyped > 0 || frame >= startFrame,
      text: f.value.slice(0, charsTyped),
      focused,
      complete: charsTyped >= totalChars,
    }
  }

  const fName = fieldState(FIELDS[0])
  const fTeacher = fieldState(FIELDS[1])
  const fDuration = fieldState(FIELDS[2])
  const fPrice = fieldState(FIELDS[3])
  const fShare = fieldState(FIELDS[4])

  // Create button hover/press near the end
  const HOVER_SEC = 3.0
  const PRESS_SEC = 3.5
  const buttonHover = frame >= HOVER_SEC * fps && frame < PRESS_SEC * fps
  const buttonPress = frame >= PRESS_SEC * fps
  const buttonScale = buttonPress ? 0.96 : buttonHover ? 1.05 : 1

  const cursorOn = Math.floor(frame / 12) % 2 === 0

  // Dialog appearance
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.5 },
  })
  const dialogStyle = {
    transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])}) translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
    opacity: enter,
  } as const

  // Click sounds per character + a couple extra for dropdown/button
  const clickFrames: number[] = []
  for (const f of FIELDS) {
    const startFrame = Math.floor(f.startSec * fps)
    if (f.perCharSec === 0) {
      // single click for dropdown select
      clickFrames.push(startFrame)
    } else {
      for (let i = 0; i < f.value.length; i++) {
        clickFrames.push(startFrame + i * Math.floor(f.perCharSec * fps))
      }
    }
  }
  clickFrames.push(Math.floor(PRESS_SEC * fps))

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {clickFrames.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={2} layout="none">
          <Audio src={staticFile("presentation/music/click.mp3")} volume={0.55} />
        </Sequence>
      ))}

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px)`,
        }}
      >
        <Headline text={headline} fontSize={58} />
      </div>

      <div
        style={{
          ...dialogStyle,
          width: 740,
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 18,
          boxShadow: "0 30px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.06)",
          padding: 36,
          color: INK,
          marginTop: 100,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          New class
        </div>
        <div style={{ fontSize: 16, color: ACCENT, marginTop: 6 }}>
          Schedule a class and assign a teacher.
        </div>

        <div style={{ marginTop: 24 }}>
          <FieldLabel>Class name *</FieldLabel>
          <FieldInput
            value={fName.text}
            focused={fName.focused}
            showCursor={fName.focused && cursorOn}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <FieldLabel>Teacher / host</FieldLabel>
          <FieldInput value={fTeacher.text} focused={fTeacher.focused} select />
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <FieldLabel>Date / time *</FieldLabel>
            <FieldInput value="2026-05-15 08:00" />
          </div>
          <div>
            <FieldLabel>Duration (min)</FieldLabel>
            <FieldInput
              value={fDuration.text}
              focused={fDuration.focused}
              showCursor={fDuration.focused && cursorOn}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <FieldLabel>Price</FieldLabel>
            <FieldInput
              value={fPrice.text}
              focused={fPrice.focused}
              showCursor={fPrice.focused && cursorOn}
              suffix="฿"
            />
          </div>
          <div>
            <FieldLabel>Teacher share</FieldLabel>
            <FieldInput
              value={fShare.text}
              focused={fShare.focused}
              showCursor={fShare.focused && cursorOn}
              suffix="%"
            />
          </div>
          <div>
            <FieldLabel>Capacity</FieldLabel>
            <FieldInput value="20" />
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 15,
              fontWeight: 500,
              color: INK,
            }}
          >
            Cancel
          </div>
          <div
            style={{
              background: INK,
              color: "white",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 15,
              fontWeight: 600,
              transform: `scale(${buttonScale})`,
              boxShadow: buttonHover
                ? "0 6px 16px rgba(0,0,0,0.3)"
                : "0 2px 6px rgba(0,0,0,0.18)",
              transition: "all 0.1s ease",
            }}
          >
            Create
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: ACCENT,
        marginBottom: 6,
        fontWeight: 500,
        textTransform: "none",
      }}
    >
      {children}
    </div>
  )
}

function FieldInput({
  value,
  focused = false,
  showCursor = false,
  select = false,
  suffix,
}: {
  value: string
  focused?: boolean
  showCursor?: boolean
  select?: boolean
  suffix?: string
}) {
  return (
    <div
      style={{
        border: focused ? "2px solid #0a0a0a" : "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        padding: focused ? "11px 13px" : "12px 14px",
        background: "#fcfcfc",
        height: 46,
        boxSizing: "border-box",
        fontSize: 16,
        color: value ? INK : ACCENT,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ display: "flex", alignItems: "center" }}>
        {value || ""}
        {showCursor && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 22,
              marginLeft: 3,
              background: INK,
              borderRadius: 1,
            }}
          />
        )}
        {suffix && value && (
          <span style={{ marginLeft: 4, color: ACCENT }}>{suffix}</span>
        )}
      </span>
      {select && <span style={{ color: ACCENT, fontSize: 12 }}>▾</span>}
    </div>
  )
}

// ─── Delete confirmation scene ──────────────────────────────
function DeleteConfirmScene({
  headline,
  sub,
}: {
  headline: string
  sub?: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const RED = "#dc2626"

  // Timeline (seconds):
  //   0.0  dialog springs in
  //   1.6  Delete button hover (scale + shadow)
  //   2.4  Delete button press (scale down + click)
  //   2.7  dialog fades, row strikes through
  //   3.5  hold faded
  const HOVER_F = Math.floor(1.6 * fps)
  const PRESS_F = Math.floor(2.4 * fps)
  const FADE_F = Math.floor(2.7 * fps)

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.5 },
  })
  const dialogVisible = frame < FADE_F
  const dialogExit = interpolate(frame, [FADE_F, FADE_F + fps * 0.4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const buttonHover = frame >= HOVER_F && frame < PRESS_F
  const buttonPress = frame >= PRESS_F && frame < PRESS_F + fps * 0.2
  const buttonScale = buttonPress ? 0.94 : buttonHover ? 1.06 : 1

  const rowStrike = interpolate(frame, [FADE_F, FADE_F + fps * 0.5], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const rowOpacity = interpolate(frame, [FADE_F + fps * 0.3, FADE_F + fps * 0.8], [1, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Click sound on Delete press */}
      <Sequence from={PRESS_F} durationInFrames={2} layout="none">
        <Audio src={staticFile("presentation/music/click.mp3")} volume={0.6} />
      </Sequence>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px)`,
        }}
      >
        <Headline text={headline} fontSize={64} />
        {sub && <SubLine text={sub} fontSize={32} />}
      </div>

      {/* Table behind the dialog */}
      <div
        style={{
          width: 820,
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 14,
          padding: 0,
          overflow: "hidden",
          marginTop: 130,
          boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
          filter: dialogVisible ? "blur(2px)" : "none",
          opacity: dialogVisible ? 0.65 : 1,
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.6fr 1fr 0.6fr",
            background: "#f5f5f4",
            padding: "12px 22px",
            fontSize: 12,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {[
          { name: "Anna Beck", email: "anna@phanganyoga.com", target: true },
          { name: "Luca Rossi", email: "luca@phanganyoga.com" },
          { name: "Putu Surya", email: "putu@phanganyoga.com" },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.6fr 1fr 0.6fr",
              padding: "16px 22px",
              borderTop: "1px solid #f0f0ef",
              fontSize: 15,
              color: INK,
              alignItems: "center",
              position: "relative",
              opacity: row.target ? rowOpacity : 1,
              textDecoration: row.target && rowStrike > 0 ? "line-through" : "none",
              textDecorationThickness: 2,
              textDecorationColor: row.target ? RED : "transparent",
            }}
          >
            <div style={{ fontWeight: 500 }}>{row.name}</div>
            <div style={{ color: ACCENT }}>{row.email}</div>
            <div>
              <span
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "#059669",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Active
              </span>
            </div>
            <div style={{ textAlign: "right", color: ACCENT, fontSize: 14 }}>
              ✎ &nbsp; <span style={{ color: RED }}>🗑</span>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 30px)",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(enter, [0, 1], [0.9, 1])}) translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          opacity: enter * dialogExit,
          width: 480,
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          padding: 28,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>
          Confirm delete
        </div>
        <div style={{ fontSize: 15, color: ACCENT, marginTop: 8, lineHeight: 1.45 }}>
          Delete &quot;Anna Beck&quot;? Classes will keep but lose teacher.
        </div>
        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              color: INK,
            }}
          >
            Cancel
          </div>
          <div
            style={{
              background: RED,
              color: "white",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              transform: `scale(${buttonScale})`,
              boxShadow: buttonHover
                ? `0 8px 20px ${RED}55`
                : "0 2px 6px rgba(0,0,0,0.15)",
              transition: "all 0.1s ease",
            }}
          >
            Delete
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Import results scene ───────────────────────────────────
interface ImportRow {
  line: number
  ok: boolean
  detail: string
}

const IMPORT_RESULTS: ImportRow[] = [
  { line: 2, ok: true, detail: "Vinyasa Flow · 2026-05-18 08:00 · anna@phanganyoga.com" },
  { line: 3, ok: true, detail: "Yin Restorative · 2026-05-19 17:00 · anna@phanganyoga.com" },
  { line: 4, ok: false, detail: "Teacher email \"bob@x.com\" not found" },
  { line: 5, ok: true, detail: "Ashtanga Mysore · 2026-05-20 07:00 · luca@phanganyoga.com" },
  { line: 6, ok: false, detail: "Invalid date/time \"2026-13-99 10:00\"" },
  { line: 7, ok: true, detail: "Hatha Morning · 2026-05-21 07:00 · putu@phanganyoga.com" },
  { line: 8, ok: true, detail: "Pranayama · 2026-05-22 18:00 · putu@phanganyoga.com" },
]

function ImportResultsScene({ headline, sub }: { headline: string; sub?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const GREEN = "#059669"
  const RED = "#dc2626"

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 220 } })

  // Stagger rows in
  const ROW_START = 0.15
  const ROW_STAGGER = 0.1

  const imported = IMPORT_RESULTS.filter((r) => r.ok).length
  const failed = IMPORT_RESULTS.length - imported

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px)`,
        }}
      >
        <Headline text={headline} fontSize={58} />
        {sub && <SubLine text={sub} fontSize={28} />}
      </div>

      <div
        style={{
          width: 900,
          marginTop: 150,
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        }}
      >
        {/* Summary chips */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "20px 24px",
            borderBottom: "1px solid #f0f0ef",
          }}
        >
          <SummaryChip
            color={GREEN}
            bg="rgba(16,185,129,0.12)"
            label={`${imported} imported`}
            icon="✓"
          />
          <SummaryChip
            color={RED}
            bg="rgba(220,38,38,0.12)"
            label={`${failed} failed`}
            icon="✕"
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 110px 1fr",
            padding: "12px 24px",
            background: "#fafafa",
            fontSize: 11,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            fontWeight: 600,
          }}
        >
          <div>Line</div>
          <div>Status</div>
          <div>Details</div>
        </div>

        {/* Rows with stagger */}
        {IMPORT_RESULTS.map((r, i) => {
          const rowDelay = (ROW_START + i * ROW_STAGGER) * fps
          const rowEnter = spring({
            frame: Math.max(0, frame - rowDelay),
            fps,
            config: { damping: 12, stiffness: 260 },
          })
          return (
            <div
              key={r.line}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 110px 1fr",
                padding: "13px 24px",
                borderTop: "1px solid #f0f0ef",
                alignItems: "center",
                fontSize: 14,
                opacity: rowEnter,
                transform: `translateX(${interpolate(rowEnter, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div style={{ color: ACCENT }}>{r.line}</div>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: r.ok ? "rgba(16,185,129,0.12)" : "rgba(220,38,38,0.12)",
                    color: r.ok ? GREEN : RED,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span>{r.ok ? "✓" : "✕"}</span>
                  {r.ok ? "OK" : "Failed"}
                </span>
              </div>
              <div
                style={{
                  color: r.ok ? INK : RED,
                  fontWeight: r.ok ? 400 : 500,
                }}
              >
                {r.detail}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function SummaryChip({
  color,
  bg,
  label,
  icon,
}: {
  color: string
  bg: string
  label: string
  icon: string
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color,
        padding: "7px 14px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid ${color}33`,
      }}
    >
      <span>{icon}</span>
      {label}
    </div>
  )
}

// ─── Generic scene ───────────────────────────────────────────
function SceneView({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  if (scene.layout === "search" && scene.typed) {
    return <SearchScene typed={scene.typed} durationInFrames={durationInFrames} />
  }

  if (scene.layout === "class-form") {
    return (
      <ClassFormScene
        headline={scene.headline}
        durationInFrames={durationInFrames}
      />
    )
  }

  if (scene.layout === "delete-confirm") {
    return <DeleteConfirmScene headline={scene.headline} sub={scene.sub} />
  }

  if (scene.layout === "import-results") {
    return <ImportResultsScene headline={scene.headline} sub={scene.sub} />
  }

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.5 },
  })
  const exit = interpolate(
    frame,
    [durationInFrames - fps * 0.25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )
  const opacity = Math.min(enter, exit)
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
            transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px)`,
          }}
        >
          <Headline text={scene.headline} fontSize={140} />
          {scene.sub && <SubLine text={scene.sub} fontSize={44} />}
        </div>
      </AbsoluteFill>
    )
  }

  if (scene.layout === "text-top-img-bottom") {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 100px",
          gap: 32,
          opacity,
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${interpolate(enter, [0, 1], [-60, 0])}px)`,
          }}
        >
          <Headline text={scene.headline} fontSize={88} />
          {scene.sub && <SubLine text={scene.sub} fontSize={32} />}
        </div>
        <ScreenshotFrame
          image={scene.image}
          scale={scale * interpolate(enter, [0, 1], [0.94, 1])}
          translateY={interpolate(enter, [0, 1], [60, 0])}
        />
      </AbsoluteFill>
    )
  }

  if (scene.layout === "text-bottom-img-top") {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 100px",
          gap: 32,
          opacity,
        }}
      >
        <ScreenshotFrame
          image={scene.image}
          scale={scale * interpolate(enter, [0, 1], [0.94, 1])}
          translateY={interpolate(enter, [0, 1], [-60, 0])}
        />
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px)`,
          }}
        >
          <Headline text={scene.headline} fontSize={88} />
          {scene.sub && <SubLine text={scene.sub} fontSize={32} />}
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
      <div
        style={{
          flex: "0 0 38%",
          order: textOnLeft ? 0 : 1,
          transform: `translateX(${textOnLeft ? interpolate(enter, [0, 1], [-80, 0]) : interpolate(enter, [0, 1], [80, 0])}px)`,
        }}
      >
        <Headline text={scene.headline} fontSize={92} />
        {scene.sub && <SubLine text={scene.sub} fontSize={34} />}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: textOnLeft ? "flex-start" : "flex-end",
          order: textOnLeft ? 1 : 0,
        }}
      >
        <ScreenshotFrame
          image={scene.image}
          scale={scale * interpolate(enter, [0, 1], [0.94, 1])}
        />
      </div>
    </AbsoluteFill>
  )
}

function ScreenshotFrame({
  image,
  scale,
  translateY = 0,
}: {
  image: string
  scale: number
  translateY?: number
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)",
        transform: `scale(${scale}) translateY(${translateY}px)`,
        maxWidth: 1200,
        width: "100%",
        background: "white",
      }}
    >
      <Img
        src={staticFile(`presentation/${image}`)}
        style={{ width: "100%", display: "block" }}
      />
    </div>
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
        margin: "18px 0 0",
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

interface ReelV2Props {
  /** Path under public/ — e.g. "presentation/music/library/02-inspired-cinematic.mp3" */
  musicSrc: string
  musicVolume?: number
}

export const ReelV2: React.FC<ReelV2Props> = ({
  musicSrc,
  musicVolume = 0.55,
}) => {
  let cursor = 0
  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily: "Outfit, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile(musicSrc)} volume={musicVolume} />

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

export const REEL_V2_FPS = FPS
export { REEL_V2_TOTAL_FRAMES }
