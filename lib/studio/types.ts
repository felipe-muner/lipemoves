// Shared types for the local Video Studio. The Studio lets you upload one or
// more clips and run them through the same scripts/*.sh used on the command
// line (ken-burns, add-caption, frame-picker, cover) — one source of truth.

export type JobStatus = "queued" | "running" | "done" | "error"

export type ClipStatus =
  | "pending"
  | "running"
  | "done"
  | "error"

/** Per-clip caption text (fog animation is a global style on StudioConfig). */
export interface CaptionConfig {
  main: string
  sub: string
}

export interface FramePickerConfig {
  /** Seconds between sampled frames (0.5 = 2 frames/sec). */
  step: number
}

/** What to do with one uploaded clip. */
export interface ClipInput {
  caption: CaptionConfig | null
}

export interface StudioConfig {
  /** Ken Burns zoom (alternating in/out) applied to every clip. */
  kenburns: boolean
  /** Caption animation style for all clips (fog fade-in vs static). */
  fog: boolean
  /** Concatenate all processed clips into one final video (Ken Burns mode). */
  join: boolean
  /** When set, extract a contact sheet + frames per clip to enable covers. */
  framepicker: FramePickerConfig | null
  /** One entry per uploaded file, in upload order. */
  clips: ClipInput[]
}

export type CoverPosition = "top" | "center" | "bottom"

/** Burn the cover onto a chosen frame of a chosen clip. */
export interface CoverRequest {
  /** Index into Job.clips. */
  clip: number
  /** 1-based frame number from that clip's contact sheet. */
  frame: number
  text: string
  /** Vertical preset; used as the starting anchor before any free drag. */
  position: CoverPosition
  /** Free-drag center of the text block, as fractions of the frame (0..1).
   *  When set, these override `position`. Default is centered horizontally. */
  x?: number
  y?: number
  /** Widest line's width as a fraction of the frame (from the live preview).
   *  Drives the burned font size so it matches what you sized on screen.
   *  Only honored together with x and y. */
  width?: number
}

/** Processing state + outputs for a single clip. */
export interface ClipState {
  index: number
  /** Original file name, for display. */
  label: string
  status: ClipStatus
  message?: string
  /** Job-dir-relative path to the processed video (or original if unedited). */
  videoName: string | null
  /** Job-dir-relative path to the contact sheet, when frames were extracted. */
  contactName: string | null
  /** Job-dir-relative dir holding `frames/` (full-res) and `web/` (thumbs). */
  framesPrefix: string | null
  frameCount: number
  /** Job-dir-relative path to the burned cover, once generated. */
  coverName: string | null
}

export interface Job {
  id: string
  createdAt: string
  status: JobStatus
  error?: string
  kenburns: boolean
  clips: ClipState[]
  /** Job-dir-relative path to the single joined video, when joining. */
  joinedName: string | null
  /** Set if joining was requested but failed (per-clip videos still exist). */
  joinError?: string
  /** Absolute working dir — never serialized to the client. */
  dir: string
}

export type SerializedJob = Omit<Job, "dir">

export function serializeJob(job: Job): SerializedJob {
  const { dir: _dir, ...rest } = job
  void _dir
  return rest
}
