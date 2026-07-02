import { requireDashboardSession } from "@/lib/auth/dashboard"
import { openHips } from "@/content/carousels/open-hips"
import { CarouselRenderer } from "@/components/carousel/carousel-renderer"

export const dynamic = "force-dynamic"

export default async function OpenHipsCarouselPage() {
  await requireDashboardSession()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{openHips.title}</h1>
          <p className="text-sm text-muted-foreground">
            Instagram carousel · 4:5 (1080×1350). Edit{" "}
            <code>content/carousels/open-hips.ts</code>, then run{" "}
            <code>npx tsx scripts/export-carousel.ts open-hips</code> to export
            PNG slides.
          </p>
        </div>
      </div>
      <CarouselRenderer content={openHips} />
    </div>
  )
}
