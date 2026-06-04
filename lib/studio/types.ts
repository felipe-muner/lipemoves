// Shared types for the local Video Studio. The Studio lets you upload one or
// more clips and run them through the same scripts/*.sh used on the command
// line (zoom-clip, label-video, frame-picker, cover) — one source of truth.
//
// "Compose" is the unified editing mode: per clip you can apply a Ken Burns
// zoom (in/out) and/or burn a freely-placed text label, then optionally stitch
// every clip into one video. "Frames" is the separate contact-sheet/cover flow.

export type JobStatus = "queued" | "running" | "done" | "error"

export type ClipStatus =
  | "pending"
  | "running"
  | "done"
  | "error"

/** Ken Burns zoom direction for a clip. */
export type ZoomDir = "in" | "out"

export interface FramePickerConfig {
  /** Seconds between sampled frames (0.5 = 2 frames/sec). */
  step: number
}

/** A freely-placed text label burned onto a whole clip (e.g. "1 — HIP
 *  CIRCLES"). Color/opacity/fade are shared (TextStyle); the text + placement
 *  are per clip, dragged on a poster frame in the studio. */
export interface LabelConfig {
  text: string
  /** Free-drag center of the text block, as fractions of the frame (0..1). */
  x: number
  y: number
  /** Widest line's width as a fraction of the frame (from the live preview). */
  width: number
}

/** Shared look for every clip's text label. */
export interface TextStyle {
  /** Hex text color, e.g. "#FFFFFF". */
  color: string
  /** Text opacity, 0..1 (1 = fully opaque; lower it to ghost the text). */
  opacity: number
  /** Fade the label in at the start and out at the end of each clip. */
  fade: boolean
}

/** What to do with one uploaded clip in Compose mode. */
export interface ClipInput {
  /** Ken Burns zoom direction, or null for no zoom. */
  zoom: ZoomDir | null
  /** Text label to burn onto the whole clip, or null for none. */
  label: LabelConfig | null
}

export interface StudioConfig {
  /** Concatenate all processed clips into one final video. */
  join: boolean
  /** When set, extract a contact sheet + frames per clip to enable covers
   *  (the separate Frames mode). Mutually exclusive with Compose. */
  framepicker: FramePickerConfig | null
  /** Shared style for the per-clip text labels (Compose mode). */
  text: TextStyle | null
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
  /** True for Compose jobs (produces playable per-clip videos); false for the
   *  frames-only flow, where only the cover section matters. */
  compose: boolean
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
