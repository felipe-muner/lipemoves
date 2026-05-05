import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  staticFile,
} from "remotion";

const FPS = 30;

export type KenBurnsProps = {
  file: string;
  durationSecs: number;
  zoom: "in" | "out";
  panX: number;
  panY: number;
};

export const makeFrames = (secs: number) => Math.round(secs * FPS);

export const KenBurnsClip = ({ file, durationSecs, zoom, panX, panY }: KenBurnsProps) => {
  const frame = useCurrentFrame();
  const totalFrames = makeFrames(durationSecs);

  const scale = interpolate(
    frame,
    [0, totalFrames],
    zoom === "in" ? [1.0, 1.35] : [1.35, 1.15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const tx = interpolate(frame, [0, totalFrames], [0, panX], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const ty = interpolate(frame, [0, totalFrames], [0, panY], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={staticFile(file)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
