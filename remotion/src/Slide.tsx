import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

interface Props {
  id: string
  title: string
  imageFile: string | null
  audioDir: string
}

export const Slide: React.FC<Props> = ({ id, title, imageFile, audioDir }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Fade in title at start, fade out near end
  const titleOpacity = interpolate(
    frame,
    [0, fps * 0.6, durationInFrames - fps * 0.6, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )

  // Ken Burns zoom on the screenshot — slow zoom-in
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateRight: "clamp",
  })

  const imageOpacity = interpolate(
    frame,
    [0, fps * 0.4, durationInFrames - fps * 0.4, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )

  const isTextOnly = imageFile === null

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", color: "#fafafa", fontFamily: "Outfit, -apple-system, sans-serif" }}>
      <Audio src={staticFile(`presentation/${audioDir}/${id}.mp3`)} />

      {isTextOnly ? (
        // Hero text slide (intro / outro)
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${interpolate(frame, [0, fps * 0.6], [20, 0], {
                extrapolateRight: "clamp",
              })}px)`,
            }}
          >
            <div
              style={{
                fontSize: 24,
                letterSpacing: 12,
                textTransform: "uppercase",
                opacity: 0.5,
                marginBottom: 32,
              }}
            >
              Yoga Center
            </div>
            <div
              style={{
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1.05,
                maxWidth: 1400,
                margin: "0 auto",
              }}
            >
              {title}
            </div>
          </div>
        </AbsoluteFill>
      ) : (
        <>
          {/* Screenshot */}
          <AbsoluteFill
            style={{
              padding: 80,
              paddingTop: 200,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                opacity: imageOpacity,
                transform: `scale(${zoom})`,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                width: "100%",
                maxWidth: 1600,
              }}
            >
              <Img
                src={staticFile(`presentation/${imageFile}`)}
                style={{ width: "100%", display: "block" }}
              />
            </div>
          </AbsoluteFill>

          {/* Title bar */}
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "flex-start",
              padding: 60,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                opacity: titleOpacity,
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1,
                textAlign: "center",
              }}
            >
              {title}
            </div>
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  )
}

interface SeqProps {
  slides?: Array<{ id: string; title: string; imageFile: string | null; durationInFrames: number }>
  audioDir?: string
}

export const Presentation: React.FC<SeqProps> = ({ slides = [], audioDir = "audio" }) => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <RemotionSequence slides={slides} audioDir={audioDir} />
    </AbsoluteFill>
  )
}

import { Sequence } from "remotion"

const RemotionSequence: React.FC<SeqProps> = ({ slides = [], audioDir = "audio" }) => {
  let cursor = 0
  return (
    <>
      {slides.map((s) => {
        const from = cursor
        cursor += s.durationInFrames
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.durationInFrames}>
            <Slide id={s.id} title={s.title} imageFile={s.imageFile} audioDir={audioDir} />
          </Sequence>
        )
      })}
    </>
  )
}
