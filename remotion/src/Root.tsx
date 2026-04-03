import { Composition } from "remotion";
import { ShoulderIntro } from "./Intro";

export const RemotionRoot = () => {
  return (
    <Composition
      id="ShoulderIntro"
      component={ShoulderIntro}
      durationInFrames={90} // 3 seconds at 30fps
      fps={30}
      width={1080}
      height={1920} // Portrait 9:16 for Reels/TikTok
    />
  );
};
