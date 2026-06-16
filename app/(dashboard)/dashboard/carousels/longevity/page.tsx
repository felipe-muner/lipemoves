import { requireDashboardSession } from "@/lib/auth/dashboard"
import { longevity } from "@/content/carousels/longevity"
import { CarouselRenderer } from "@/components/carousel/carousel-renderer"

export const dynamic = "force-dynamic"

export default async function LongevityCarouselPage() {
  await requireDashboardSession()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{longevity.title}</h1>
          <p className="text-sm text-muted-foreground">
            Instagram carousel · 4:5 (1080×1350). Edit{" "}
            <code>content/carousels/longevity.ts</code>, then run{" "}
            <code>npx tsx scripts/export-carousel.ts</code> to export PNG slides.
          </p>
        </div>
      </div>
      <CarouselRenderer content={longevity} />
    </div>
  )
}
