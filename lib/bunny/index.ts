import { createHash } from "crypto"
import { addHours, getUnixTime } from "date-fns"

interface SignedUrlParams {
  videoId: string
  expiresInHours?: number
}

export function getSignedVideoUrl({ videoId, expiresInHours = 6 }: SignedUrlParams): string {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME!
  const tokenKey = process.env.BUNNY_TOKEN_KEY!

  const expires = getUnixTime(addHours(new Date(), expiresInHours))
  const path = `/${videoId}/playlist.m3u8`
  const url = `https://${cdnHostname}${path}`

  const hashableBase = `${tokenKey}${path}${expires}`
  const token = createHash("sha256")
    .update(hashableBase)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return `${url}?token=${token}&expires=${expires}`
}

export function getThumbnailUrl(videoId: string): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID!
  return `https://vz-${libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`
}
