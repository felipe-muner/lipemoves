import { Composition } from "remotion";
import { ShoulderIntro } from "./Intro";
import { KenBurnsClip, makeFrames } from "./KenBurnsReel";
import { Presentation } from "./Slide";
import { Reel, REEL_FPS, REEL_TOTAL_FRAMES } from "./Reel";
import { ReelV2, REEL_V2_FPS, REEL_V2_TOTAL_FRAMES } from "./ReelV2";
import { slides as presentationSlides } from "../../scripts/presentation/slides";
import durations from "../../public/presentation/audio/durations.json";

const PRESENTATION_FPS = 30;
const PRESENTATION_GAP_SEC = 0.5;

const slidesWithDurations = presentationSlides.map((s) => {
  const audioSec = (durations as Record<string, number>)[s.id] ?? 5;
  const totalSec = audioSec + PRESENTATION_GAP_SEC;
  const hasImage = !s.id.endsWith("-intro") && !s.id.endsWith("-outro");
  return {
    id: s.id,
    title: s.title,
    imageFile: hasImage ? `${s.id}.png` : null,
    durationInFrames: Math.ceil(totalSec * PRESENTATION_FPS),
  };
});

const PRESENTATION_TOTAL_FRAMES = slidesWithDurations.reduce(
  (acc, s) => acc + s.durationInFrames,
  0,
);

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
        id="Reel"
        component={Reel}
        durationInFrames={REEL_TOTAL_FRAMES}
        fps={REEL_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ReelV2"
        component={ReelV2}
        durationInFrames={REEL_V2_TOTAL_FRAMES}
        fps={REEL_V2_FPS}
        width={1920}
        height={1080}
        defaultProps={{ musicSrc: "presentation/music/track-energetic.mp3", musicVolume: 0.55 }}
      />
      {[
        { id: "ReelV2-01-Calm", file: "01-calm-uplifting.mp3" },
        { id: "ReelV2-02-Inspired", file: "02-inspired-cinematic.mp3" },
        { id: "ReelV2-03-Carefree", file: "03-carefree-bouncy.mp3" },
        { id: "ReelV2-04-Pixelland", file: "04-pixelland-chiptune.mp3" },
        { id: "ReelV2-05-Wholesome", file: "05-wholesome-mellow.mp3" },
      ].map((variant) => (
        <Composition
          key={variant.id}
          id={variant.id}
          component={ReelV2}
          durationInFrames={REEL_V2_TOTAL_FRAMES}
          fps={REEL_V2_FPS}
          width={1920}
          height={1080}
          defaultProps={{
            musicSrc: `presentation/music/library/${variant.file}`,
            musicVolume: 0.55,
          }}
        />
      ))}
      <Composition
        id="Presentation"
        component={Presentation}
        durationInFrames={PRESENTATION_TOTAL_FRAMES}
        fps={PRESENTATION_FPS}
        width={1920}
        height={1080}
        defaultProps={{ slides: slidesWithDurations, audioDir: "audio" }}
      />
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
