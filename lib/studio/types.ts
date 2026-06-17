// Shared types for the local Video Studio. The Studio lets you upload one or
// more clips and run them through the same scripts/*.sh used on the command
// line (zoom-clip, label-video, frame-picker, cover) — one source of truth.
//
// "Compose" is the unified editing mode: per clip you can apply a Ken Burns
// zoom (in/out) and/or burn a freely-placed text label, then optionally stitch
// every clip into one video. "Frames" is the separate contact-sheet/cover flow.

import type { FontKey } from "./fonts"
import type { BadgeStyle } from "./badge-style"

export type { BadgeStyle }

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

/** A freely-placed text label burned onto a whole clip. A clip can have several
 *  (each with its own font + placement); color/opacity/fade are shared
 *  (TextStyle). Dragged on a poster frame in the studio. */
export interface LabelConfig {
  text: string
  /** Free-drag center of the text block, as fractions of the frame (0..1). */
  x: number
  y: number
  /** Widest line's width as a fraction of the frame (from the live preview). */
  width: number
  /** Font key (see lib/studio/fonts.ts). */
  font: FontKey
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

/** Default center of the enumerate badge (fractions of the frame) — roughly
 *  the old fixed bottom-left spot. Shared by the editor preview and the burn. */
export const BADGE_DEFAULT_X = 0.2
export const BADGE_DEFAULT_Y = 0.82
/** Default badge font size as a fraction of the frame width (72px on 1080). */
export const BADGE_DEFAULT_SIZE = 72 / 1080

/** The enumerate badge for one clip, edited on the poster preview before
 *  rendering: draggable center, resizable font, free text (default
 *  "✅ 1/5" — edit it to drop the check, renumber, etc.). */
export interface BadgeConfig {
  /** What the badge says. */
  text: string
  /** Free-drag center, as fractions of the frame (0..1). */
  x: number
  y: number
  /** Font size as a fraction of the frame width (pill scales with it). */
  size: number
}

/** What to do with one uploaded clip in Compose mode. */
export interface ClipInput {
  /** Ken Burns zoom direction, or null for no zoom. */
  zoom: ZoomDir | null
  /** Text labels to burn onto the whole clip (in paint order). */
  labels: LabelConfig[]
  /** Enumerate badge, or null to skip it on this clip (enumerate off, or the
   *  badge text was cleared in the editor). */
  badge: BadgeConfig | null
}

export interface StudioConfig {
  /** Concatenate all processed clips into one final video. */
  join: boolean
  /** Burn a "✅ 1/5"-style counter badge onto each clip, in upload order —
   *  for drill-series reels (Compose mode). Placed per clip via
   *  ClipInput.badge before rendering. */
  enumerate: boolean
  /** Visual style for the enumerate badge — the classic grey pill or the
   *  white grunge text. Applies to every clip's badge. */
  badgeStyle: BadgeStyle
  /** Overall badge opacity, 0..1 (applies to whichever style). */
  badgeOpacity: number
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
  /** Fill colour (#hex). Defaults to the brand green when omitted. */
  color?: string
}

/** The independently draggable pieces of the flyer layout. */
export type FlyerFragment = "kicker" | "head" | "sub" | "pill" | "brand"

/** A fragment's CENTER as fractions of the canvas (0..1), plus an optional
 *  scale factor (1 = the design size; resized around the center). */
export interface FlyerPoint {
  x: number
  y: number
  s?: number
}

export type FlyerLayout = Partial<Record<FlyerFragment, FlyerPoint>>

/** Default fragment centers per format — mirrors the legacy flyer layout.
 *  KEEP IN SYNC with the D_* defaults in scripts/cover-flyer.sh. */
export const FLYER_DEFAULT_POS: Record<"yt" | "ig", Record<FlyerFragment, FlyerPoint>> = {
  yt: {
    brand: { x: 0.16, y: 0.09 },
    kicker: { x: 0.18, y: 0.22 },
    head: { x: 0.34, y: 0.45 },
    sub: { x: 0.27, y: 0.67 },
    pill: { x: 0.25, y: 0.82 },
  },
  ig: {
    pill: { x: 0.3, y: 0.165 },
    brand: { x: 0.78, y: 0.165 },
    kicker: { x: 0.25, y: 0.7 },
    head: { x: 0.47, y: 0.785 },
    sub: { x: 0.3, y: 0.862 },
  },
}

/** Generate the branded flyer-style cover pair from a chosen frame: YouTube
 *  1280x720 + Instagram Reel 1080x1920 (text kept inside the profile-grid's
 *  center 3:4 crop). Separate from the free-drag CoverRequest flow. */
export interface FlyerRequest {
  /** Index into Job.clips. */
  clip: number
  /** 1-based frame number from that clip's contact sheet. */
  frame: number
  /** Big lime-gradient headline (required). */
  headline: string
  /** Small letterspaced line above the headline. */
  kicker?: string
  /** Second gradient headline line below the first. */
  headline2?: string
  /** White sub line below the headline(s). */
  sub?: string
  /** Lime pill badge (bottom of the YT stack / top-left on IG). */
  pill?: string
  /** Black & white photo treatment (default true). */
  bw?: boolean
  /** Free-drag fragment centers per format (from the studio preview).
   *  Fragments left unset fall back to FLYER_DEFAULT_POS. */
  pos?: { yt?: FlyerLayout; ig?: FlyerLayout }
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
  /** Job-dir-relative paths to the flyer cover pair, once generated. */
  flyerYtName?: string | null
  flyerIgName?: string | null
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
