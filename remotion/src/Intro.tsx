import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const ShoulderIntro = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Timing (at 30fps)
  const blurRevealEnd = fps * 2;         // 0-2s: blur clears
  const textFadeInEnd = fps * 0.8;       // 0-0.8s: text fades in
  const textHoldEnd = fps * 2;           // text holds until 2s
  const textFadeOutEnd = fps * 2.8;      // 2-2.8s: text fades out

  // Blur: from 20px → 0px
  const blur = interpolate(frame, [0, blurRevealEnd], [20, 0], {
    extrapolateRight: "clamp",
  });

  // Brightness: starts a bit darker, goes to normal as blur clears
  const brightness = interpolate(frame, [0, blurRevealEnd], [0.7, 1], {
    extrapolateRight: "clamp",
  });

  // Text opacity: fade in → hold → fade out
  const textOpacity = interpolate(
    frame,
    [0, textFadeInEnd, textHoldEnd, textFadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // Text slide up slightly as it fades in
  const textY = interpolate(frame, [0, textFadeInEnd], [20, 0], {
    extrapolateRight: "clamp",
  });

  // Handles fade in slightly after main text
  const handlesOpacity = interpolate(
    frame,
    [fps * 0.4, fps * 1.2, textHoldEnd, textFadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background gradient overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)",
          filter: `blur(${blur}px) brightness(${brightness})`,
        }}
      />

      {/* Glass card */}
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          padding: "48px 64px",
          background: "rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
        }}
      >
        {/* Top label */}
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            margin: 0,
            fontWeight: 400,
          }}
        >
          with Felipe Muner
        </p>

        {/* Main title */}
        <h1
          style={{
            color: "#fff",
            fontSize: 72,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.1,
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Shoulder
          <br />
          <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 300 }}>
            Opening
          </span>
        </h1>

        {/* Divider */}
        <div
          style={{
            width: 48,
            height: 1,
            background: "rgba(255,255,255,0.25)",
          }}
        />

        {/* Social handles */}
        <div
          style={{
            opacity: handlesOpacity,
            display: "flex",
            gap: 32,
            alignItems: "center",
          }}
        >
          {[
            { icon: "▶", handle: "@lipemoves" },
            { icon: "◈", handle: "@lipemoves" },
            { icon: "♪", handle: "@lipemoves" },
          ].map(({ icon, handle }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(255,255,255,0.6)",
                fontSize: 20,
              }}
            >
              <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
              <span style={{ fontWeight: 500, letterSpacing: 0.5 }}>
                {handle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
