/**
 * Server-side Bunny Stream API client. The library (BUNNY_LIBRARY_ID +
 * BUNNY_API_KEY) is the source of truth for videos and their tags.
 */

const API_BASE = "https://video.bunnycdn.com"

export interface BunnyVideo {
  guid: string
  title: string
  /** Duration in seconds. */
  length: number
  /** 0-2 queued/processing, 3 transcoding, 4 finished, 5 error, 6 upload failed. */
  status: number
  dateUploaded: string
  metaTags: Array<{ property: string; value: string }>
}

/** Encoding finished — safe to show to members. */
export const BUNNY_STATUS_FINISHED = 4

function libraryConfig() {
  const libraryId = process.env.BUNNY_LIBRARY_ID
  const apiKey = process.env.BUNNY_API_KEY
  if (!libraryId || !apiKey) {
    throw new Error("BUNNY_LIBRARY_ID / BUNNY_API_KEY are not set")
  }
  return { libraryId, apiKey }
}

async function bunnyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { libraryId, apiKey } = libraryConfig()
  const res = await fetch(`${API_BASE}/library/${libraryId}${path}`, {
    ...init,
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Bunny API ${path} failed: ${res.status}`)
  }
  return (await res.json()) as T
}

export async function listBunnyVideos(): Promise<BunnyVideo[]> {
  const videos: BunnyVideo[] = []
  let page = 1
  for (;;) {
    const data = await bunnyFetch<{ items: BunnyVideo[]; totalItems: number }>(
      `/videos?page=${page}&itemsPerPage=100&orderBy=date`,
    )
    videos.push(...data.items)
    if (videos.length >= data.totalItems || data.items.length === 0) break
    page += 1
  }
  return videos
}

export async function getBunnyVideo(guid: string): Promise<BunnyVideo> {
  return bunnyFetch<BunnyVideo>(`/videos/${guid}`)
}

export async function deleteBunnyVideo(guid: string): Promise<void> {
  await bunnyFetch(`/videos/${guid}`, { method: "DELETE" })
}

/** Write tags back to Bunny so it stays the source of truth for sync. */
export async function setBunnyVideoTags(
  guid: string,
  tags: string[],
): Promise<void> {
  await bunnyFetch(`/videos/${guid}`, {
    method: "POST",
    body: JSON.stringify({
      metaTags: [{ property: "tags", value: tags.join(",") }],
    }),
  })
}

/** Parse our tags convention from Bunny metaTags: property "tags", CSV value. */
export function tagsFromMetaTags(
  metaTags: Array<{ property: string; value: string }> | null | undefined,
): string[] {
  const raw = metaTags?.find((t) => t.property === "tags")?.value ?? ""
  return [
    ...new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

/** Build a URL-safe slug from a video title. */
export function slugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "video"
  )
}
