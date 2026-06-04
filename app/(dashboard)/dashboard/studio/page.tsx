import type { Metadata } from "next"

import { PageHeader } from "@/components/crm/page-header"

import { StudioClient } from "./_components/StudioClient"

export const metadata: Metadata = {
  title: "Studio — Lipe Moves",
  description: "Upload a clip and run it through the LipeMoves video pipeline",
  robots: { index: false, follow: false },
}

export default function StudioPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Video Studio"
        subtitle={
          <>
            Upload clips and{" "}
            <span className="text-emerald-500">compose</span> them — Ken Burns
            zoom, text labels, and stitching — or make a grid-safe cover.
          </>
        }
      />
      <StudioClient />
    </main>
  )
}
