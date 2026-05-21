import Image from "next/image"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, BookOpen } from "lucide-react"
import { PageHeader } from "@/components/crm/page-header"
import { EBOOKS } from "@/lib/ebooks"

export const dynamic = "force-dynamic"

export default async function EbooksPage() {
  await requireDashboardSession()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ebooks"
        subtitle="Every PDF we ship lives here. Open, download, share."
      />

      {EBOOKS.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
            No ebooks yet. Drop a PDF in <code>/public/ebooks/</code> and
            register it in <code>lib/ebooks.ts</code>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EBOOKS.map((book) => (
            <Card key={book.slug} className="overflow-hidden">
              <div className="relative aspect-[2/3] bg-muted">
                <Image
                  src={book.cover}
                  alt={`${book.title} cover`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold leading-tight">
                      {book.title}
                    </h2>
                    <Badge variant="outline" className="uppercase">
                      {book.lang}
                    </Badge>
                  </div>
                  {book.subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {book.subtitle}
                    </p>
                  )}
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {book.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{book.pages} pages</span>
                  <span>·</span>
                  <span>{book.sizeMb} MB</span>
                  <span>·</span>
                  <span>{format(parseISO(book.publishedOn), "MMM yyyy")}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button asChild size="sm" className="flex-1">
                    <Link
                      href={book.file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={book.file} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
