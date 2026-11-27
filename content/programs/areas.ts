// The body-area programs shown on /program (the clickable body map) and
// rendered at /program/<slug>. Open Hips is the finished, sold program; the
// others are drafts with a waitlist until Felipe reviews them and their
// demo clips are made.
import type { Program } from "./hips"
import type { ExerciseDetail } from "./hips-details"
import { shoulders, SHOULDERS_DETAILS } from "./shoulders"
import { wrists, WRISTS_DETAILS } from "./wrists"
import { core, CORE_DETAILS } from "./core"
import { back, BACK_DETAILS } from "./back"
import { legs, LEGS_DETAILS } from "./legs"
import { knees, KNEES_DETAILS } from "./knees"
import { ankles, ANKLES_DETAILS } from "./ankles"

export type AreaProgram = {
  program: Program
  details: Record<string, ExerciseDetail>
  area: string // body-map label
  promise: string // one line under the title
}

export const AREA_PROGRAMS: Record<string, AreaProgram> = {
  shoulders: {
    program: shoulders,
    details: SHOULDERS_DETAILS,
    area: "Neck & Shoulders",
    promise: "Free up tight shoulders and a stiff neck in 4 weeks.",
  },
  wrists: {
    program: wrists,
    details: WRISTS_DETAILS,
    area: "Wrists & Hands",
    promise: "Strong, pain-free wrists for push-ups, handstands and yoga.",
  },
  core: {
    program: core,
    details: CORE_DETAILS,
    area: "Core",
    promise: "A strong, steady middle for every move.",
  },
  back: {
    program: back,
    details: BACK_DETAILS,
    area: "Back & Spine",
    promise: "A mobile, strong spine and less back stiffness.",
  },
  legs: {
    program: legs,
    details: LEGS_DETAILS,
    area: "Hamstrings & Legs",
    promise: "Longer hamstrings and stronger legs.",
  },
  knees: {
    program: knees,
    details: KNEES_DETAILS,
    area: "Knees",
    promise: "Pain-free, resilient knees.",
  },
  ankles: {
    program: ankles,
    details: ANKLES_DETAILS,
    area: "Ankles & Feet",
    promise: "Mobile ankles for a deeper squat and better balance.",
  },
}
