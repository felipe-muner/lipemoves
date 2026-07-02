import { notFound } from "next/navigation"
import { CarouselRenderer } from "@/components/carousel/carousel-renderer"
import { getCarousel } from "@/lib/carousels"

export const dynamic = "force-static"

export default async function CarouselPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const content = getCarousel(slug)
  if (!content) notFound()
  return <CarouselRenderer content={content} />
}
