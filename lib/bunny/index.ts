import { createHash } from "crypto"
import { addHours, getUnixTime } from "date-fns"

interface SignedUrlParams {
  videoId: string
  expiresInHours?: number
}

function tokenFor(hashable: string): string {
  return createHash("sha256")
    .update(hashable)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

/**
 * Path-embedded directory token (Bunny token auth v2). HLS playlists reference
 * variants/segments with relative paths, which resolve inside the token prefix
 * so every sub-request inherits authentication.
 */
export function getSignedVideoUrl({ videoId, expiresInHours = 6 }: SignedUrlParams): string {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME!
  const tokenKey = process.env.BUNNY_TOKEN_KEY!

  const expires = getUnixTime(addHours(new Date(), expiresInHours))
  const dir = `/${videoId}/`
  // The token_path value is hashed raw (unencoded) but sent URL-encoded.
  const token = tokenFor(`${tokenKey}${dir}${expires}token_path=${dir}`)

  return `https://${cdnHostname}/bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(dir)}${dir}playlist.m3u8`
}

export function getThumbnailUrl(videoId: string): string {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME!
  const tokenKey = process.env.BUNNY_TOKEN_KEY!

  // Token auth is zone-wide, so thumbnails must be signed too.
  const expires = getUnixTime(addHours(new Date(), 6))
  const path = `/${videoId}/thumbnail.jpg`
  const token = tokenFor(`${tokenKey}${path}${expires}`)

  return `https://${cdnHostname}${path}?token=${token}&expires=${expires}`
}
