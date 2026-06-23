import { requireDashboardSession } from "@/lib/auth/dashboard"
import { openHips } from "@/content/ebooks/open-hips"
import { EbookRenderer } from "@/components/ebook/ebook-renderer"
import { PrintButton } from "@/components/ebook/print-button"

export const dynamic = "force-dynamic"

export default async function OpenHipsEditorPage() {
  await requireDashboardSession()

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{openHips.title}</h1>
          <p className="text-sm text-muted-foreground">
            Edit <code>content/ebooks/open-hips.ts</code> in VS Code, then{" "}
            <strong>Cmd+P → Save as PDF</strong> from here.
          </p>
        </div>
        <PrintButton />
      </div>
      <EbookRenderer content={openHips} />
    </div>
  )
}
