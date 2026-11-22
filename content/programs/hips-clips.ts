// Demo clip for each Open Hips exercise, keyed by the exercise slug (the
// exercise name in kebab-case, e.g. "90/90 Extension" -> "90-90-extension").
// The same slugs are used in assets/glossary/hips-queue.json.
//
// Add a line when a clip is finished and uploaded, e.g.
//   "lunge-pulse": "/programs/hips/clips/lunge-pulse.mp4",
// or a full https:// URL (Bunny). Exercises without a line show "Video
// coming soon" on the program page.
export const HIPS_CLIPS: Record<string, string> = {
  "lunge-pulse": "/programs/hips/clips/lunge-pulse.mp4",
  "single-leg-rdl": "/programs/hips/clips/single-leg-rdl.mp4",
  "butterfly-stretch": "/programs/hips/clips/butterfly-stretch.mp4",
  "hip-flexor-lunge": "/programs/hips/clips/hip-flexor-lunge.mp4",
  "hamstring-kick": "/programs/hips/clips/hamstring-kick.mp4",
}

export function exerciseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
