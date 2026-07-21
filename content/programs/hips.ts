// Workout-program content for the "WEEK X DAY Y" PDF format.
// Each exercise's play button links to a YouTube Short. Fill in `youtube`
// with the Short URL once each clip is filmed & uploaded, e.g.
//   youtube: "https://youtube.com/shorts/31-Q548bMFM"
// Leave it as "" (or omit) and the play button renders but stays unlinked.
//
// Photos live in /public/programs/<slug>/<photo>. Leave `photo` empty until
// the file exists — the card then renders a clean grey "Photo" placeholder
// instead of a broken image. Kebab-case the exercise name for the filename,
// e.g. "Deep Split Squat" -> deep-split-squat.jpg
//
// Progression (better than a flat 4 weeks of the same dose):
//   Week 1  GROOVE   2 sets · 30s holds · learn the positions
//   Week 2  OPEN     2 sets · 40s holds · add range + unilateral work
//   Week 3  END RANGE 2 sets · 45s holds · isometrics, deeper positions
//   Week 4  OWN IT   2 sets · 60s holds · peak end-range + split negatives

export type Exercise = {
  n: number
  name: string
  sets: number
  // Provide EITHER reps OR time (a display label like "30 Seconds").
  // reps accepts a string for unilateral work, e.g. "10 Each Side".
  reps?: number | string
  time?: string
  photo?: string
  youtube?: string
}

export type WorkoutDay = {
  week: number
  day: number
  warmupYoutube?: string
  exercises: Exercise[]
}

export type Program = {
  slug: string
  title: string
  brand: string
  days: WorkoutDay[]
}

export const hips: Program = {
  slug: "hips",
  title: "Open Hips",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Single Leg RDL", sets: 2, reps: 10 },
        { n: 2, name: "Lunge Pulse", sets: 2, reps: 10 },
        { n: 3, name: "Pigeon Stretch", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Butterfly Stretch", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Standing Pancake Good Morning", sets: 2, reps: 10 },
        { n: 2, name: "90/90 Extension", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Hip Flexor Lunge", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Hamstring Lunge", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Hamstring Kick", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Deep Split Squat", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Frog Rock", sets: 2, reps: 10 },
        { n: 4, name: "Butterfly Stretch", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "90/90 Switch", sets: 2, reps: 10 },
        { n: 2, name: "Cossack Switch", sets: 2, reps: 10 },
        { n: 3, name: "Pigeon Stretch", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Pancake Stretch", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Hamstring Kick", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Deep Split Squat", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Pigeon Good Morning", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Couch Stretch", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Crossbody Leg Swings", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Donkey Kicks", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Figure Four Stretch", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Flat Back Hamstring Stretch", sets: 2, time: "40 Seconds" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "90/90 Switch", sets: 2, reps: 12 },
        { n: 2, name: "Cossack Switch", sets: 2, reps: 12 },
        { n: 3, name: "Lunge Quad Stretch", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Flat Back Hamstring Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Wall Deep Squat", sets: 2, time: "45 Seconds" },
        { n: 2, name: "90/90 Iso", sets: 2, time: "30s Each Side" },
        { n: 3, name: "Standing Pancake", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Couch Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Hamstring Kick", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Deep Split Squat", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Pigeon Good Morning", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Frog Stretch", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Wall Deep Squat", sets: 2, time: "60 Seconds" },
        { n: 2, name: "90/90 Iso", sets: 2, time: "30s Each Side" },
        { n: 3, name: "Standing Pancake", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Couch Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Cossack Switch", sets: 2, reps: 12 },
        { n: 2, name: "90/90 Switch", sets: 2, reps: 12 },
        { n: 3, name: "Pancake Stretch", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Pigeon Stretch", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Deep Split Squat", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Elevated Pigeon", sets: 2, time: "45s Each Side" },
        { n: 3, name: "Seated Pancake Reach", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Middle Split Negatives", sets: 2, time: "45 Seconds" },
      ],
    },
  ],
}
