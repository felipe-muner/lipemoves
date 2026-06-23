import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEbook, type EbookLang } from "@/lib/ebooks"
import { EbookRenderer } from "@/components/ebook/ebook-renderer"
import { moveBetter } from "@/content/ebooks/move-better"
import { moveBetterPt } from "@/content/ebooks/move-better.pt"
import { moveBetterDe } from "@/content/ebooks/move-better.de"
import { moveBetterRu } from "@/content/ebooks/move-better.ru"
import { moveBetterHe } from "@/content/ebooks/move-better.he"
import { openHips } from "@/content/ebooks/open-hips"
import type { EbookContent } from "@/content/ebooks/move-better"

export const dynamic = "force-static"

type ContentMap = Record<string, Partial<Record<EbookLang, EbookContent>>>

const CONTENT: ContentMap = {
  "move-better": {
    en: moveBetter,
    pt: moveBetterPt,
    de: moveBetterDe,
    he: moveBetterHe,
    ru: moveBetterRu,
  },
  // EN-only for now — translations follow once the copy is approved.
  "open-hips": {
    en: openHips,
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>
}): Promise<Metadata> {
  const { slug, lang } = await params
  const ebook = getEbook(slug)
  const content = CONTENT[slug]?.[lang as EbookLang]
  if (!ebook || !content) return { title: "Not found" }
  return {
    title: `${content.title} — ${lang.toUpperCase()}`,
    description: ebook.description,
  }
}

export default async function EbookReadPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>
}) {
  const { slug, lang } = await params
  const ebook = getEbook(slug)
  const content = CONTENT[slug]?.[lang as EbookLang]
  if (!ebook || !content) notFound()

  const isRtl = lang === "he"

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <EbookRenderer content={content} />
    </div>
  )
}
