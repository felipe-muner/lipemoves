// Workout-program content for the "WEEK X DAY Y" PDF format.
// Each exercise's play button links to a YouTube Short. Fill in `youtube`
// with the Short URL once each clip is filmed & uploaded, e.g.
//   youtube: "https://youtube.com/shorts/31-Q548bMFM"
// Leave it as "" and the play button renders but stays unlinked.
//
// Photos live in /public/programs/<slug>/<photo>. Missing photos fall back
// to a grey placeholder so the layout still renders.

export type Exercise = {
  n: number
  name: string
  sets: number
  // Provide EITHER reps OR time (a display label like "30 Seconds").
  reps?: number
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
    {
      week: 1,
      day: 1,
      warmupYoutube: "",
      exercises: [
        { n: 1, name: "Single Leg RDL", sets: 2, reps: 10, photo: "single-leg-rdl.jpg", youtube: "" },
        { n: 2, name: "Lunge Pulse", sets: 2, reps: 10, photo: "lunge-pulse.jpg", youtube: "" },
        { n: 3, name: "Pigeon Stretch", sets: 2, time: "30 Seconds", photo: "pigeon-stretch.jpg", youtube: "" },
        { n: 4, name: "Butterfly Stretch", sets: 2, time: "30 Seconds", photo: "butterfly-stretch.jpg", youtube: "" },
      ],
    },
  ],
}
