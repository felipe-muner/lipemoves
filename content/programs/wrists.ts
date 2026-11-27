// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Wrists & Hands (for push-ups, handstands, yoga). 12 exercises; clip queue in assets/glossary/wrists-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const wrists: Program = {
  slug: "wrists",
  title: "Strong Wrists",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Finger Spreads", sets: 2, reps: 10 },
        { n: 2, name: "Wrist Circles", sets: 2, reps: 10 },
        { n: 3, name: "Wrist Rocks", sets: 2, reps: 10 },
        { n: 4, name: "Prayer Stretch", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Wrist Rocks", sets: 2, reps: 10 },
        { n: 2, name: "Kettlebell Wrist Curls", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Reverse Wrist Stretch", sets: 2, time: "30 Seconds" },
        { n: 4, name: "Fingers-Back Wrist Stretch", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Finger Spreads", sets: 2, reps: 10 },
        { n: 2, name: "Wrist Circles", sets: 2, reps: 10 },
        { n: 3, name: "Prayer Stretch", sets: 2, time: "35 Seconds" },
        { n: 4, name: "Fingers-Back Wrist Stretch", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Fingertip Lifts", sets: 2, reps: 10 },
        { n: 2, name: "Wrist Rocks", sets: 2, reps: 10 },
        { n: 3, name: "Reverse Wrist Stretch", sets: 2, time: "40 Seconds" },
        { n: 4, name: "Prayer Stretch", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Kettlebell Wrist Curls", sets: 2, reps: "10 Each Side" },
        { n: 2, name: "Reverse Wrist Curls", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Fist Rocks", sets: 2, reps: 10 },
        { n: 4, name: "Fingers-Back Wrist Stretch", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Wrist Circles", sets: 2, reps: 10 },
        { n: 2, name: "Fingertip Lifts", sets: 2, reps: 10 },
        { n: 3, name: "Fist Rocks", sets: 2, reps: 10 },
        { n: 4, name: "Reverse Wrist Stretch", sets: 2, time: "40 Seconds" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Kneeling Planche Lean", sets: 2, reps: 12 },
        { n: 2, name: "Fingertip Lifts", sets: 2, reps: 12 },
        { n: 3, name: "Wrist Rocks", sets: 2, reps: 12 },
        { n: 4, name: "Prayer Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Kettlebell Wrist Curls", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Reverse Wrist Curls", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Fist Rocks", sets: 2, reps: 12 },
        { n: 4, name: "Fingers-Back Wrist Stretch", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Kneeling Planche Lean", sets: 2, reps: 12 },
        { n: 2, name: "Finger Spreads", sets: 2, reps: 12 },
        { n: 3, name: "Wrist Circles", sets: 2, reps: 12 },
        { n: 4, name: "Reverse Wrist Stretch", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Planche Lean", sets: 2, reps: 10 },
        { n: 2, name: "Fingertip Lifts", sets: 2, reps: 12 },
        { n: 3, name: "Fist Rocks", sets: 2, reps: 12 },
        { n: 4, name: "Fingers-Back Wrist Stretch", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Kettlebell Wrist Curls", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Reverse Wrist Curls", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Wrist Rocks", sets: 2, reps: 12 },
        { n: 4, name: "Reverse Wrist Stretch", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Planche Lean", sets: 2, reps: 10 },
        { n: 2, name: "Kneeling Planche Lean", sets: 2, reps: 12 },
        { n: 3, name: "Fingertip Lifts", sets: 2, reps: 12 },
        { n: 4, name: "Prayer Stretch", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const WRISTS_DETAILS: Record<string, ExerciseDetail> = {
  "finger-spreads": {
    targets: ["Forearms", "Hands", "Fingers"],
    cues: ["Arms out in front, squeeze tight fists.", "Open the hands and spread the fingers as wide as you can."],
  },
  "wrist-circles": {
    targets: ["Wrists", "Forearms"],
    cues: ["Fingers interlaced, elbows by your ribs.", "Draw big, slow circles; only the wrists move."],
  },
  "wrist-rocks": {
    targets: ["Wrist flexors", "Forearms"],
    cues: ["Palms flat, fingers spread, arms straight.", "Rock the shoulders forward past the hands, then back."],
  },
  "prayer-stretch": {
    targets: ["Wrist flexors", "Forearms"],
    cues: ["Palms flat together, elbows wide.", "Lower the hands slowly and keep the heels of the hands touching."],
  },
  "kettlebell-wrist-curls": {
    targets: ["Wrist flexors", "Grip"],
    cues: ["Forearm on your thigh, palm up, wrist past the knee.", "Curl the wrist up, then lower slowly. Go light."],
  },
  "reverse-wrist-stretch": {
    targets: ["Wrist extensors", "Forearms"],
    cues: ["Backs of the hands on the floor, fingers pointing to your knees.", "Sit back slowly and stop before any pinch."],
  },
  "fingers-back-wrist-stretch": {
    targets: ["Wrist flexors", "Forearms"],
    cues: ["Palms flat, fingers pointing to your knees, arms straight.", "Lean the hips back gently and keep the palms down."],
  },
  "fingertip-lifts": {
    targets: ["Finger flexors", "Forearms"],
    cues: ["Kneeling plank, fingers spread wide.", "Press into the fingertips to lift the palms, then lower them."],
  },
  "reverse-wrist-curls": {
    targets: ["Wrist extensors", "Forearms"],
    cues: ["Forearm on your thigh, palm down.", "Lift the back of the hand, then lower slowly. Go light."],
  },
  "fist-rocks": {
    targets: ["Forearms", "Grip"],
    cues: ["Knuckles flat on the floor, wrists straight.", "Rock forward slowly and keep the wrists from bending."],
  },
  "kneeling-planche-lean": {
    targets: ["Wrist flexors", "Front shoulders"],
    cues: ["Arms locked, palms flat, fingers spread.", "Lean the shoulders past the hands only as far as the wrists feel good."],
  },
  "planche-lean": {
    targets: ["Wrist flexors", "Front shoulders", "Core"],
    cues: ["High plank, arms locked, body in one line.", "Lean forward on your toes slowly and keep the elbows straight."],
  },
}
