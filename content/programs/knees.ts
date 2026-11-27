// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Knees. 12 exercises; clip queue in assets/glossary/knees-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const knees: Program = {
  slug: "knees",
  title: "Strong Knees",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Heel Slides", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Clamshells", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Wall Sit", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Prone Hamstring Curl", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Box Step-Up", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Clamshells", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Heel Slides", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Box Step-Up", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Wall Sit", sets: 2, time: "35 Seconds" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "30s Each Side" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Single Leg Glute Bridge", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Box Step-Down", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Wall Sit", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "40s Each Side" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Heels-Elevated Squat", sets: 2, reps: 10 },
        { n: 2, name: "Prone Hamstring Curl", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Clamshells", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Box Step-Down", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Box Step-Up", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Single Leg Glute Bridge", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "40s Each Side" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Reverse Lunge", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Heels-Elevated Squat", sets: 2, reps: 12 },
        { n: 3, name: "Split Squat Hold", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Box Step-Down", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Single Leg Glute Bridge", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Clamshells", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Reverse Lunge", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Prone Hamstring Curl", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Split Squat Hold", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Single Leg Box Squat", sets: 2, reps: "8 Each Side" },
        { n: 2, name: "Heels-Elevated Squat", sets: 2, reps: 12 },
        { n: 3, name: "Split Squat Hold", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Reverse Lunge", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Box Step-Down", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Single Leg Glute Bridge", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Side-Lying Quad Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Single Leg Box Squat", sets: 2, reps: "8 Each Side" },
        { n: 2, name: "Heels-Elevated Squat", sets: 2, reps: 12 },
        { n: 3, name: "Split Squat Hold", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Wall Sit", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const KNEES_DETAILS: Record<string, ExerciseDetail> = {
  "heel-slides": {
    targets: ["Knee bend", "Hamstrings"],
    cues: ["Heel stays on the floor.", "Slide it in as far as is comfortable, then all the way out."],
  },
  "clamshells": {
    targets: ["Outer hip", "Glutes"],
    cues: ["Heels together, hips stacked.", "Open the top knee without rolling the hips back."],
  },
  "wall-sit": {
    targets: ["Quads"],
    cues: ["Back flat on the wall, knees over the ankles.", "Push the floor away and breathe."],
  },
  "side-lying-quad-stretch": {
    targets: ["Quads", "Hip flexors"],
    cues: ["Knees side by side.", "Draw the heel to the glute and push the hip forward."],
  },
  "prone-hamstring-curl": {
    targets: ["Hamstrings", "Knee control"],
    cues: ["Hips pressed into the floor.", "Curl the heel up, then lower it slowly."],
  },
  "box-step-up": {
    targets: ["Quads", "Glutes"],
    cues: ["Whole foot on the box.", "Drive through the front heel and lower slowly."],
  },
  "single-leg-glute-bridge": {
    targets: ["Glutes", "Hamstrings"],
    cues: ["One foot flat, the other leg long in the air.", "Push through the heel and keep the hips level."],
  },
  "box-step-down": {
    targets: ["Quads", "Knee control"],
    cues: ["Knee tracks over the middle toes.", "Lower slowly, tap the heel, stand up."],
  },
  "heels-elevated-squat": {
    targets: ["Quads", "Knees"],
    cues: ["Heels raised, chest tall.", "Let the knees travel forward over the toes as you sink."],
  },
  "reverse-lunge": {
    targets: ["Quads", "Glutes"],
    cues: ["Step back long, chest tall.", "Push through the front heel to come back up."],
  },
  "split-squat-hold": {
    targets: ["Quads", "Glutes"],
    cues: ["Front thigh parallel, back knee just off the floor.", "Stay tall and keep the front knee over the toes."],
  },
  "single-leg-box-squat": {
    targets: ["Quads", "Glutes", "Knee control"],
    cues: ["Arms forward for balance.", "Sit back slowly to touch the box, then stand on one leg."],
  },
}
