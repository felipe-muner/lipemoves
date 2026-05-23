/**
 * Ebook catalog. One Ebook = one title, multiple language editions.
 * Add a new title by appending to EBOOKS; flip an edition's `available`
 * once its PDF lives in /public/ebooks/.
 */

export type EbookLang = "en" | "pt" | "es" | "de" | "he" | "ru"

export const LANG_LABEL: Record<EbookLang, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  de: "Deutsch",
  he: "עברית",
  ru: "Русский",
}

export const LANG_FLAG: Record<EbookLang, string> = {
  en: "🇬🇧",
  pt: "🇧🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  he: "🇮🇱",
  ru: "🇷🇺",
}

export interface EbookEdition {
  lang: EbookLang
  available: boolean
  /** Public URL path under /public — only set when a PDF exists. */
  file?: string
  /** Public path to read the ebook in the browser (HTML render). */
  readPath?: string
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
        readPath: "/ebook/move-better/read/en",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
      {
        lang: "pt",
        available: true,
        file: "/ebooks/move-better-pt.pdf",
        readPath: "/ebook/move-better/read/pt",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
      {
        lang: "es",
        available: true,
        file: "/ebooks/move-better-es.pdf",
        readPath: "/ebook/move-better/read/es",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
      {
        lang: "de",
        available: true,
        file: "/ebooks/move-better-de.pdf",
        readPath: "/ebook/move-better/read/de",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
      {
        lang: "he",
        available: true,
        file: "/ebooks/move-better-he.pdf",
        readPath: "/ebook/move-better/read/he",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
      {
        lang: "ru",
        available: true,
        file: "/ebooks/move-better-ru.pdf",
        readPath: "/ebook/move-better/read/ru",
        pages: 19,
        sizeMb: 10,
        publishedOn: "2026-05-01",
      },
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
