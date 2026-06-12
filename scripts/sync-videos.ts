/**
 * Re-sync the video library from Bunny (source of truth) into the database
 * DATABASE_URL points at — registers anything uploaded/encoded on Bunny and
 * unpublishes rows whose Bunny video is gone.
 *
 *   pnpm videos:sync                      # local DB
 *   DATABASE_URL=<prod> pnpm videos:sync  # production DB
 */
import { syncAllFromBunny } from "@/lib/bunny/sync"

async function main() {
  const { synced, removed } = await syncAllFromBunny()
  console.log(`✓ synced ${synced} video(s) from Bunny, unpublished ${removed}`)
  process.exit(0) // the db pool would otherwise keep the process alive
}

main().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
