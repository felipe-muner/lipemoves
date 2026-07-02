/**
 * Carousel/guide catalog. Each entry is a slide-based guide (the Instagram
 * carousel structure) that we render two ways:
 *   - /carousel/[slug]  → pixel-perfect 1080×1350 slides for PNG export
 *   - /guides/[slug]    → the same slides, scaled responsively for reading
 */
import { longevity, type CarouselContent } from "@/content/carousels/longevity"
import { openHips } from "@/content/carousels/open-hips"

export const CAROUSELS: Record<string, CarouselContent> = {
  longevity,
  "open-hips": openHips,
}

export interface Guide {
  slug: string
  title: string
  subtitle: string
  description: string
  /** Public path to the cover image (e.g. "/ebooks/photos/x.jpg"). */
  cover: string
  /** CSS object-position for the cover crop. */
  focus?: string
  /** Where the card links. Defaults to the /guides/[slug] slide reader; set
   *  this for guides that live elsewhere (e.g. the Move Better ebook). */
  href?: string
  publishedOn: string
}

/** Public-facing guides. Order here = order on the site. */
export const GUIDES: Guide[] = [
  {
    slug: "move-better",
    title: "Move Better",
    subtitle: "Breath, food, movement, rest",
    description:
      "After years in motion, one simple formula for a body built for life. Read in 20 minutes, apply for the rest of it.",
    cover: "/ebooks/move-better-en-cover-v2.jpg",
    focus: "center 30%",
    href: "/ebook/move-better/read/en",
    publishedOn: "2026-05-27",
  },
  {
    slug: "longevity",
    title: "Mobility · Flexibility · Muscle",
    subtitle: "Train to move for life, not for the mirror",
    description:
      "Strength alone won't keep you moving. This is the balance I rebuilt after 30 — mobility first, then flexibility, then muscle.",
    cover: "/ebooks/photos/1SN01474.jpg",
    focus: "center 30%",
    publishedOn: "2026-06-20",
  },
  {
    slug: "open-hips",
    title: "Open Hips",
    subtitle: "Undo a lifetime of sitting",
    description:
      "School to office, thousands of hours in a chair quietly closed the biggest joint you have. Here's how I opened mine back up.",
    cover: "/ebooks/photos/GAB00148.jpg",
    focus: "center 40%",
    publishedOn: "2026-06-23",
  },
]

export function getCarousel(slug: string): CarouselContent | undefined {
  return CAROUSELS[slug]
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
