// Program catalog. One Program = one titled multi-week workout, rendered by
// components/program/program-renderer.tsx and viewable at /program/<slug>.
import type { Program } from "./hips"
import { hips } from "./hips"

export type { Program, WorkoutDay, Exercise } from "./hips"

export const PROGRAMS: Program[] = [hips]

export function getProgram(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug)
}
