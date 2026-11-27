// Felipe's own filmed demo for each exercise, shown next to the mannequin
// "muscle map" clip (hips-clips.ts / program-clips.ts). Keyed by program slug,
// then by exercise slug (exerciseSlug in ./hips-clips).
//
// Files go to public/programs/<program>/coach/<exercise-slug>.mp4. Add a line
// when a video is ready, e.g.
//   hips: { "pigeon-stretch": "/programs/hips/coach/pigeon-stretch.mp4" },
export const COACH_CLIPS: Record<string, Record<string, string>> = {
  hips: {},
  shoulders: {},
  wrists: {},
  core: {},
  back: {},
  legs: {},
  knees: {},
  ankles: {},
}
