import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { CarouselRenderer } from "@/components/carousel/carousel-renderer"
import { CarouselWebView } from "@/components/carousel/carousel-web-view"
import { getCarousel, getGuide, GUIDES } from "@/lib/carousels"

export const dynamic = "force-static"

export function generateStaticParams() {
  // Only guides that have a slide carousel render here; others (e.g. Move
  // Better) link straight to their own reader via Guide.href.
  return GUIDES.filter((g) => getCarousel(g.slug)).map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return { title: "Not found" }
  return {
    title: `${guide.title} — Lipe Moves`,
    description: guide.description,
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = getGuide(slug)
  const content = getCarousel(slug)
  if (!guide || !content) notFound()

  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href="/#guides"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </div>
      <CarouselWebView>
        <CarouselRenderer content={content} />
      </CarouselWebView>
    </div>
  )
}
