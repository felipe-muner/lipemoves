import { asc, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { videos, categories } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import {
  createCategory,
  createVideo,
  togglePublish,
  deleteVideo,
  deleteCategory,
} from "@/lib/actions/videos"
import { PageHeader } from "@/components/crm/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EntitySelectField } from "@/components/crm/entity-select-field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function VideosAdminPage() {
  await requireDashboardSession()

  const [cats, vids] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(videos).orderBy(desc(videos.createdAt)),
  ])
  const catName = new Map(cats.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        subtitle={`${vids.length} videos · ${cats.length} groups — your kettlebell & mobility library.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add group</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="flex gap-2">
              <Input name="name" placeholder="e.g. Hinge, Shoulders…" required />
              <Button type="submit">Add</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {cats.map((c) => (
                <form action={deleteCategory} key={c.id}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:border-destructive hover:text-destructive"
                    title="Delete group"
                  >
                    {c.name}
                    <span className="text-muted-foreground group-hover:text-destructive">
                      ×
                    </span>
                  </button>
                </form>
              ))}
              {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground">No groups yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Add video */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Add video</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createVideo} className="grid gap-3 sm:grid-cols-2">
              <Input name="title" placeholder="Title" required />
              <Input
                name="bunnyVideoId"
                placeholder="Bunny video ID (GUID)"
                required
              />
              <EntitySelectField
                name="categoryId"
                defaultValue="none"
                searchPlaceholder="Search groups..."
                items={[
                  { id: "none", label: "No group" },
                  ...cats.map((c) => ({ id: c.id, label: c.name })),
                ]}
              />
              <Input
                name="durationSeconds"
                type="number"
                min="0"
                placeholder="Duration (seconds, optional)"
              />
              <Input
                name="description"
                placeholder="Short description (optional)"
                className="sm:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFree" className="size-4" />
                Free preview
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked
                  className="size-4"
                />
                Published
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Add video</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {vids.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No videos yet. Upload to Bunny, then paste the video ID above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vids.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{v.title}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {v.bunnyVideoId}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.categoryId ? catName.get(v.categoryId) ?? "—" : "—"}
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Badge
                        variant={v.isPublished ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {v.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {v.isFree ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Free
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <form action={togglePublish}>
                          <input type="hidden" name="id" value={v.id} />
                          <input
                            type="hidden"
                            name="next"
                            value={(!v.isPublished).toString()}
                          />
                          <Button type="submit" variant="outline" size="sm">
                            {v.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                        </form>
                        <form action={deleteVideo}>
                          <input type="hidden" name="id" value={v.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
