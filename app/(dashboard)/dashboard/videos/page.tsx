import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { videos } from "@/lib/db/schema"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import {
  syncVideosFromBunny,
  togglePublish,
  toggleFree,
  updateVideoTags,
  deleteVideo,
} from "@/lib/actions/videos"
import { PageHeader } from "@/components/crm/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export default async function VideosAdminPage() {
  await requireDashboardSession()

  const vids = await db.select().from(videos).orderBy(desc(videos.createdAt))
  const published = vids.filter((v) => v.isPublished).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        subtitle={`${vids.length} videos · ${published} published — synced from Bunny.`}
        actions={
          <form action={syncVideosFromBunny}>
            <Button type="submit" variant="outline">
              <RefreshCw className="h-4 w-4" />
              Sync from Bunny
            </Button>
          </form>
        }
      />

      <p className="text-sm text-muted-foreground">
        Upload videos at{" "}
        <a
          href="https://dash.bunny.net/stream"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          dash.bunny.net → Stream
        </a>{" "}
        — they appear here (and for members) automatically once encoding
        finishes. Tags come from the video&apos;s <code>tags</code> meta tag,
        or use <code>pnpm flow:publish</code> to convert, upload and tag in one
        command.
      </p>

      <Card>
        <CardContent className="p-0">
          {vids.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No videos yet. Upload to Bunny and hit Sync — or just wait for
              the webhook.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Duration</TableHead>
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
                    <TableCell>
                      <form
                        action={updateVideoTags}
                        className="flex max-w-[260px] items-center gap-1"
                      >
                        <input type="hidden" name="id" value={v.id} />
                        <Input
                          name="tags"
                          defaultValue={(v.tags ?? []).join(", ")}
                          placeholder="hip, shoulder…"
                          className="h-8 text-xs"
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(v.durationSeconds)}
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
                        <form action={toggleFree}>
                          <input type="hidden" name="id" value={v.id} />
                          <input
                            type="hidden"
                            name="next"
                            value={(!v.isFree).toString()}
                          />
                          <Button type="submit" variant="ghost" size="sm">
                            {v.isFree ? "Make paid" : "Make free"}
                          </Button>
                        </form>
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
