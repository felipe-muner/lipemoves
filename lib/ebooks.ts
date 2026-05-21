/**
 * Ebook catalog. New PDFs: drop the file in /public/ebooks/, add a
 * matching cover image, append an entry below. The dashboard page reads
 * straight from this list — no DB, no fs scan, works on Vercel.
 */

export interface Ebook {
  slug: string
  title: string
  subtitle?: string
  description: string
  /** ISO 639-1 language code. */
  lang: "en" | "pt"
  /** Public URL path to the PDF (lives in /public). */
  file: string
  /** Public URL path to a cover image (lives in /public). */
  cover: string
  pages: number
  /** Display "weight" in MB (rounded). Just a UX hint, not load-bearing. */
  sizeMb: number
  /** ISO date the edition shipped. */
  publishedOn: string
}

export const EBOOKS: Ebook[] = [
  {
    slug: "move-better-en",
    title: "Move Better",
    subtitle: "An eating & movement routine",
    description:
      "After years in motion, I arrived at a simple formula that works for me. Here it is, no fluff — read in 20 minutes, apply for the rest of your life.",
    lang: "en",
    file: "/ebooks/move-better-en.pdf",
    cover: "/ebooks/move-better-en-cover.jpg",
    pages: 13,
    sizeMb: 19,
    publishedOn: "2026-01-01",
  },
]

export function getEbook(slug: string): Ebook | undefined {
  return EBOOKS.find((e) => e.slug === slug)
}
