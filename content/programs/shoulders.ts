// DRAFT placeholder program written by Claude from general coaching knowledge.
// Felipe must review before selling. Same 4-week format as hips.ts.
// Area: Neck & Shoulders. 12 exercises; clip queue in assets/glossary/shoulders-queue.json.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"

export const shoulders: Program = {
  slug: "shoulders",
  title: "Open Shoulders",
  brand: "FELIPE MUNER",
  days: [
    // ───────────── WEEK 1 · GROOVE (2 sets · 30s holds) ─────────────
    {
      week: 1,
      day: 1,
      exercises: [
        { n: 1, name: "Arm Circles", sets: 2, reps: 10 },
        { n: 2, name: "Scapular Push-ups", sets: 2, reps: 10 },
        { n: 3, name: "Neck Side Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Puppy Pose", sets: 2, time: "30 Seconds" },
      ],
    },
    {
      week: 1,
      day: 2,
      exercises: [
        { n: 1, name: "Chin Tucks", sets: 2, reps: 10 },
        { n: 2, name: "Thread the Needle", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Wall Chest Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Cross Body Shoulder Stretch", sets: 2, time: "30s Each Side" },
      ],
    },
    {
      week: 1,
      day: 3,
      exercises: [
        { n: 1, name: "Scapular Push-ups", sets: 2, reps: 10 },
        { n: 2, name: "Arm Circles", sets: 2, reps: 10 },
        { n: 3, name: "Neck Side Stretch", sets: 2, time: "30s Each Side" },
        { n: 4, name: "Puppy Pose", sets: 2, time: "35 Seconds" },
      ],
    },

    // ───────────── WEEK 2 · OPEN (2 sets · 40s holds) ─────────────
    {
      week: 2,
      day: 1,
      exercises: [
        { n: 1, name: "Prone Y Raise", sets: 2, reps: 10 },
        { n: 2, name: "Thread the Needle", sets: 2, reps: "10 Each Side" },
        { n: 3, name: "Wall Chest Stretch", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Puppy Pose", sets: 2, time: "40 Seconds" },
      ],
    },
    {
      week: 2,
      day: 2,
      exercises: [
        { n: 1, name: "Scapular Push-ups", sets: 2, reps: 10 },
        { n: 2, name: "Clasped Hands Chest Opener", sets: 2, reps: 10 },
        { n: 3, name: "Neck Side Stretch", sets: 2, time: "40s Each Side" },
        { n: 4, name: "Cross Body Shoulder Stretch", sets: 2, time: "40s Each Side" },
      ],
    },
    {
      week: 2,
      day: 3,
      exercises: [
        { n: 1, name: "Prone Y Raise", sets: 2, reps: 10 },
        { n: 2, name: "Chin Tucks", sets: 2, reps: 10 },
        { n: 3, name: "Thread the Needle", sets: 2, reps: "10 Each Side" },
        { n: 4, name: "Puppy Pose", sets: 2, time: "40 Seconds" },
      ],
    },

    // ───────────── WEEK 3 · END RANGE (2 sets · 45s holds) ─────────────
    {
      week: 3,
      day: 1,
      exercises: [
        { n: 1, name: "Side-Lying External Rotation", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Prone Y Raise", sets: 2, reps: 12 },
        { n: 3, name: "Wall Chest Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Puppy Pose", sets: 2, time: "45 Seconds" },
      ],
    },
    {
      week: 3,
      day: 2,
      exercises: [
        { n: 1, name: "Scapular Push-ups", sets: 2, reps: 12 },
        { n: 2, name: "Clasped Hands Chest Opener", sets: 2, reps: 12 },
        { n: 3, name: "Neck Side Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Cross Body Shoulder Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 3,
      day: 3,
      exercises: [
        { n: 1, name: "Side-Lying External Rotation", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Thread the Needle", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Chin Tucks", sets: 2, reps: 12 },
        { n: 4, name: "Puppy Pose", sets: 2, time: "45 Seconds" },
      ],
    },

    // ───────────── WEEK 4 · OWN IT (2 sets · 60s holds) ─────────────
    {
      week: 4,
      day: 1,
      exercises: [
        { n: 1, name: "Prone Y Raise", sets: 2, reps: 12 },
        { n: 2, name: "Side-Lying External Rotation", sets: 2, reps: "12 Each Side" },
        { n: 3, name: "Wall Chest Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Elevated Puppy Pose", sets: 2, time: "60 Seconds" },
      ],
    },
    {
      week: 4,
      day: 2,
      exercises: [
        { n: 1, name: "Scapular Push-ups", sets: 2, reps: 12 },
        { n: 2, name: "Clasped Hands Chest Opener", sets: 2, reps: 12 },
        { n: 3, name: "Neck Side Stretch", sets: 2, time: "45s Each Side" },
        { n: 4, name: "Cross Body Shoulder Stretch", sets: 2, time: "45s Each Side" },
      ],
    },
    {
      week: 4,
      day: 3,
      exercises: [
        { n: 1, name: "Side-Lying External Rotation", sets: 2, reps: "12 Each Side" },
        { n: 2, name: "Prone Y Raise", sets: 2, reps: 12 },
        { n: 3, name: "Thread the Needle", sets: 2, reps: "12 Each Side" },
        { n: 4, name: "Elevated Puppy Pose", sets: 2, time: "60 Seconds" },
      ],
    },
  ],
}

// Coaching detail per exercise slug (exerciseSlug in ./hips-clips). DRAFT.
export const SHOULDERS_DETAILS: Record<string, ExerciseDetail> = {
  "arm-circles": {
    targets: ["Shoulders", "Upper back"],
    cues: ["Arms long, shoulders down away from the ears.", "Draw big, slow circles and keep the ribs still."],
  },
  "scapular-push-ups": {
    targets: ["Serratus", "Shoulder blades"],
    cues: ["High plank, arms locked straight.", "Let the chest sink between the shoulders, then push the floor away."],
  },
  "neck-side-stretch": {
    targets: ["Side of the neck", "Upper traps"],
    cues: ["Sit tall and let the opposite shoulder drop.", "Let the weight of your hand tilt the head; never pull."],
  },
  "puppy-pose": {
    targets: ["Lats", "Shoulders", "Upper back"],
    cues: ["Hips over the knees, arms long in front.", "Let the chest melt toward the floor."],
  },
  "chin-tucks": {
    targets: ["Deep neck flexors", "Back of the neck"],
    cues: ["Eyes level, glide the head straight back.", "Make a double chin, hold a beat, then release."],
  },
  "thread-the-needle": {
    targets: ["Upper back", "Rear shoulder"],
    cues: ["Hips stay over the knees.", "Slide the arm through until the shoulder rests on the floor."],
  },
  "wall-chest-stretch": {
    targets: ["Chest", "Front shoulder"],
    cues: ["Palm on the wall at shoulder height, arm straight.", "Turn the chest away slowly until the front of the shoulder opens."],
  },
  "cross-body-shoulder-stretch": {
    targets: ["Rear shoulder", "Upper back"],
    cues: ["Keep the shoulder down, away from the ear.", "Pull the straight arm across the chest with the other forearm."],
  },
  "prone-y-raise": {
    targets: ["Lower traps", "Rear shoulders"],
    cues: ["Thumbs up, arms in a wide Y.", "Lift from the shoulder blades, not the lower back."],
  },
  "clasped-hands-chest-opener": {
    targets: ["Chest", "Front shoulders", "Biceps"],
    cues: ["Interlace the fingers behind you, arms straight.", "Lift the hands away from your back and stay tall."],
  },
  "side-lying-external-rotation": {
    targets: ["Rotator cuff", "Rear shoulder"],
    cues: ["Elbow glued to your side, bent 90 degrees.", "Rotate the forearm up slowly, only as far as the elbow stays put."],
  },
  "elevated-puppy-pose": {
    targets: ["Lats", "Triceps", "Shoulders"],
    cues: ["Elbows on the box, palms together behind your head.", "Sink the chest below the box with the hips over the knees."],
  },
}
