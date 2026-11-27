// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Back & Spine. 12 exercises; clip queue in assets/glossary/back-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const back: Program = {
  slug: "back",
  title: "Free Spine",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Cat Cow", sets: 2, reps: 10 },
        { n: 2, name: "Superman Lifts", sets: 2, reps: 10 },
        { n: 3, name: "Child's Pose", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Cobra Stretch", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Standing Side Bend", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Glute Bridge", sets: 2, reps: 10 },
        { n: 3, name: "Knee Hug", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Supine Twist", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Cat Cow", sets: 2, reps: 10 },
        { n: 2, name: "Standing Side Bend", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Cobra Stretch", sets: 2, time: "35 Seconds" },
        { n: 4, name: "Child's Pose", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Open Book", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Superman Lifts", sets: 2, reps: 10 },
        { n: 3, name: "Supine Twist", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Child's Pose", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Quadruped Thoracic Rotation", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Glute Bridge", sets: 2, reps: 10 },
        { n: 3, name: "Cobra Stretch", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Knee Hug", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Cat Cow", sets: 2, reps: 10 },
        { n: 2, name: "Open Book", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Standing Side Bend", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Supine Twist", sets: 2, time: "40s Each Side" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Jefferson Curl", sets: 2, reps: 10 },
        { n: 2, name: "Superman Lifts", sets: 2, reps: 12 },
        { n: 3, name: "Cobra Stretch", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Child's Pose", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Quadruped Thoracic Rotation", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Open Book", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Glute Bridge", sets: 2, reps: 12 },
        { n: 4, name: "Supine Twist", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Jefferson Curl", sets: 2, reps: 10 },
        { n: 2, name: "Cat Cow", sets: 2, reps: 12 },
        { n: 3, name: "Standing Side Bend", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Knee Hug", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Jefferson Curl", sets: 2, reps: 10 },
        { n: 2, name: "Superman Lifts", sets: 2, reps: 12 },
        { n: 3, name: "Camel Pose", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Child's Pose", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Quadruped Thoracic Rotation", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Open Book", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Cobra Stretch", sets: 2, time: "60 Seconds" },
        { n: 4, name: "Supine Twist", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Jefferson Curl", sets: 2, reps: 10 },
        { n: 2, name: "Glute Bridge", sets: 2, reps: 12 },
        { n: 3, name: "Camel Pose", sets: 2, time: "45 Seconds" },
        { n: 4, name: "Knee Hug", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const BACK_DETAILS: Record<string, ExerciseDetail> = {
  "cat-cow": {
    targets: ["Spine", "Lower back", "Abs"],
    cues: ["Hands under the shoulders, knees under the hips.", "Move one vertebra at a time: round up, then arch down."],
  },
  "superman-lifts": {
    targets: ["Lower back", "Glutes", "Upper back"],
    cues: ["Arms long, eyes on the floor.", "Lift arms, chest and legs together, then lower slowly."],
  },
  "child-s-pose": {
    targets: ["Lower back", "Lats"],
    cues: ["Hips back to the heels, arms long.", "Breathe into your back and let it widen."],
  },
  "cobra-stretch": {
    targets: ["Abs", "Lower back", "Spine"],
    cues: ["Hips stay heavy on the floor.", "Lift the chest with your back; the hands only help."],
  },
  "standing-side-bend": {
    targets: ["Obliques", "Lats", "Side body"],
    cues: ["Arms overhead, hips square.", "Lean straight to the side, not forward."],
  },
  "glute-bridge": {
    targets: ["Glutes", "Lower back"],
    cues: ["Feet flat, close to your glutes.", "Push through the heels and squeeze at the top without arching."],
  },
  "knee-hug": {
    targets: ["Lower back", "Glutes"],
    cues: ["Head down, arms around the shins.", "Hug the knees in and let the lower back soften."],
  },
  "supine-twist": {
    targets: ["Obliques", "Lower back", "Spine"],
    cues: ["Arms wide, both shoulders on the floor.", "Let the knees fall to one side and breathe."],
  },
  "open-book": {
    targets: ["Upper back", "Chest", "Spine rotation"],
    cues: ["Knees stacked and stuck together.", "Open the top arm like a page and follow it with your eyes."],
  },
  "quadruped-thoracic-rotation": {
    targets: ["Upper back", "Spine rotation"],
    cues: ["Hand behind the head, hips still.", "Rotate the elbow to the ceiling and follow it with your eyes."],
  },
  "jefferson-curl": {
    targets: ["Spine", "Hamstrings", "Lower back"],
    cues: ["Chin to chest, roll down one vertebra at a time.", "Go slow, no weight, and roll up with the head last."],
  },
  "camel-pose": {
    targets: ["Abs", "Hip flexors", "Spine"],
    cues: ["Hips forward over the knees.", "Lift the chest first, then reach for the heels."],
  },
}
