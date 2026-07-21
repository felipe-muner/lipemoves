import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProgram, PROGRAMS } from "@/content/programs"
import { ProgramRenderer } from "@/components/program/program-renderer"
import { PrintButton } from "@/components/program/print-button"

export const dynamic = "force-static"

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const program = getProgram(slug)
  if (!program) return { title: "Not found" }
  const title = `${program.title} — 4-week program by Felipe Muner`
  return { title, description: `${program.title}: a 4-week hip flexibility program.` }
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const program = getProgram(slug)
  if (!program) notFound()

  return (
    <div style={{ background: "#1e1e1e", minHeight: "100vh" }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print flex items-center justify-between gap-4 px-6 py-4">
        <div className="text-white">
          <div className="text-xs tracking-widest text-white/50">
            {program.brand}
          </div>
          <div className="text-lg font-semibold">{program.title}</div>
        </div>
        <PrintButton />
      </div>
      <ProgramRenderer program={program} />
    </div>
  )
}
