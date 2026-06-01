// Shared types for the local Video Studio. The Studio lets you upload a clip
// and run it through the same scripts/*.sh used on the command line
// (ken-burns, add-caption, frame-picker, cover) — one source of truth.

export type StepId = "kenburns" | "caption" | "framepicker" | "cover"

export type JobStatus = "queued" | "running" | "done" | "error"

export type StepStatus =
  | "pending"
  | "running"
  | "done"
  | "skipped"
  | "error"

export interface CaptionConfig {
  main: string
  sub: string
  fog: boolean
}

export interface FramePickerConfig {
  /** Seconds between sampled frames (0.5 = 2 frames/sec). */
  step: number
}

export type CoverPosition = "top" | "center" | "bottom"

/** Second-phase request: burn the cover onto a chosen contact-sheet frame. */
export interface CoverRequest {
  /** 1-based frame number from the contact sheet. */
  frame: number
  text: string
  position: CoverPosition
}

export interface StudioConfig {
  kenburns: boolean
  caption: CaptionConfig | null
  framepicker: FramePickerConfig | null
  /** Whether to extract frames so a cover can be finished interactively. */
  cover: boolean
}

export interface StepState {
  id: StepId
  label: string
  status: StepStatus
  message?: string
}

export interface Artifact {
  /** File name inside the job dir; fetched via /api/studio/files. */
  name: string
  kind: "video" | "image"
  label: string
}

export interface Job {
  id: string
  createdAt: string
  inputName: string
  status: JobStatus
  steps: StepState[]
  artifacts: Artifact[]
  error?: string
  /** True when a cover was requested — the UI shows the interactive picker. */
  coverRequested: boolean
  /** Number of frames in the contact sheet (so the UI can bound the picker). */
  frameCount: number
  /** Absolute working dir — never serialized to the client. */
  dir: string
}

export type SerializedJob = Omit<Job, "dir">

export function serializeJob(job: Job): SerializedJob {
  const { dir: _dir, ...rest } = job
  void _dir
  return rest
}
