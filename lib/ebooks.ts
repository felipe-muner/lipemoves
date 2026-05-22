/**
 * Ebook catalog. One Ebook = one title, multiple language editions.
 * Add a new title by appending to EBOOKS; flip an edition's `available`
 * once its PDF lives in /public/ebooks/.
 */

export type EbookLang = "en" | "pt" | "de" | "he" | "ru"

export const LANG_LABEL: Record<EbookLang, string> = {
  en: "English",
  pt: "Português",
  de: "Deutsch",
  he: "עברית",
  ru: "Русский",
}

export const LANG_FLAG: Record<EbookLang, string> = {
  en: "🇬🇧",
  pt: "🇧🇷",
  de: "🇩🇪",
  he: "🇮🇱",
  ru: "🇷🇺",
}

export interface EbookEdition {
  lang: EbookLang
  available: boolean
  /** Public URL path under /public — only set when available. */
  file?: string
  pages?: number
  sizeMb?: number
  publishedOn?: string
}

export interface Ebook {
  slug: string
  title: string
  subtitle?: string
  description: string
  /** Public URL path to the cover image. */
  cover: string
  editions: EbookEdition[]
}

export const EBOOKS: Ebook[] = [
  {
    slug: "move-better",
    title: "Move Better",
    subtitle: "An eating & movement routine",
    description:
      "After years in motion, I arrived at a simple formula that works for me. Here it is — read in 20 minutes, apply for the rest of your life.",
    cover: "/ebooks/move-better-en-cover.jpg",
    editions: [
      {
        lang: "en",
        available: true,
        file: "/ebooks/move-better-en.pdf",
        pages: 13,
        sizeMb: 19,
        publishedOn: "2026-01-01",
      },
      { lang: "pt", available: false },
      { lang: "de", available: false },
      { lang: "he", available: false },
      { lang: "ru", available: false },
    ],
  },
]

export function getEbook(slug: string): Ebook | undefined {
  return EBOOKS.find((e) => e.slug === slug)
}

export function getEdition(
  ebook: Ebook,
  lang: EbookLang,
): EbookEdition | undefined {
  return ebook.editions.find((e) => e.lang === lang)
}
