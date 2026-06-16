import { notFound } from "next/navigation"
import { CarouselRenderer } from "@/components/carousel/carousel-renderer"
import { longevity, type CarouselContent } from "@/content/carousels/longevity"

export const dynamic = "force-static"

const CONTENT: Record<string, CarouselContent> = {
  longevity,
}

export default async function CarouselPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const content = CONTENT[slug]
  if (!content) notFound()
  return <CarouselRenderer content={content} />
}
