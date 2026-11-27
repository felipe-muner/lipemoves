// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Ankles & Feet. 12 exercises; clip queue in assets/glossary/ankles-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const ankles: Program = {
  slug: "ankles",
  title: "Mobile Ankles",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Ankle Circles", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Calf Raises", sets: 2, reps: 10 },
        { n: 3, name: "Wall Calf Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Tibialis Raises", sets: 2, reps: 10 },
        { n: 2, name: "Knee to Wall Rocks", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Calf Raises", sets: 2, reps: 10 },
        { n: 4, name: "Wall Calf Stretch", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Ankle Circles", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Tibialis Raises", sets: 2, reps: 10 },
        { n: 3, name: "Knee to Wall Rocks", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Single Leg Calf Raise", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Knee to Wall Rocks", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Down Dog Calf Stretch", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Bent Knee Calf Raise", sets: 2, reps: 10 },
        { n: 2, name: "Tibialis Raises", sets: 2, reps: 10 },
        { n: 3, name: "Ankle Circles", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Wall Calf Stretch", sets: 2, time: "40s Each Side" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Single Leg Calf Raise", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Bent Knee Calf Raise", sets: 2, reps: 10 },
        { n: 3, name: "Knee to Wall Rocks", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Down Dog Calf Stretch", sets: 2, time: "40s Each Side" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Deep Squat Ankle Rocks", sets: 2, reps: 12 },
        { n: 2, name: "Single Leg Calf Raise", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Tibialis Raises", sets: 2, reps: 12 },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Bent Knee Calf Raise", sets: 2, reps: 12 },
        { n: 2, name: "Knee to Wall Rocks", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Wall Calf Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Down Dog Calf Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Deep Squat Ankle Rocks", sets: 2, reps: 12 },
        { n: 2, name: "Tibialis Raises", sets: 2, reps: 12 },
        { n: 3, name: "Single Leg Calf Raise", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Eccentric Calf Lowers", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Deep Squat Ankle Rocks", sets: 2, reps: 12 },
        { n: 3, name: "Tibialis Raises", sets: 2, reps: 15 },
        { n: 4, name: "Kneeling Shin Stretch", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Deep Squat Calf Raises", sets: 2, reps: 12 },
        { n: 2, name: "Knee to Wall Rocks", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Bent Knee Calf Raise", sets: 2, reps: 12 },
        { n: 4, name: "Down Dog Calf Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Eccentric Calf Lowers", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Deep Squat Calf Raises", sets: 2, reps: 12 },
        { n: 3, name: "Deep Squat Ankle Rocks", sets: 2, reps: 12 },
        { n: 4, name: "Wall Calf Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const ANKLES_DETAILS: Record<string, ExerciseDetail> = {
  "ankle-circles": {
    targets: ["Ankles", "Shins", "Calves"],
    cues: ["Keep the leg still; only the foot moves.", "Draw the biggest, slowest circles you can."],
  },
  "calf-raises": {
    targets: ["Calves", "Ankles"],
    cues: ["Fingertips on the wall, legs straight.", "Rise as high as you can, then lower slowly."],
  },
  "wall-calf-stretch": {
    targets: ["Calves", "Achilles"],
    cues: ["Back leg straight, heel down.", "Lean the hips toward the wall until the calf stretches."],
  },
  "kneeling-shin-stretch": {
    targets: ["Shins", "Top of the feet"],
    cues: ["Sit on your heels, tops of the feet flat.", "Lean back on your hands and lift the knees slightly."],
  },
  "tibialis-raises": {
    targets: ["Shins", "Ankles"],
    cues: ["Lean on the wall, feet out in front.", "Pull the toes up hard, then lower slowly."],
  },
  "knee-to-wall-rocks": {
    targets: ["Ankle bend", "Calves"],
    cues: ["Heel glued down.", "Push the knee forward to the wall over the middle toes."],
  },
  "single-leg-calf-raise": {
    targets: ["Calves", "Ankle stability"],
    cues: ["Fingertips on the wall, stand on one foot.", "Rise all the way up, then lower slowly."],
  },
  "down-dog-calf-stretch": {
    targets: ["Calves", "Hamstrings"],
    cues: ["Hips high, back long.", "Press one heel down with the leg straight."],
  },
  "bent-knee-calf-raise": {
    targets: ["Soleus", "Achilles"],
    cues: ["Knees bent and they stay bent.", "Rise onto the balls of the feet, then lower slowly."],
  },
  "deep-squat-ankle-rocks": {
    targets: ["Ankles", "Calves"],
    cues: ["Heels down in a deep squat.", "Rock the knees forward past the toes, then back."],
  },
  "eccentric-calf-lowers": {
    targets: ["Calves", "Achilles"],
    cues: ["Ball of the foot on the edge, heel free.", "Take about four seconds to lower the heel."],
  },
  "deep-squat-calf-raises": {
    targets: ["Calves", "Ankles", "Feet"],
    cues: ["Stay low in the squat.", "Lift the heels high, then lower them slowly."],
  },
}
