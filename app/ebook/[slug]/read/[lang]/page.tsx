import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEbook, type EbookLang } from "@/lib/ebooks"
import { EbookRenderer } from "@/components/ebook/ebook-renderer"
import { moveBetter } from "@/content/ebooks/move-better"
import type { EbookContent } from "@/content/ebooks/move-better"

export const dynamic = "force-static"

type ContentMap = Record<string, Partial<Record<EbookLang, EbookContent>>>

const CONTENT: ContentMap = {
  // English only for now — translations return once the copy is finalised.
  "move-better": {
    en: moveBetter,
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
