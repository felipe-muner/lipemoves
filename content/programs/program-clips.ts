// Demo clips for the area programs (everything except Open Hips, which keeps
// its own map in ./hips-clips.ts). Keyed by program slug, then by exercise
// slug (exerciseSlug in ./hips-clips). The queues that produce these clips
// are assets/glossary/<program>-queue.json.
//
// Add a line when a clip is finished, e.g.
//   shoulders: { "wall-slide": "/programs/shoulders/clips/wall-slide.mp4" },
export const PROGRAM_CLIPS: Record<string, Record<string, string>> = {
  shoulders: {},
  wrists: {},
  core: {},
  back: {},
  legs: {},
  knees: {},
  ankles: {},
}
