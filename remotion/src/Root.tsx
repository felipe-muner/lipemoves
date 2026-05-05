import { Composition } from "remotion";
import { ShoulderIntro } from "./Intro";
import { KenBurnsClip, makeFrames } from "./KenBurnsReel";

const CLIPS = [
  { id: "KB-Pose1", file: "poses/pose1.mp4", durationSecs: 10.03, zoom: "in"  as const, panX: -6, panY: 4  },
  { id: "KB-Pose2", file: "poses/pose2.mp4", durationSecs: 4.54,  zoom: "out" as const, panX: 6,  panY: -4 },
  { id: "KB-Pose3", file: "poses/pose3.mp4", durationSecs: 10.17, zoom: "in"  as const, panX: -5, panY: 5  },
  { id: "KB-Clip1", file: "poses/clip1.mp4", durationSecs: 1.79,  zoom: "in"  as const, panX: -4, panY: 3  },
  { id: "KB-Clip2", file: "poses/clip2.mp4", durationSecs: 5.44,  zoom: "out" as const, panX: 5,  panY: -3 },
  { id: "KB-Clip3", file: "poses/clip3.mp4", durationSecs: 6.44,  zoom: "in"  as const, panX: -5, panY: 4  },
  { id: "KB-Clip4", file: "poses/clip4.mp4", durationSecs: 4.65,  zoom: "out" as const, panX: 6,  panY: -4 },
  { id: "KB-Clip5", file: "poses/clip5.mp4", durationSecs: 3.37,  zoom: "in"  as const, panX: -4, panY: 3  },
  { id: "KB-Clip6", file: "poses/clip6.mp4", durationSecs: 4.80,  zoom: "out" as const, panX: 5,  panY: -3 },
  { id: "KB-Clip7", file: "poses/clip7.mp4", durationSecs: 10.69, zoom: "in"  as const, panX: -6, panY: 4  },
  { id: "KB-Clip8", file: "poses/clip8.mp4", durationSecs: 9.70,  zoom: "out" as const, panX: 6,  panY: -5 },
];

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ShoulderIntro"
        component={ShoulderIntro}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
      />
      {CLIPS.map((clip) => (
        <Composition
          key={clip.id}
          id={clip.id}
          component={KenBurnsClip}
          durationInFrames={makeFrames(clip.durationSecs)}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={clip}
        />
      ))}
    </>
  );
};
