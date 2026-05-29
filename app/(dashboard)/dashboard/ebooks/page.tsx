import Image from "next/image"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, BookOpen } from "lucide-react"
import { PageHeader } from "@/components/crm/page-header"
import { EBOOKS, LANG_FLAG, LANG_LABEL } from "@/lib/ebooks"
import { SharePublicLink } from "@/components/crm/share-public-link"
import { EntitySearchFilter } from "@/components/crm/entity-search-filter"
import { parseIdsParam } from "@/lib/utils/url-params"

export const dynamic = "force-dynamic"

export default async function EbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  await requireDashboardSession()
  const { lang = "" } = await searchParams
  const selectedLangs = parseIdsParam(lang)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ebooks"
        subtitle="Every PDF we ship lives here. Public landing page captures emails per language."
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
        <div className="space-y-6">
          {EBOOKS.map((book) => {
            const visibleEditions =
              selectedLangs.size > 0
                ? book.editions.filter((e) => selectedLangs.has(e.lang))
                : book.editions
            const availableCount = book.editions.filter(
              (e) => e.available,
            ).length
            return (
              <Card key={book.slug} className="overflow-hidden">
                <div className="grid gap-0 p-5 sm:grid-cols-[170px_1fr] sm:gap-5">
                  <div className="relative mx-auto aspect-[210/297] w-40 overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-black/5 sm:mx-0 sm:w-full">
                    <Image
                      src={book.cover}
                      alt={`${book.title} cover`}
                      fill
                      sizes="170px"
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="space-y-4 p-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold">{book.title}</h2>
                        {book.subtitle && (
                          <p className="text-sm text-muted-foreground">
                            {book.subtitle}
                          </p>
                        )}
                      </div>
                      <SharePublicLink path={`/ebook/${book.slug}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {book.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {availableCount} of {book.editions.length} languages live
                    </div>
                    <div className="w-full max-w-[240px]">
                      <EntitySearchFilter
                        items={book.editions.map((ed) => ({
                          id: ed.lang,
                          label: LANG_LABEL[ed.lang],
                          emoji: LANG_FLAG[ed.lang],
                        }))}
                        multiple
                        paramName="lang"
                        value={lang}
                        placeholder="Filter by language..."
                        searchPlaceholder="Search language..."
                        emptyText="No matches."
                        allLabel="All languages"
                      />
                    </div>

                    <div className="divide-y border-t">
                      {visibleEditions.map((ed) => (
                        <div
                          key={ed.lang}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {LANG_FLAG[ed.lang]}
                            </span>
                            <span className="text-sm font-medium">
                              {LANG_LABEL[ed.lang]}
                            </span>
                            {ed.available ? (
                              <span className="text-xs text-muted-foreground">
                                {[
                                  ed.pages ? `${ed.pages}p` : null,
                                  ed.sizeMb ? `${ed.sizeMb}MB` : null,
                                  ed.publishedOn
                                    ? format(parseISO(ed.publishedOn), "MMM yyyy")
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Coming soon
                              </Badge>
                            )}
                          </div>
                          {ed.available && (ed.readPath || ed.file) && (
                            <div className="flex items-center gap-1">
                              {ed.readPath && (
                                <Button asChild variant="ghost" size="sm">
                                  <Link
                                    href={ed.readPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Open
                                  </Link>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
