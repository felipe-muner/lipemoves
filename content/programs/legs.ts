// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Hamstrings & Legs. 12 exercises; clip queue in assets/glossary/legs-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const legs: Program = {
  slug: "legs",
  title: "Long Hamstrings",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Good Morning", sets: 2, reps: 10 },
        { n: 2, name: "Straight Leg Raise", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Seated Forward Fold", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Supine Hamstring Stretch", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Hamstring Bridge", sets: 2, reps: 10 },
        { n: 2, name: "Good Morning", sets: 2, reps: 10 },
        { n: 3, name: "Standing Quad Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Seated Forward Fold", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Straight Leg Raise", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Hamstring Bridge", sets: 2, reps: 10 },
        { n: 3, name: "Supine Hamstring Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Seated Forward Fold", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Kettlebell Romanian Deadlift", sets: 2, reps: 10 },
        { n: 2, name: "Half Split Rocks", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Seated Forward Fold", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Standing Quad Stretch", sets: 2, time: "40s Each Side" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Good Morning", sets: 2, reps: 10 },
        { n: 2, name: "Straight Leg Raise", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Elevated Hamstring Stretch", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Supine Hamstring Stretch", sets: 2, time: "40s Each Side" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Kettlebell Romanian Deadlift", sets: 2, reps: 10 },
        { n: 2, name: "Hamstring Bridge", sets: 2, reps: 10 },
        { n: 3, name: "Half Split Rocks", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Seated Forward Fold", sets: 2, time: "40 Seconds" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Single Leg Hamstring Bridge", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Kettlebell Romanian Deadlift", sets: 2, reps: 12 },
        { n: 3, name: "Standing Pike Fold", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Standing Quad Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Half Split Rocks", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Straight Leg Raise", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Elevated Hamstring Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Seated Forward Fold", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Good Morning", sets: 2, reps: 12 },
        { n: 2, name: "Single Leg Hamstring Bridge", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Supine Hamstring Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Standing Pike Fold", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Kettlebell Romanian Deadlift", sets: 2, reps: 12 },
        { n: 2, name: "Single Leg Hamstring Bridge", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Standing Pike Fold", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Elevated Hamstring Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Half Split Rocks", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Straight Leg Raise", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Seated Forward Fold", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Standing Quad Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Single Leg Hamstring Bridge", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Good Morning", sets: 2, reps: 12 },
        { n: 3, name: "Front Split Negatives", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Standing Pike Fold", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const LEGS_DETAILS: Record<string, ExerciseDetail> = {
  "good-morning": {
    targets: ["Hamstrings", "Glutes", "Lower back"],
    cues: ["Soft knees, hands behind the head.", "Push the hips back with a flat back, then stand tall."],
  },
  "straight-leg-raise": {
    targets: ["Hip flexors", "Quads", "Hamstrings"],
    cues: ["Both knees locked straight.", "Lift the leg with control and lower it slowly."],
  },
  "seated-forward-fold": {
    targets: ["Hamstrings", "Calves"],
    cues: ["Sit tall, toes pulled back.", "Fold from the hips, chest toward the knees."],
  },
  "supine-hamstring-stretch": {
    targets: ["Hamstrings"],
    cues: ["Bottom leg long on the floor.", "Pull the straight leg closer gently."],
  },
  "hamstring-bridge": {
    targets: ["Hamstrings", "Glutes"],
    cues: ["Heels far away, knees just slightly bent.", "Dig the heels in and lift the hips."],
  },
  "standing-quad-stretch": {
    targets: ["Quads", "Hip flexors"],
    cues: ["Knees together, stand tall.", "Pull the heel toward the glute and push the hip forward."],
  },
  "kettlebell-romanian-deadlift": {
    targets: ["Hamstrings", "Glutes"],
    cues: ["Soft knees, flat back.", "Push the hips back and keep the bell close to your legs."],
  },
  "half-split-rocks": {
    targets: ["Hamstrings", "Calves"],
    cues: ["Front leg straight, toes up.", "Rock the hips back with a flat back, then forward."],
  },
  "elevated-hamstring-stretch": {
    targets: ["Hamstrings", "Calves"],
    cues: ["Heel on the box, both legs straight.", "Hinge forward with a flat back, not a rounded one."],
  },
  "single-leg-hamstring-bridge": {
    targets: ["Hamstrings", "Glutes"],
    cues: ["One heel far away, the other leg points up.", "Dig the heel in and lift the hips level."],
  },
  "standing-pike-fold": {
    targets: ["Hamstrings", "Calves"],
    cues: ["Feet together, legs straight.", "Pull gently to bring the chest toward the legs."],
  },
  "front-split-negatives": {
    targets: ["Hamstrings", "Hip flexors"],
    cues: ["Hands on the floor, take weight through them.", "Slide the front heel forward slowly, stop before it hurts, then pull back."],
  },
}
