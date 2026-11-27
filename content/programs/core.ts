// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Core. 12 exercises; clip queue in assets/glossary/core-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const core: Program = {
  slug: "core",
  title: "Solid Core",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Dead Bug", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Reverse Crunch", sets: 2, reps: 10 },
        { n: 3, name: "Forearm Plank", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Side Plank", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Bird Dog", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Reverse Crunch", sets: 2, reps: 10 },
        { n: 3, name: "Bear Hold", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Side Plank", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Dead Bug", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Bird Dog", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Forearm Plank", sets: 2, time: "35 Seconds" },
        { n: 4, name: "Bear Hold", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Lying Leg Raises", sets: 2, reps: 10 },
        { n: 2, name: "Dead Bug", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Side Plank Hip Dips", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Forearm Plank", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Seated Knee Tucks", sets: 2, reps: 10 },
        { n: 2, name: "Bird Dog", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Side Plank", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Bear Hold", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Lying Leg Raises", sets: 2, reps: 10 },
        { n: 2, name: "Reverse Crunch", sets: 2, reps: 10 },
        { n: 3, name: "Side Plank Hip Dips", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Forearm Plank", sets: 2, time: "40 Seconds" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Hollow Body Hold", sets: 2, time: "30 Seconds" },
        { n: 2, name: "Lying Leg Raises", sets: 2, reps: 12 },
        { n: 3, name: "Seated Knee Tucks", sets: 2, reps: 12 },
        { n: 4, name: "Side Plank", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Dead Bug", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Side Plank Hip Dips", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Bird Dog", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Forearm Plank", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Hollow Body Hold", sets: 2, time: "30 Seconds" },
        { n: 2, name: "Seated Knee Tucks", sets: 2, reps: 12 },
        { n: 3, name: "Reverse Crunch", sets: 2, reps: 12 },
        { n: 4, name: "Bear Hold", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Hollow Rocks", sets: 2, reps: 12 },
        { n: 2, name: "Lying Leg Raises", sets: 2, reps: 12 },
        { n: 3, name: "Side Plank Hip Dips", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Forearm Plank", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Tuck L-Sit Lifts", sets: 2, reps: 10 },
        { n: 2, name: "Hollow Body Hold", sets: 2, time: "45 Seconds" },
        { n: 3, name: "Seated Knee Tucks", sets: 2, reps: 12 },
        { n: 4, name: "Side Plank", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Tuck L-Sit Lifts", sets: 2, reps: 10 },
        { n: 2, name: "Hollow Rocks", sets: 2, reps: 12 },
        { n: 3, name: "Dead Bug", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Bear Hold", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const CORE_DETAILS: Record<string, ExerciseDetail> = {
  "dead-bug": {
    targets: ["Deep abs", "Core control"],
    cues: ["Press your lower back into the floor the whole time.", "Lower the opposite arm and leg slowly, then bring them back."],
  },
  "reverse-crunch": {
    targets: ["Lower abs"],
    cues: ["Arms flat, knees bent over the hips.", "Curl the hips off the floor slowly; do not swing."],
  },
  "forearm-plank": {
    targets: ["Abs", "Obliques", "Shoulders"],
    cues: ["Elbows under the shoulders, body in one line.", "Tuck the tailbone and squeeze the belly and glutes."],
  },
  "side-plank": {
    targets: ["Obliques", "Side core"],
    cues: ["Elbow under the shoulder, feet stacked.", "Lift the hips into one straight line and hold."],
  },
  "bird-dog": {
    targets: ["Core", "Lower back", "Glutes"],
    cues: ["Back flat like a table.", "Reach long through the hand and heel without twisting the hips."],
  },
  "bear-hold": {
    targets: ["Deep abs", "Shoulders", "Quads"],
    cues: ["Hands under the shoulders, knees under the hips.", "Hover the knees an inch off the floor with a flat back."],
  },
  "lying-leg-raises": {
    targets: ["Lower abs", "Hip flexors"],
    cues: ["Press your lower back into the floor.", "Lower the legs slowly; bend the knees a little if your back lifts."],
  },
  "side-plank-hip-dips": {
    targets: ["Obliques"],
    cues: ["Side plank, elbow under the shoulder.", "Dip the hip toward the floor and drive it back up."],
  },
  "seated-knee-tucks": {
    targets: ["Abs", "Hip flexors"],
    cues: ["Lean back on your hands, feet off the floor.", "Pull the knees in, then push the legs long without touching down."],
  },
  "hollow-body-hold": {
    targets: ["Abs", "Hip flexors"],
    cues: ["Lower back glued to the floor.", "Arms by the ears, shoulders and feet just off the floor."],
  },
  "hollow-rocks": {
    targets: ["Abs"],
    cues: ["Lock the hollow shape first.", "Rock like a rocking chair without bending in the middle."],
  },
  "tuck-l-sit-lifts": {
    targets: ["Abs", "Hip flexors", "Triceps"],
    cues: ["Hands beside the hips, arms straight.", "Push the floor away and lift the hips and feet together."],
  },
}
