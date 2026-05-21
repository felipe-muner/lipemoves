import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Sparkles } from "lucide-react"
import { getEbook } from "@/lib/ebooks"
import { EbookClaimForm } from "@/components/ebook/ebook-claim-form"

export const dynamic = "force-static"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ebook = getEbook(slug)
  if (!ebook) return { title: "Not found" }

  const title = `${ebook.title} — free ebook by Felipe Muner`
  const description = ebook.description
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "book",
      images: [ebook.cover],
    },
    twitter: { card: "summary_large_image", title, description, images: [ebook.cover] },
  }
}

export default async function EbookLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ebook = getEbook(slug)
  if (!ebook) notFound()

  const availableCount = ebook.editions.filter((e) => e.available).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Cover */}
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-[2/3] max-w-sm overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10">
              <Image
                src={ebook.cover}
                alt={`${ebook.title} cover`}
                fill
                sizes="(min-width: 1024px) 40vw, 80vw"
                priority
                className="object-cover"
              />
            </div>
          </div>

          {/* Pitch + form */}
          <div className="order-1 space-y-6 lg:order-2">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Free download
              </div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {ebook.title}
              </h1>
              {ebook.subtitle && (
                <p className="text-lg text-muted-foreground">
                  {ebook.subtitle}
                </p>
              )}
              <p className="text-base text-muted-foreground">
                {ebook.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Available in {availableCount} of {ebook.editions.length}{" "}
                languages today — pick yours below or join the waitlist.
              </p>
            </div>

            <EbookClaimForm ebook={ebook} />
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          <a href="/" className="underline underline-offset-2">
            lipemoves.com
          </a>{" "}
          · Felipe Muner
        </footer>
      </div>
    </div>
  )
}
